import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ExternalLink, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  link: string;
  due_date: string | null;
  completed?: boolean;
}

export function AssignmentsPanel({ chapterNodeId, isAdmin }: { chapterNodeId: string; isAdmin: boolean }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [dueDate, setDueDate] = useState("");

  const fetch = async () => {
    const { data } = await supabase
      .from("assignments")
      .select("*")
      .eq("chapter_node_id", chapterNodeId)
      .order("created_at");

    if (data && user) {
      const { data: completions } = await supabase
        .from("assignment_completions")
        .select("assignment_id, completed")
        .eq("student_id", user.id);

      const compMap = new Map(completions?.map((c) => [c.assignment_id, c.completed]) || []);
      setAssignments(data.map((a) => ({ ...a, completed: compMap.get(a.id) || false })));
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [chapterNodeId]);

  const handleAdd = async () => {
    if (!title.trim() || !link.trim()) return;
    await supabase.from("assignments").insert({
      chapter_node_id: chapterNodeId,
      title: title.trim(),
      link: link.trim(),
      due_date: dueDate || null,
      created_by: user!.id,
    });
    toast.success("Assignment added");
    setShowAdd(false);
    setTitle("");
    setLink("");
    setDueDate("");
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    await supabase.from("assignments").delete().eq("id", id);
    toast.success("Assignment deleted");
    fetch();
  };

  const toggleCompletion = async (assignmentId: string, completed: boolean) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("assignment_completions")
      .select("id")
      .eq("assignment_id", assignmentId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("assignment_completions").update({
        completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null,
      }).eq("id", existing.id);
    } else {
      await supabase.from("assignment_completions").insert({
        assignment_id: assignmentId,
        student_id: user.id,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }
    fetch();
  };

  if (loading) return <p className="text-xs text-muted-foreground px-1">Loading...</p>;

  return (
    <div className="space-y-2">
      {assignments.length === 0 && <p className="text-xs text-muted-foreground italic px-1">No assignments yet</p>}

      {assignments.map((a) => (
        <div key={a.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/50 group text-sm">
          {!isAdmin && (
            <Checkbox
              checked={a.completed}
              onCheckedChange={() => toggleCompletion(a.id, !!a.completed)}
              className="data-[state=checked]:bg-success data-[state=checked]:border-success"
            />
          )}
          <a href={a.link} target="_blank" rel="noopener" className="flex-1 text-xs text-primary hover:underline truncate">
            {a.title}
          </a>
          {a.due_date && (
            <Badge variant="outline" className="text-[10px]">
              <Calendar className="h-2.5 w-2.5 mr-0.5" />
              {new Date(a.due_date).toLocaleDateString()}
            </Badge>
          )}
          {isAdmin && (
            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDelete(a.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      ))}

      {isAdmin && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setShowAdd(true)}>
          <Plus className="h-3 w-3 mr-1" /> Add Assignment
        </Button>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Assignment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment name" />
            </div>
            <div className="space-y-2">
              <Label>Link (Google Form, etc.)</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
