import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Subject, TreeNode } from "@/types/study";
import { initialSubjects } from "@/data/mockData";

function updateInTree(nodes: TreeNode[], nodeId: string, updater: (n: TreeNode) => TreeNode): TreeNode[] {
  return nodes.map(n =>
    n.id === nodeId ? updater(n) : { ...n, children: updateInTree(n.children, nodeId, updater) }
  );
}

function removeFromTree(nodes: TreeNode[], nodeId: string): TreeNode[] {
  return nodes.filter(n => n.id !== nodeId).map(n => ({
    ...n,
    children: removeFromTree(n.children, nodeId),
  }));
}

function addToTree(nodes: TreeNode[], parentId: string, newNode: TreeNode): TreeNode[] {
  return nodes.map(n =>
    n.id === parentId
      ? { ...n, children: [...n.children, newNode] }
      : { ...n, children: addToTree(n.children, parentId, newNode) }
  );
}

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

interface StudyContextType {
  subjects: Subject[];
  addSubject: (name: string, icon: string) => void;
  editSubject: (id: string, name: string) => void;
  deleteSubject: (id: string) => void;
  toggleNode: (subjectId: string, nodeId: string) => void;
  addNode: (subjectId: string, parentId: string | null, name: string) => void;
  editNode: (subjectId: string, nodeId: string, name: string) => void;
  deleteNode: (subjectId: string, nodeId: string) => void;
  getProgress: (subject: Subject) => number;
  getTotalStats: () => { subjects: number; chapters: number; completed: number; total: number };
}

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);

  const addSubject = useCallback((name: string, icon: string) => {
    const id = crypto.randomUUID();
    const colors = ["217 91% 60%", "160 70% 42%", "280 60% 55%", "30 80% 55%", "0 70% 55%", "190 80% 45%"];
    setSubjects(prev => [...prev, { id, name, icon, color: colors[prev.length % colors.length], chapters: [] }]);
  }, []);

  const editSubject = useCallback((id: string, name: string) => {
    setSubjects(prev => prev.map(s => (s.id === id ? { ...s, name } : s)));
  }, []);

  const deleteSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleNode = useCallback((subjectId: string, nodeId: string) => {
    setSubjects(prev =>
      prev.map(s =>
        s.id === subjectId
          ? { ...s, chapters: updateInTree(s.chapters, nodeId, n => ({ ...n, completed: !n.completed })) }
          : s
      )
    );
  }, []);

  const addNode = useCallback((subjectId: string, parentId: string | null, name: string) => {
    const newNode: TreeNode = { id: crypto.randomUUID(), name, completed: false, children: [] };
    setSubjects(prev =>
      prev.map(s => {
        if (s.id !== subjectId) return s;
        if (parentId === null) return { ...s, chapters: [...s.chapters, newNode] };
        return { ...s, chapters: addToTree(s.chapters, parentId, newNode) };
      })
    );
  }, []);

  const editNode = useCallback((subjectId: string, nodeId: string, name: string) => {
    setSubjects(prev =>
      prev.map(s =>
        s.id === subjectId
          ? { ...s, chapters: updateInTree(s.chapters, nodeId, n => ({ ...n, name })) }
          : s
      )
    );
  }, []);

  const deleteNode = useCallback((subjectId: string, nodeId: string) => {
    setSubjects(prev =>
      prev.map(s => (s.id === subjectId ? { ...s, chapters: removeFromTree(s.chapters, nodeId) } : s))
    );
  }, []);

  const getProgress = useCallback((subject: Subject) => {
    const { total, completed } = countNodes(subject.chapters);
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }, []);

  const getTotalStats = useCallback(() => {
    let chapters = 0, completed = 0, total = 0;
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
      value={{ subjects, addSubject, editSubject, deleteSubject, toggleNode, addNode, editNode, deleteNode, getProgress, getTotalStats }}
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
