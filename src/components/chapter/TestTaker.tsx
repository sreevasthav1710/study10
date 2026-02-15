import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  sort_order: number;
}

interface Test {
  id: string;
  title: string;
  timer_minutes: number;
  deadline: string | null;
  questions: Question[];
}

interface TestTakerProps {
  test: Test;
  onClose: () => void;
}

export function TestTaker({ test, onClose }: TestTakerProps) {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.timer_minutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    // Check existing submission
    const checkExisting = async () => {
      const { data } = await supabase
        .from("test_submissions")
        .select("*")
        .eq("test_id", test.id)
        .eq("student_id", user!.id)
        .maybeSingle();
      if (data?.submitted_at) {
        setExistingSubmission(data);
        setScore(data.score || 0);
        setAnswers((data.answers as Record<string, string>) || {});
        setSubmitted(true);
      }
    };
    checkExisting();
  }, []);

  useEffect(() => {
    if (submitted || existingSubmission) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [submitted, existingSubmission]);

  const handleSubmit = async () => {
    if (submitted) return;
    clearInterval(timerRef.current);

    let correct = 0;
    test.questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) correct++;
    });

    setScore(correct);
    setSubmitted(true);

    const { error } = await supabase.from("test_submissions").upsert({
      test_id: test.id,
      student_id: user!.id,
      answers,
      score: correct,
      total: test.questions.length,
      submitted_at: new Date().toISOString(),
    }, { onConflict: "test_id,student_id" });

    if (error) toast.error("Failed to save submission");
    else toast.success(`Test submitted! Score: ${correct}/${test.questions.length}`);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const timePercent = (timeLeft / (test.timer_minutes * 60)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h3 className="font-semibold text-sm">{test.title}</h3>
        {!submitted && (
          <Badge variant={timeLeft < 60 ? "destructive" : "outline"} className="text-xs">
            <Clock className="h-3 w-3 mr-1" /> {formatTime(timeLeft)}
          </Badge>
        )}
        {submitted && (
          <Badge className="bg-success text-success-foreground">
            Score: {score}/{test.questions.length}
          </Badge>
        )}
      </div>

      {!submitted && (
        <Progress value={timePercent} className={`h-1.5 ${timeLeft < 60 ? "[&>div]:bg-destructive" : ""}`} />
      )}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {test.questions.map((q, i) => (
          <Card key={q.id} className="border shadow-none">
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium">Q{i + 1}. {q.question_text}</p>
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(v) => !submitted && setAnswers({ ...answers, [q.id]: v })}
                disabled={submitted}
              >
                {(["a", "b", "c", "d"] as const).map((opt) => {
                  const isCorrect = submitted && q.correct_option === opt;
                  const isWrong = submitted && answers[q.id] === opt && q.correct_option !== opt;
                  return (
                    <div
                      key={opt}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        isCorrect ? "bg-success/10" : isWrong ? "bg-destructive/10" : ""
                      }`}
                    >
                      <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                      <Label htmlFor={`${q.id}-${opt}`} className="flex-1 cursor-pointer text-xs">
                        {(q as any)[`option_${opt}`]}
                      </Label>
                      {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                      {isWrong && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {!submitted && (
        <Button onClick={handleSubmit} className="w-full">
          Submit Test ({Object.keys(answers).length}/{test.questions.length} answered)
        </Button>
      )}
    </div>
  );
}
