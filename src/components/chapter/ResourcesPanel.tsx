import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Video, Youtube, Upload, Pencil, Trash2, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Resource {
  id: string;
  name: string;
  resource_type: string;
  url: string;
}

interface ResourcesPanelProps {
  chapterNodeId: string;
  isAdmin: boolean;
}

const typeIcons: Record<string, typeof FileText> = {
  note: FileText,
  pdf: FileText,
  word: FileText,
  mp4: Video,
  youtube: Youtube,
};

const typeLabels: Record<string, string> = {
  note: "Note",
  pdf: "PDF",
  word: "Word",
  mp4: "Video",
  youtube: "YouTube",
};

export function ResourcesPanel({ chapterNodeId, isAdmin }: ResourcesPanelProps) {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [name, setName] = useState("");
  const [resourceType, setResourceType] = useState("note");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<Resource | null>(null);

  const fetchResources = async () => {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("chapter_node_id", chapterNodeId)
      .order("sort_order");
    setResources((data as Resource[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, [chapterNodeId]);

  const handleUploadFile = async (): Promise<string | null> => {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const path = `${chapterNodeId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("resources").upload(path, file);
    if (error) {
      toast.error("Upload failed: " + error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setUploading(true);

    let finalUrl = url;
    if (["pdf", "word", "mp4", "note"].includes(resourceType) && file) {
      const uploaded = await handleUploadFile();
      if (!uploaded) { setUploading(false); return; }
      finalUrl = uploaded;
    }

    if (!finalUrl.trim()) {
      toast.error("Please provide a URL or upload a file");
      setUploading(false);
      return;
    }

    if (editingResource) {
      await supabase.from("resources").update({ name: name.trim(), url: finalUrl, resource_type: resourceType }).eq("id", editingResource.id);
      toast.success("Resource updated");
    } else {
      await supabase.from("resources").insert({
        chapter_node_id: chapterNodeId,
        name: name.trim(),
        resource_type: resourceType,
        url: finalUrl,
        created_by: user!.id,
      });
      toast.success("Resource added");
    }

    resetForm();
    fetchResources();
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    await supabase.from("resources").delete().eq("id", id);
    toast.success("Resource deleted");
    fetchResources();
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingResource(null);
    setName("");
    setResourceType("note");
    setUrl("");
    setFile(null);
  };

  const openResource = (r: Resource) => {
    if (r.resource_type === "mp4" || r.resource_type === "youtube") {
      setPlayingVideo(r);
    } else {
      window.open(r.url, "_blank");
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  if (loading) return <p className="text-xs text-muted-foreground px-2">Loading...</p>;

  return (
    <div className="space-y-2">
      {resources.length === 0 && (
        <p className="text-xs text-muted-foreground italic px-1">No resources added yet</p>
      )}

      {resources.map((r) => {
        const Icon = typeIcons[r.resource_type] || FileText;
        return (
          <div key={r.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/50 group text-sm">
            <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <button onClick={() => openResource(r)} className="flex-1 text-left truncate text-primary hover:underline text-xs">
              {r.name}
            </button>
            <span className="text-[10px] text-muted-foreground uppercase">{typeLabels[r.resource_type]}</span>
            {isAdmin && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                  setEditingResource(r);
                  setName(r.name);
                  setResourceType(r.resource_type);
                  setUrl(r.url);
                  setShowAdd(true);
                }}>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setShowAdd(true)}>
          <Plus className="h-3 w-3 mr-1" /> Add Resource
        </Button>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Resource name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="word">Word Document</SelectItem>
                  <SelectItem value="mp4">MP4 Video</SelectItem>
                  <SelectItem value="youtube">YouTube Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {resourceType === "youtube" ? (
              <div className="space-y-2">
                <Label>YouTube URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Upload File</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} accept={
                  resourceType === "pdf" ? ".pdf" :
                  resourceType === "word" ? ".doc,.docx" :
                  resourceType === "mp4" ? ".mp4" :
                  "*"
                } />
                {editingResource && <p className="text-xs text-muted-foreground">Leave empty to keep current file</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? "Uploading..." : editingResource ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Player Dialog */}
      <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{playingVideo?.name}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            {playingVideo?.resource_type === "youtube" ? (
              <iframe
                src={getYoutubeEmbedUrl(playingVideo.url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={playingVideo?.url} controls className="w-full h-full" autoPlay />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
