import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Copy, Shuffle, ExternalLink, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE, formatAge } from "@/lib/utils";

export default function Gallery() {
  usePageTitle("Community Gallery");
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => { const r = await fetch(`${API_BASE}/api/gallery`); return r.json(); },
  });

  const filtered = items.filter((item: any) => {
    if (!search) return true;
    return (item.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (item.preview ?? "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-7 w-7 text-secondary" /> Community Gallery
        </h1>
        <p className="text-muted-foreground">Browse and remix prompts shared by the community.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search gallery…"
          className="w-full max-w-sm rounded-xl border border-border bg-muted pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-card h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
          <h3 className="font-semibold text-lg mb-1">No published sessions yet</h3>
          <p className="text-sm text-muted-foreground">Be the first to share from the builder!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item: any) => (
            <div key={item.id} className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-snug line-clamp-1">{item.title}</h3>
                <span className="text-xs text-muted-foreground shrink-0">{formatAge(item.ageMs)}</span>
              </div>
              {item.preview && (
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{item.preview}</p>
              )}
              <div className="flex items-center gap-2 mt-auto pt-1">
                <button
                  onClick={() => { navigator.clipboard.writeText(item.preview ?? ""); toast.success("Copied"); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem("promptcraft:remixPrompt", item.preview ?? "");
                    window.location.href = `${import.meta.env.BASE_URL}builder?remix=${item.slug}`;
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Shuffle className="h-3 w-3" /> Remix
                </button>
                <Link
                  href={`/p/${item.slug}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors ml-auto"
                >
                  <ExternalLink className="h-3 w-3" /> Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
