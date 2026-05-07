import { useState } from "react";
import { useLocation } from "wouter";
import { Bookmark, Trash2, Copy, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatAge } from "@/lib/utils";
import { exportPrompt } from "@/lib/export";

type SavedPrompt = { id: string; title: string; content: string; version: 1|2; ts: number };

function load(): SavedPrompt[] {
  try { return JSON.parse(localStorage.getItem("pc:saved") ?? "[]"); } catch { return []; }
}

export default function Saved() {
  usePageTitle("Saved Prompts");
  const [, navigate] = useLocation();
  const [items, setItems] = useState<SavedPrompt[]>(load);
  const [search, setSearch] = useState("");

  const filtered = items.filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()));

  const del = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem("pc:saved", JSON.stringify(updated));
    toast.success("Deleted");
  };

  const copy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied!");
  };

  const refine = (content: string) => {
    sessionStorage.setItem("promptcraft:prefillInput", content);
    navigate("/builder?refine=1");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Prompts</h1>
        <p className="text-muted-foreground">Your personal prompt library.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search saved prompts…"
          className="w-full rounded-xl border border-border bg-muted pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
          <h3 className="font-semibold text-lg mb-1">{items.length === 0 ? "No saved prompts yet" : "No results"}</h3>
          <p className="text-sm text-muted-foreground">Use the 🔖 button in the Builder output pane to save prompts here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatAge(Date.now() - item.ts)}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">V{item.version}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => copy(item.content)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => exportPrompt(item.title, item.content, "md")} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Export .md">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => del(item.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{item.content.slice(0, 200)}…</p>
              <button onClick={() => refine(item.content)}
                className="mt-3 text-xs text-primary hover:underline">
                Refine in builder →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
