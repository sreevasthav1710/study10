import { useAuth } from "@/contexts/AuthContext";
import { useStudy } from "@/contexts/StudyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Target, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { subjects, getProgress, getTotalStats } = useStudy();
  const navigate = useNavigate();
  const stats = getTotalStats();
  const overallProgress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);

  const statCards = [
    { label: "Subjects", value: stats.subjects, icon: BookOpen, color: "text-primary" },
    { label: "Chapters", value: stats.chapters, icon: Target, color: "text-primary" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-success" },
    { label: "Progress", value: `${overallProgress}%`, icon: TrendingUp, color: "text-success" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.username}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "admin"
              ? "Manage your student's study progress and content."
              : "Keep going — every step brings you closer to your goals!"}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="shadow-card border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                    </div>
                    <s.icon className={`h-8 w-8 ${s.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Overall Progress */}
        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Overall Progress</h3>
              <span className="text-sm font-medium text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 [&>div]:bg-gradient-primary" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completed} of {stats.total} topics completed
            </p>
          </CardContent>
        </Card>

        {/* Subject Cards */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject, i) => {
              const progress = getProgress(subject);
              return (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Card
                    className="shadow-card border-0 cursor-pointer hover:shadow-elevated transition-shadow"
                    onClick={() => navigate("/subjects")}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{subject.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{subject.name}</h3>
                          <p className="text-xs text-muted-foreground">{subject.chapters.length} chapters</p>
                        </div>
                        <span className="text-sm font-medium" style={{ color: `hsl(${subject.color})` }}>
                          {progress}%
                        </span>
                      </div>
                      <Progress
                        value={progress}
                        className="h-2"
                        style={{ ["--progress-color" as string]: `hsl(${subject.color})` }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Motivational Footer */}
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm italic">
            "Success is the sum of small efforts repeated day in and day out." 🌟
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
