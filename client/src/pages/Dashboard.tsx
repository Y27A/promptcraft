import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "wouter";
import { Bookmark, Heart, Tag, Clock, Search, Trash2, Copy, Download, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";
import { exportPrompt } from "@/lib/export";

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [favOnly, setFavOnly] = useState(false);

  const authFetch = async (path: string, init?: RequestInit) => {
    const token = await getToken();
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
      credentials: "include",
    });
  };

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompts", search, category, favOnly],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (category !== "all") q.set("category", category);
      if (favOnly) q.set("favoritesOnly", "true");
      const r = await authFetch(`/api/prompts?${q}`);
      return r.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["prompt-stats"],
    queryFn: async () => {
      const r = await authFetch("/api/prompts/stats");
      return r.json();
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => authFetch(`/api/prompts/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["prompts"] }); toast.success("Prompt deleted"); },
  });

  const shareMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await authFetch(`/api/prompts/${id}/share`, { method: "POST" });
      return r.json();
    },
    onSuccess: (data) => {
      const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${data.shareToken}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    },
  });

  const categories = ["all", ...Array.from(new Set(prompts.map((p: any) => p.category)))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Prompts</h1>
        <p className="text-muted-foreground">Your saved prompt library.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: Bookmark },
            { label: "Favorites", value: stats.favorites, icon: Heart },
            { label: "Categories", value: Object.keys(stats.byCategory ?? {}).length, icon: Tag },
            { label: "Recent", value: stats.recent?.length ?? 0, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="w-full rounded-xl border border-border bg-muted pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                category === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setFavOnly((v) => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              favOnly ? "bg-pink-500/10 border-pink-500/40 text-pink-400" : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Heart className="h-3.5 w-3.5" /> Favorites
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bookmark className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
          <h3 className="font-semibold text-lg mb-1">No prompts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Generate and save prompts from the builder.</p>
          <Link href="/builder" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Open builder
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {prompts.map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug line-clamp-1">{p.title}</h3>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                  {p.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{p.content.slice(0, 100)}…</p>
              {p.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.slice(0, 3).map((t: string) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { navigator.clipboard.writeText(p.content); toast.success("Copied"); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => exportPrompt(p.title, p.content, "md")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Download">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { sessionStorage.setItem("promptcraft:prefillInput", p.content); window.location.href = `${import.meta.env.BASE_URL}builder?refine=1`; }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Refine">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => shareMut.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Share">
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteMut.mutate(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-auto" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
