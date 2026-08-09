import { useState } from "react";
import { useLocation } from "wouter";
import { FolderOpen, Plus, Trash2, ExternalLink, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatAge } from "@/lib/utils";
import { readJSON, writeJSON } from "@/lib/storage";

type Project = { id: string; name: string; color: string; ts: number };
type HistoryEntry = { id: string; title: string; messages: any[]; versions: any; ts: number; projectId?: string };

const COLORS = ["#7c3aed","#db2777","#059669","#ea580c","#2563eb","#0891b2","#ca8a04","#dc2626"];

function loadProjects(): Project[] {
  return readJSON<Project[]>("pc:projects", []);
}
function loadHistory(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>("pc:history", []);
}
function saveProjects(p: Project[]): boolean { return writeJSON("pc:projects", p); }
function saveHistory(h: HistoryEntry[]): boolean { return writeJSON("pc:history", h); }

export default function Projects() {
  usePageTitle("Projects");
  const [, navigate] = useLocation();
  const [projects, setProjects] = useState<Project[]>(loadProjects);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  const createProject = () => {
    if (!newName.trim()) return;
    const p: Project = { id: Date.now().toString(), name: newName.trim(), color: newColor, ts: Date.now() };
    const updated = [p, ...projects];
    if (!saveProjects(updated)) {
      toast.error("Couldn't create the project — browser storage is full or unavailable");
      return;
    }
    setProjects(updated);
    setCreating(false); setNewName(""); setNewColor(COLORS[0]);
    toast.success("Project created");
  };

  const deleteProject = (id: string) => {
    const updatedP = projects.filter(p => p.id !== id);
    const updatedH = history.map(h => h.projectId === id ? { ...h, projectId: undefined } : h);
    if (!saveProjects(updatedP) || !saveHistory(updatedH)) {
      toast.error("Couldn't delete the project — browser storage is unavailable");
      return;
    }
    setProjects(updatedP);
    setHistory(updatedH);
    if (activeProject === id) setActiveProject(null);
    toast.success("Project deleted");
  };

  const removeFromProject = (sessionId: string) => {
    const updated = history.map(h => h.id === sessionId ? { ...h, projectId: undefined } : h);
    if (!saveHistory(updated)) {
      toast.error("Couldn't update the project — browser storage is unavailable");
      return;
    }
    setHistory(updated);
  };

  const resume = (entry: HistoryEntry) => {
    sessionStorage.setItem("pc:resume", JSON.stringify(entry));
    navigate("/builder?resume=1");
  };

  const projectSessions = (projectId: string) => history.filter(h => h.projectId === projectId);

  const active = projects.find(p => p.id === activeProject);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Projects</h1>
          <p className="text-muted-foreground">Organise your prompts into workspaces.</p>
        </div>
        <button onClick={() => { setCreating(true); setActiveProject(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 16px hsl(var(--primary) / 0.3)" }}>
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">New project</h3>
            <button onClick={() => setCreating(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <input
            autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && createProject()}
            placeholder="Project name…"
            className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring mb-4"
          />
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Color</span>
            {COLORS.map(c => (
              <button key={c} onClick={() => setNewColor(c)}
                className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                style={{ background: c, outline: newColor === c ? `2px solid ${c}` : "none", outlineOffset: 2 }} />
            ))}
          </div>
          <button onClick={createProject}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: newColor }}>
            Create
          </button>
        </div>
      )}

      {/* Project list */}
      {!activeProject && (
        projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
            <h3 className="font-semibold text-lg mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground">Create a project to group your sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => {
              const sessions = projectSessions(p.id);
              return (
                <div key={p.id} className="rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => setActiveProject(p.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: p.color + "22", border: `1px solid ${p.color}44` }}>
                      <FolderOpen className="h-4 w-4" style={{ color: p.color }} />
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h3 className="font-semibold mb-1">{p.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Project detail */}
      {activeProject && active && (
        <div>
          <button onClick={() => setActiveProject(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            ← All projects
          </button>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: active.color + "22", border: `1px solid ${active.color}44` }}>
              <FolderOpen className="h-4 w-4" style={{ color: active.color }} />
            </div>
            <h2 className="text-xl font-bold">{active.name}</h2>
          </div>

          {projectSessions(activeProject).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground text-sm">No sessions saved to this project yet.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Use the 💾 button in the Builder output pane to save here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectSessions(activeProject).map(entry => (
                <div key={entry.id} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{entry.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{formatAge(Date.now() - entry.ts)}</span>
                      {entry.versions && <span className="text-xs text-primary/70">V1 + V2</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => resume(entry)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                      <ExternalLink className="h-3 w-3" /> Resume
                    </button>
                    <button onClick={() => removeFromProject(entry.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remove from project">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
