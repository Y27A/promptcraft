import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "wouter";
import { History as HistoryIcon, Star, Trash2, ExternalLink, Search } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE, formatAge } from "@/lib/utils";

export default function History() {
  usePageTitle("History");
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  const authFetch = async (path: string, init?: RequestInit) => {
    const token = await getToken();
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
      credentials: "include",
    });
  };

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const r = await authFetch("/api/sessions");
      return r.json();
    },
  });

  const { data: social } = useQuery({
    queryKey: ["social-mine"],
    queryFn: async () => {
      const r = await authFetch("/api/social/mine");
      return r.json();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => authFetch(`/api/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sessions"] }); toast.success("Session deleted"); },
  });

  const favMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await authFetch(`/api/sessions/${id}/favorite`, { method: "POST" });
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-mine"] }),
  });

  const favorites: number[] = social?.favorites ?? [];

  const filtered = sessions.filter((s: any) => {
    if (favOnly && !favorites.includes(s.id)) return false;
    if (search && !(s.title ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Session History</h1>
        <p className="text-muted-foreground">Resume past conversations.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full rounded-xl border border-border bg-muted pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={() => setFavOnly((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
            favOnly ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400" : "border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Star className="h-4 w-4" /> Favorites
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
          <h3 className="font-semibold text-lg mb-1">No sessions yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start a conversation in the builder.</p>
          <Link href="/builder" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Open builder
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s: any) => (
            <div key={s.id} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center justify-between gap-3 hover:border-primary/30 transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{s.title ?? "Untitled session"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatAge(Date.now() - new Date(s.updatedAt).getTime())}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => favMut.mutate(s.id)}
                  className={`p-1.5 rounded-lg transition-colors ${favorites.includes(s.id) ? "text-yellow-400 hover:bg-yellow-400/10" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Star className="h-4 w-4" fill={favorites.includes(s.id) ? "currentColor" : "none"} />
                </button>
                <Link href={`/builder?session=${s.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                  <ExternalLink className="h-3 w-3" /> Resume
                </Link>
                <button onClick={() => deleteMut.mutate(s.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
