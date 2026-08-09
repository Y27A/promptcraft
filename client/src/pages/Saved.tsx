import { useState } from "react";
import { useLocation } from "wouter";
import { Bookmark, Trash2, Copy, ExternalLink, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatAge } from "@/lib/utils";
import { exportPrompt } from "@/lib/export";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import { copyToClipboard } from "@/lib/clipboard";
import { openBuilderWith } from "@/lib/builder-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";

type SavedPrompt = { id: string; title: string; content: string; version: 1|2; ts: number };
type UserTemplate = { id: string; title: string; content: string; category: string; ts: number };

function load(): SavedPrompt[] {
  return readJSON<SavedPrompt[]>(STORAGE_KEYS.saved, []);
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
    writeJSON(STORAGE_KEYS.saved, updated);
    toast.success("Deleted");
  };

  const saveAsTemplate = (item: SavedPrompt) => {
    const templates = readJSON<UserTemplate[]>(STORAGE_KEYS.userTemplates, []);
    if (templates.some((t) => t.title === item.title)) { toast.error("Already saved as template"); return; }
    templates.unshift({ id: Date.now().toString(), title: item.title, content: item.content, category: "general", ts: Date.now() });
    writeJSON(STORAGE_KEYS.userTemplates, templates.slice(0, 50));
    toast.success("Saved as template → visible in Templates page");
  };

  const refine = (content: string) => openBuilderWith(navigate, content);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Prompts</h1>
        <p className="text-muted-foreground">Your personal prompt library.</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search saved prompts…" className="mb-6" />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={items.length === 0 ? "No saved prompts yet" : "No results"}
          description="Use the 🔖 button in the Builder output pane to save prompts here."
        />
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
                  <button onClick={() => copyToClipboard(item.content)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => saveAsTemplate(item)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Save as template">
                    <LayoutTemplate className="h-3.5 w-3.5" />
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
