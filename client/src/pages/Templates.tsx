import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAuth, useSafeUser } from "@/lib/clerk-safe";
import { Link } from "wouter";
import { Plus, BookOpen, Wand2, Star } from "lucide-react";
import { Page, FadeUp, AnimCard } from "@/components/ui/page-motion";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  writing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  code: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  research: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  marketing: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  productivity: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  general: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-cyan-400 bg-cyan-400/10",
  intermediate: "text-yellow-400 bg-yellow-400/10",
  advanced: "text-red-400 bg-red-400/10",
};

export default function Templates() {
  usePageTitle("Templates");
  const { getToken } = useSafeAuth();
  const { isSignedIn } = useSafeUser();
  const [category, setCategory] = useState("all");
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/templates`);
      return r.json();
    },
  });

  const { data: userTemplates = [] } = useQuery({
    queryKey: ["user-templates"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return [];
      const r = await fetch(`${API_BASE}/api/user-templates`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      return r.json();
    },
  });

  const categories = ["all", ...Array.from(new Set((templates as any[]).map((t) => t.category as string)))];
  const filtered = category === "all" ? templates : templates.filter((t: any) => t.category === category);

  return (
    <Page className="mx-auto max-w-6xl px-4 py-10">
      <FadeUp className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Templates</h1>
        <p className="text-muted-foreground">Start faster with curated prompts and save your own.</p>
      </FadeUp>

      {/* My Templates */}
      {isSignedIn && <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> My Templates
            </h2>
          </div>
          {userTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No custom templates yet</p>
              <p className="text-sm text-muted-foreground">Save prompts from the builder to create templates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTemplates.map((t: any) => <TemplateCard key={t.id} template={t} isUser />)}
            </div>
          )}
        </section>}

      {!isSignedIn && (
        <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="font-medium mb-2">Sign up to save your own templates</p>
          <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Create free account
          </Link>
        </div>
      )}

      {/* Curated templates */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-secondary" /> Curated by PromptCraft
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                category === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t: any) => <TemplateCard key={t.id} template={t} />)}
        </div>
      </section>
    </Page>
  );
}

function TemplateCard({ template, isUser = false }: { template: any; isUser?: boolean }) {
  const catColor = CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.general;
  const diffColor = DIFFICULTY_COLORS[template.difficulty] ?? DIFFICULTY_COLORS.beginner;
  const href = isUser
    ? `/builder?userTemplate=${template.id}`
    : `/builder?template=${template.id}`;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{template.title}</h3>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${catColor}`}>
          {template.category}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{template.description}</p>
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${diffColor}`}>
          {template.difficulty}
        </span>
        <Link
          href={href}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Wand2 className="h-3 w-3" /> Use template
        </Link>
      </div>
      {template.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
