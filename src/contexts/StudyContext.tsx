import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TreeNode {
  id: string;
  name: string;
  completed: boolean;
  children: TreeNode[];
  node_level: number;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: TreeNode[];
}

interface StudyContextType {
  subjects: Subject[];
  loading: boolean;
  refreshSubjects: () => Promise<void>;
  addSubject: (name: string, icon: string) => Promise<void>;
  editSubject: (id: string, name: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  toggleNode: (nodeId: string) => Promise<void>;
  addNode: (subjectId: string, parentId: string | null, name: string, level: number) => Promise<void>;
  editNode: (nodeId: string, name: string) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  getProgress: (subject: Subject) => number;
  getTotalStats: () => { subjects: number; chapters: number; completed: number; total: number };
}

const StudyContext = createContext<StudyContextType | null>(null);

function countNodes(nodes: TreeNode[]): { total: number; completed: number } {
  return nodes.reduce(
    (acc, n) => {
      if (n.children.length === 0) {
        return { total: acc.total + 1, completed: acc.completed + (n.completed ? 1 : 0) };
      }
      const c = countNodes(n.children);
      return { total: acc.total + c.total, completed: acc.completed + c.completed };
    },
    { total: 0, completed: 0 }
  );
}

function buildTree(
  nodes: Array<{ id: string; name: string; parent_id: string | null; node_level: number; sort_order: number }>,
  progress: Map<string, boolean>,
  parentId: string | null = null
): TreeNode[] {
  return nodes
    .filter((n) => n.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((n) => ({
      id: n.id,
      name: n.name,
      completed: progress.get(n.id) || false,
      node_level: n.node_level,
      children: buildTree(nodes, progress, n.id),
    }));
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSubjects = useCallback(async () => {
    if (!user) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!subjectsData) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    const { data: nodesData } = await supabase
      .from("study_nodes")
      .select("*")
      .order("sort_order", { ascending: true });

    const { data: progressData } = await supabase
      .from("node_progress")
      .select("node_id, completed")
      .eq("user_id", user.id);

    const progress = new Map<string, boolean>();
    progressData?.forEach((p) => progress.set(p.node_id, p.completed));

    const allNodes = nodesData || [];

    const builtSubjects: Subject[] = subjectsData.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color || "217 91% 60%",
      icon: s.icon || "📘",
      chapters: buildTree(
        allNodes.filter((n) => n.subject_id === s.id),
        progress
      ),
    }));

    setSubjects(builtSubjects);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshSubjects();
  }, [refreshSubjects]);

  const addSubject = useCallback(
    async (name: string, icon: string) => {
      if (!user) return;
      const colors = ["217 91% 60%", "160 70% 42%", "280 60% 55%", "30 80% 55%", "0 70% 55%", "190 80% 45%"];
      await supabase.from("subjects").insert({
        name,
        icon,
        color: colors[subjects.length % colors.length],
        created_by: user.id,
        sort_order: subjects.length,
      });
      await refreshSubjects();
    },
    [user, subjects.length, refreshSubjects]
  );

  const editSubject = useCallback(
    async (id: string, name: string) => {
      await supabase.from("subjects").update({ name }).eq("id", id);
      await refreshSubjects();
    },
    [refreshSubjects]
  );

  const deleteSubject = useCallback(
    async (id: string) => {
      await supabase.from("subjects").delete().eq("id", id);
      await refreshSubjects();
    },
    [refreshSubjects]
  );

  const toggleNode = useCallback(
    async (nodeId: string) => {
      if (!user) return;
      // Check existing progress
      const { data: existing } = await supabase
        .from("node_progress")
        .select("id, completed")
        .eq("node_id", nodeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("node_progress")
          .update({
            completed: !existing.completed,
            completed_at: !existing.completed ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("node_progress").insert({
          node_id: nodeId,
          user_id: user.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }
      await refreshSubjects();
    },
    [user, refreshSubjects]
  );

  const addNode = useCallback(
    async (subjectId: string, parentId: string | null, name: string, level: number) => {
      await supabase.from("study_nodes").insert({
        subject_id: subjectId,
        parent_id: parentId,
        name,
        node_level: level,
        sort_order: 0,
      });
      await refreshSubjects();
    },
    [refreshSubjects]
  );

  const editNode = useCallback(
    async (nodeId: string, name: string) => {
      await supabase.from("study_nodes").update({ name }).eq("id", nodeId);
      await refreshSubjects();
    },
    [refreshSubjects]
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      await supabase.from("study_nodes").delete().eq("id", nodeId);
      await refreshSubjects();
    },
    [refreshSubjects]
  );

  const getProgress = useCallback((subject: Subject) => {
    const { total, completed } = countNodes(subject.chapters);
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }, []);

  const getTotalStats = useCallback(() => {
    let chapters = 0,
      completed = 0,
      total = 0;
    for (const s of subjects) {
      chapters += s.chapters.length;
      const c = countNodes(s.chapters);
      completed += c.completed;
      total += c.total;
    }
    return { subjects: subjects.length, chapters, completed, total };
  }, [subjects]);

  return (
    <StudyContext.Provider
      value={{
        subjects,
        loading,
        refreshSubjects,
        addSubject,
        editSubject,
        deleteSubject,
        toggleNode,
        addNode,
        editNode,
        deleteNode,
        getProgress,
        getTotalStats,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}
