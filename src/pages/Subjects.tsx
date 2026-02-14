import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStudy } from "@/contexts/StudyContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { SubjectTree } from "@/components/SubjectTree";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

export default function Subjects() {
  const { user } = useAuth();
  const { subjects, addSubject, editSubject, deleteSubject, toggleNode, addNode, editNode, deleteNode, getProgress } = useStudy();
  const isAdmin = user?.role === "admin";

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set([subjects[0]?.id]));
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectIcon, setNewSubjectIcon] = useState("📘");
  const [addingChapterTo, setAddingChapterTo] = useState<string | null>(null);
  const [newChapterName, setNewChapterName] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSubject = () => {
    if (newSubjectName.trim()) {
      addSubject(newSubjectName.trim(), newSubjectIcon);
      setNewSubjectName("");
      setNewSubjectIcon("📘");
      setShowAddDialog(false);
    }
  };

  const handleAddChapter = (subjectId: string) => {
    if (newChapterName.trim()) {
      addNode(subjectId, null, newChapterName.trim());
      setNewChapterName("");
      setAddingChapterTo(null);
      setExpandedSubjects((prev) => new Set(prev).add(subjectId));
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "Manage subjects, chapters, topics and subtopics" : "Browse your study material"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" /> Add Subject
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {subjects.map((subject) => {
            const progress = getProgress(subject);
            const isExpanded = expandedSubjects.has(subject.id);

            return (
              <motion.div key={subject.id} layout>
                <Card className="shadow-card border-0 overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-5"
                    onClick={() => toggleExpand(subject.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-xl">{subject.icon}</span>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{subject.name}</CardTitle>
                        <div className="flex items-center gap-3 mt-1.5">
                          <Progress value={progress} className="h-1.5 flex-1 max-w-48" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              const name = prompt("Rename subject:", subject.name);
                              if (name?.trim()) editSubject(subject.id, name.trim());
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              if (confirm(`Delete "${subject.name}"?`)) deleteSubject(subject.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 pb-4 px-5">
                          <div className="border-t border-border pt-3">
                            <SubjectTree
                              nodes={subject.chapters}
                              subjectId={subject.id}
                              isAdmin={isAdmin}
                              onToggle={toggleNode}
                              onAdd={addNode}
                              onEdit={editNode}
                              onDelete={deleteNode}
                            />
                            {isAdmin && (
                              <div className="mt-2">
                                {addingChapterTo === subject.id ? (
                                  <div className="flex items-center gap-2 px-2">
                                    <Input
                                      value={newChapterName}
                                      onChange={(e) => setNewChapterName(e.target.value)}
                                      placeholder="New chapter name..."
                                      className="h-8 text-sm"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddChapter(subject.id);
                                        if (e.key === "Escape") setAddingChapterTo(null);
                                      }}
                                    />
                                    <Button size="sm" className="h-8" onClick={() => handleAddChapter(subject.id)}>
                                      Add
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingChapterTo(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-muted-foreground"
                                    onClick={() => setAddingChapterTo(subject.id)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add Chapter
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}

          {subjects.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No subjects yet</p>
              {isAdmin && <p className="text-sm text-muted-foreground mt-1">Click "Add Subject" to get started!</p>}
            </div>
          )}
        </div>
      </div>

      {/* Add Subject Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g., Mathematics"
                onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon (emoji)</Label>
              <Input
                value={newSubjectIcon}
                onChange={(e) => setNewSubjectIcon(e.target.value)}
                placeholder="📘"
                className="w-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSubject} className="bg-gradient-primary">Add Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
