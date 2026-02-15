import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Doubt {
  id: string;
  message: string;
  status: string;
  created_at: string;
  replies: { id: string; message: string; created_at: string }[];
}

export function DoubtButton({ chapterNodeId, chapterName }: { chapterNodeId: string; chapterName: string }) {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchDoubts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("doubts")
      .select("*")
      .eq("chapter_node_id", chapterNodeId)
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      const withReplies = await Promise.all(
        data.map(async (d) => {
          const { data: replies } = await supabase
            .from("doubt_replies")
            .select("*")
            .eq("doubt_id", d.id)
            .order("created_at");
          return { ...d, replies: replies || [] };
        })
      );
      setDoubts(withReplies as Doubt[]);
    }
  };

  useEffect(() => {
    if (showDialog) fetchDoubts();
  }, [showDialog]);

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("doubts").insert({
      student_id: user.id,
      chapter_node_id: chapterNodeId,
      message: message.trim(),
    });
    if (error) {
      toast.error("Failed to raise doubt");
    } else {
      toast.success("Doubt raised successfully!");
      setMessage("");
      fetchDoubts();
    }
    setSubmitting(false);
  };

  const statusColor = (s: string) => s === "pending" ? "bg-yellow-500/10 text-yellow-600" : s === "replied" ? "bg-primary/10 text-primary" : "bg-success/10 text-success";

  if (user?.role !== "student") return null;

  return (
    <>
      <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => setShowDialog(true)}>
        <HelpCircle className="h-3 w-3 mr-1" /> Raise Doubt
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Doubts — {chapterName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {doubts.map((d) => (
              <div key={d.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">{d.message}</p>
                  <Badge variant="outline" className={statusColor(d.status)}>{d.status}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                {d.replies.map((r) => (
                  <div key={r.id} className="ml-4 pl-3 border-l-2 border-primary/20">
                    <p className="text-sm text-foreground">{r.message}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ))}
            {doubts.length === 0 && <p className="text-sm text-muted-foreground italic">No doubts raised yet</p>}
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your doubt..." rows={3} />
            <Button onClick={handleSubmit} disabled={submitting || !message.trim()} className="w-full">
              {submitting ? "Submitting..." : "Raise Doubt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
