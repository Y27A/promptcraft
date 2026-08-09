import { useState } from "react";
import { useLocation } from "wouter";
import { History as HistoryIcon, Trash2, ExternalLink, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatAge } from "@/lib/utils";
import { readJSON, writeJSON } from "@/lib/storage";

type HistoryEntry = {
  id: string;
  title: string;
  messages: { role: string; content: string }[];
  versions: { v1: string; v2: string } | null;
  ts: number;
};

function loadHistory(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>("pc:history", []);
}

export default function History() {
  usePageTitle("History");
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);

  const filtered = entries.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    if (!writeJSON("pc:history", updated)) {
      toast.error("Couldn't delete — browser storage is unavailable");
      return;
    }
    setEntries(updated);
    toast.success("Session deleted");
  };

  const resume = (entry: HistoryEntry) => {
    sessionStorage.setItem("pc:resume", JSON.stringify(entry));
    navigate("/builder?resume=1");
  };

  const msgCount = (e: HistoryEntry) => e.messages.filter(m => m.role === "user").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Session History</h1>
        <p className="text-muted-foreground">Resume past conversations.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search sessions…"
          className="w-full rounded-xl border border-border bg-muted pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
          <h3 className="font-semibold text-lg mb-1">{entries.length === 0 ? "No sessions yet" : "No results"}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {entries.length === 0 ? "Start a conversation in the builder." : "Try a different search."}
          </p>
          {entries.length === 0 && (
            <button onClick={() => navigate("/builder")} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Open builder
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{entry.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">{formatAge(Date.now() - entry.ts)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> {msgCount(entry)} {msgCount(entry) === 1 ? "message" : "messages"}
                  </span>
                  {entry.versions && <span className="text-xs text-primary/70">V1 + V2 ready</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => resume(entry)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Resume
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
