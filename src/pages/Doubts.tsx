import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, CheckCircle2, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Doubt {
  id: string;
  student_id: string;
  chapter_node_id: string;
  message: string;
  status: string;
  created_at: string;
  student_name?: string;
  chapter_name?: string;
  replies: { id: string; message: string; created_at: string }[];
}

export default function Doubts() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchDoubts = async () => {
    const { data } = await supabase
      .from("doubts")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch student names and chapter names
      const studentIds = [...new Set(data.map((d) => d.student_id))];
      const chapterIds = [...new Set(data.map((d) => d.chapter_node_id))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", studentIds);

      const { data: nodes } = await supabase
        .from("study_nodes")
        .select("id, name")
        .in("id", chapterIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.username]) || []);
      const nodeMap = new Map(nodes?.map((n) => [n.id, n.name]) || []);

      const withDetails = await Promise.all(
        data.map(async (d) => {
          const { data: replies } = await supabase
            .from("doubt_replies")
            .select("*")
            .eq("doubt_id", d.id)
            .order("created_at");
          return {
            ...d,
            student_name: profileMap.get(d.student_id) || "Unknown",
            chapter_name: nodeMap.get(d.chapter_node_id) || "Unknown",
            replies: replies || [],
          };
        })
      );
      setDoubts(withDetails);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoubts();

    // Real-time subscription for new doubts
    const channel = supabase
      .channel("doubts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "doubts" }, (payload) => {
        // Play notification sound
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRiQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQADAABkAGkAbgBnAA==");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
        toast.info("New doubt raised!", { description: "A student has a question" });
        fetchDoubts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleReply = async (doubtId: string) => {
    const msg = replyText[doubtId]?.trim();
    if (!msg || !user) return;
    await supabase.from("doubt_replies").insert({
      doubt_id: doubtId,
      user_id: user.id,
      message: msg,
    });
    await supabase.from("doubts").update({ status: "replied" }).eq("id", doubtId);
    setReplyText({ ...replyText, [doubtId]: "" });
    toast.success("Reply sent");
    fetchDoubts();
  };

  const markResolved = async (doubtId: string) => {
    await supabase.from("doubts").update({ status: "resolved" }).eq("id", doubtId);
    toast.success("Marked as resolved");
    fetchDoubts();
  };

  const filtered = filter === "all" ? doubts : doubts.filter((d) => d.status === filter);

  const statusColor = (s: string) =>
    s === "pending" ? "bg-yellow-500/10 text-yellow-600 border-yellow-300" :
    s === "replied" ? "bg-primary/10 text-primary border-primary/30" :
    "bg-success/10 text-success border-success/30";

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Access denied</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Doubts</h1>
            <p className="text-sm text-muted-foreground">
              {doubts.filter((d) => d.status === "pending").length} pending doubts
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No doubts found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="shadow-card border-0">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{d.student_name}</span>
                          <span className="text-xs text-muted-foreground">in</span>
                          <span className="text-sm font-medium text-primary">{d.chapter_name}</span>
                        </div>
                        <p className="text-sm text-foreground">{d.message || "(No message)"}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                          {new Date(d.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColor(d.status)}>{d.status}</Badge>
                    </div>

                    {/* Replies */}
                    {d.replies.length > 0 && (
                      <div className="space-y-2 ml-4 border-l-2 border-primary/20 pl-3">
                        {d.replies.map((r) => (
                          <div key={r.id}>
                            <p className="text-sm text-foreground">{r.message}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    {d.status !== "resolved" && (
                      <div className="flex gap-2">
                        <Textarea
                          value={replyText[d.id] || ""}
                          onChange={(e) => setReplyText({ ...replyText, [d.id]: e.target.value })}
                          placeholder="Type a reply..."
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" className="h-8" onClick={() => handleReply(d.id)} disabled={!replyText[d.id]?.trim()}>
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => markResolved(d.id)}>
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
