import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, ClipboardList, Trash2, Play } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { TestTaker } from "./TestTaker";

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

export function TestsPanel({ chapterNodeId, isAdmin }: { chapterNodeId: string; isAdmin: boolean }) {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [takingTest, setTakingTest] = useState<Test | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [timer, setTimer] = useState(30);
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState<Omit<Question, "id" | "sort_order">[]>([
    { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a" },
  ]);

  const fetchTests = async () => {
    const { data } = await supabase
      .from("tests")
      .select("*")
      .eq("chapter_node_id", chapterNodeId)
      .order("created_at", { ascending: false });

    if (data) {
      const testsWithQ = await Promise.all(
        data.map(async (t) => {
          const { data: qs } = await supabase
            .from("test_questions")
            .select("*")
            .eq("test_id", t.id)
            .order("sort_order");
          return { ...t, questions: qs || [] } as Test;
        })
      );
      setTests(testsWithQ);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTests(); }, [chapterNodeId]);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a" }]);
  };

  const updateQuestion = (i: number, field: string, value: string) => {
    const updated = [...questions];
    (updated[i] as any)[field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (i: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const handleCreate = async () => {
    if (!title.trim() || questions.some((q) => !q.question_text.trim())) {
      toast.error("Please fill all required fields");
      return;
    }

    const { data: testData, error } = await supabase.from("tests").insert({
      chapter_node_id: chapterNodeId,
      title: title.trim(),
      timer_minutes: timer,
      deadline: deadline || null,
      created_by: user!.id,
    }).select().single();

    if (error || !testData) { toast.error("Failed to create test"); return; }

    const questionsToInsert = questions.map((q, i) => ({
      test_id: testData.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      sort_order: i,
    }));

    await supabase.from("test_questions").insert(questionsToInsert);
    toast.success("Test created!");
    resetForm();
    fetchTests();
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Delete this test?")) return;
    await supabase.from("tests").delete().eq("id", testId);
    toast.success("Test deleted");
    fetchTests();
  };

  const resetForm = () => {
    setShowCreate(false);
    setTitle("");
    setTimer(30);
    setDeadline("");
    setQuestions([{ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: "a" }]);
  };

  if (loading) return <p className="text-xs text-muted-foreground px-1">Loading...</p>;

  if (takingTest) {
    return <TestTaker test={takingTest} onClose={() => { setTakingTest(null); fetchTests(); }} />;
  }

  return (
    <div className="space-y-2">
      {tests.length === 0 && <p className="text-xs text-muted-foreground italic px-1">No tests yet</p>}

      {tests.map((t) => (
        <div key={t.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/50 group text-sm">
          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-xs truncate">{t.title}</span>
          <Badge variant="outline" className="text-[10px]">
            <Clock className="h-2.5 w-2.5 mr-0.5" />{t.timer_minutes}m
          </Badge>
          <span className="text-[10px] text-muted-foreground">{t.questions.length}Q</span>
          {!isAdmin && (
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setTakingTest(t)}>
              <Play className="h-3 w-3 mr-0.5" /> Start
            </Button>
          )}
          {isAdmin && (
            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteTest(t.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      ))}

      {isAdmin && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3 mr-1" /> Create Test
        </Button>
      )}

      {/* Create Test Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create MCQ Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test title" />
              </div>
              <div className="space-y-2">
                <Label>Timer (minutes)</Label>
                <Input type="number" value={timer} onChange={(e) => setTimer(+e.target.value)} min={1} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline (optional)</Label>
              <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>

            <div className="space-y-4">
              <Label>Questions</Label>
              {questions.map((q, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Q{i + 1}</span>
                    {questions.length > 1 && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeQuestion(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestion(i, "question_text", e.target.value)}
                    placeholder="Question text"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {(["a", "b", "c", "d"] as const).map((opt) => (
                      <Input
                        key={opt}
                        value={(q as any)[`option_${opt}`]}
                        onChange={(e) => updateQuestion(i, `option_${opt}`, e.target.value)}
                        placeholder={`Option ${opt.toUpperCase()}`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Correct Answer</Label>
                    <RadioGroup value={q.correct_option} onValueChange={(v) => updateQuestion(i, "correct_option", v)} className="flex gap-4">
                      {["a", "b", "c", "d"].map((opt) => (
                        <div key={opt} className="flex items-center gap-1">
                          <RadioGroupItem value={opt} id={`q${i}-${opt}`} />
                          <Label htmlFor={`q${i}-${opt}`} className="text-xs">{opt.toUpperCase()}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-3 w-3 mr-1" /> Add Question
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleCreate}>Create Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
