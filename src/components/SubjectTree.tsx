import { useState } from "react";
import { ChevronRight, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { TreeNode } from "@/types/study";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SubjectTreeProps {
  nodes: TreeNode[];
  subjectId: string;
  isAdmin: boolean;
  level?: number;
  onToggle: (subjectId: string, nodeId: string) => void;
  onAdd: (subjectId: string, parentId: string | null, name: string) => void;
  onEdit: (subjectId: string, nodeId: string, name: string) => void;
  onDelete: (subjectId: string, nodeId: string) => void;
}

const levelLabels = ["Chapter", "Topic", "Subtopic"];
const levelColors = [
  "border-primary/20",
  "border-success/20",
  "border-muted-foreground/10",
];

function TreeNodeItem({
  node,
  subjectId,
  isAdmin,
  level,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: TreeNode;
  subjectId: string;
  isAdmin: boolean;
  level: number;
  onToggle: SubjectTreeProps["onToggle"];
  onAdd: SubjectTreeProps["onAdd"];
  onEdit: SubjectTreeProps["onEdit"];
  onDelete: SubjectTreeProps["onDelete"];
}) {
  const [expanded, setExpanded] = useState(level === 0);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const canAddChild = level < 2;
  const hasChildren = node.children.length > 0;

  const handleSaveEdit = () => {
    if (editName.trim()) {
      onEdit(subjectId, node.id, editName.trim());
    }
    setEditing(false);
  };

  const handleAddChild = () => {
    if (newName.trim()) {
      onAdd(subjectId, node.id, newName.trim());
      setNewName("");
      setAdding(false);
      setExpanded(true);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 group transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
        >
          {hasChildren || canAddChild ? (
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          ) : (
            <span className="w-4" />
          )}
        </button>

        <Checkbox
          checked={node.completed}
          onCheckedChange={() => onToggle(subjectId, node.id)}
          className="data-[state=checked]:bg-success data-[state=checked]:border-success"
        />

        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
              <Check className="h-3.5 w-3.5 text-success" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ) : (
          <span
            className={cn(
              "text-sm flex-1",
              node.completed && "line-through text-muted-foreground"
            )}
          >
            {node.name}
          </span>
        )}

        <span className="text-[10px] text-muted-foreground uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          {levelLabels[level]}
        </span>

        {isAdmin && !editing && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(true); setEditName(node.name); }}>
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(subjectId, node.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
            {canAddChild && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setAdding(true); setExpanded(true); }}>
                <Plus className="h-3 w-3 text-primary" />
              </Button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("ml-5 pl-3 border-l-2 overflow-hidden", levelColors[level])}
          >
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.id}
                node={child}
                subjectId={subjectId}
                isAdmin={isAdmin}
                level={level + 1}
                onToggle={onToggle}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {adding && (
              <div className="flex items-center gap-2 py-1.5 px-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`New ${levelLabels[level + 1]}...`}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddChild();
                    if (e.key === "Escape") setAdding(false);
                  }}
                />
                <Button size="sm" className="h-7 text-xs" onClick={handleAddChild}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SubjectTree({ nodes, subjectId, isAdmin, level = 0, onToggle, onAdd, onEdit, onDelete }: SubjectTreeProps) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          subjectId={subjectId}
          isAdmin={isAdmin}
          level={level}
          onToggle={onToggle}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {nodes.length === 0 && (
        <p className="text-sm text-muted-foreground italic px-2 py-3">No chapters yet</p>
      )}
    </div>
  );
}
