import { useState } from "react";
import { useSafeUser } from "@/lib/clerk-safe";
import { Link, useLocation } from "wouter";
import { Plus, BookOpen, Wand2, Star, Trash2 } from "lucide-react";
import { Page, FadeUp } from "@/components/ui/page-motion";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import { openBuilderWith } from "@/lib/builder-nav";

const CATEGORY_COLORS: Record<string, string> = {
  writing: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  code: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  research: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  marketing: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  productivity: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  education: "text-green-400 bg-green-400/10 border-green-400/20",
  business: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  general: "text-gray-400 bg-gray-400/10 border-gray-400/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-cyan-400 bg-cyan-400/10",
  intermediate: "text-yellow-400 bg-yellow-400/10",
  advanced: "text-red-400 bg-red-400/10",
};

const PRESET_TEMPLATES = [
  {
    id: "p1",
    title: "Cold Email Outreach",
    description: "Write personalized cold emails that get replies. Ideal for sales, partnerships, and networking.",
    category: "marketing",
    difficulty: "beginner",
    tags: ["email", "sales", "outreach"],
    prefill: "Write a cold email to a potential client for my SaaS product",
  },
  {
    id: "p2",
    title: "React Component Generator",
    description: "Generate clean, typed React components with hooks and Tailwind styling.",
    category: "code",
    difficulty: "intermediate",
    tags: ["react", "typescript", "tailwind"],
    prefill: "Create a reusable React component with TypeScript and Tailwind CSS",
  },
  {
    id: "p3",
    title: "Blog Post Writer",
    description: "Create engaging, SEO-optimized blog posts on any topic with a clear structure.",
    category: "writing",
    difficulty: "beginner",
    tags: ["blog", "seo", "content"],
    prefill: "Write a blog post about the benefits of AI for small businesses",
  },
  {
    id: "p4",
    title: "Research Summarizer",
    description: "Summarize academic papers and research into clear, actionable insights.",
    category: "research",
    difficulty: "intermediate",
    tags: ["summary", "academic", "analysis"],
    prefill: "Summarize this research paper and extract the key findings and methodology",
  },
  {
    id: "p5",
    title: "Job Description Writer",
    description: "Craft compelling job descriptions that attract top talent and reflect company culture.",
    category: "business",
    difficulty: "beginner",
    tags: ["hiring", "hr", "recruitment"],
    prefill: "Write a job description for a senior frontend developer at a startup",
  },
  {
    id: "p6",
    title: "Lesson Plan Creator",
    description: "Build structured, engaging lesson plans for any subject and skill level.",
    category: "education",
    difficulty: "beginner",
    tags: ["teaching", "curriculum", "education"],
    prefill: "Create a lesson plan for teaching Python basics to beginners",
  },
  {
    id: "p7",
    title: "Code Review Assistant",
    description: "Get thorough code reviews with improvement suggestions, security checks, and best practices.",
    category: "code",
    difficulty: "advanced",
    tags: ["review", "security", "best-practices"],
    prefill: "Review my code for bugs, security issues, and suggest improvements",
  },
  {
    id: "p8",
    title: "Social Media Caption Writer",
    description: "Generate platform-optimized captions for Instagram, LinkedIn, Twitter, and more.",
    category: "marketing",
    difficulty: "beginner",
    tags: ["social", "instagram", "linkedin"],
    prefill: "Write Instagram captions for a fitness brand product launch",
  },
  {
    id: "p9",
    title: "Meeting Summary Writer",
    description: "Turn raw meeting notes into clear summaries with action items and decisions.",
    category: "productivity",
    difficulty: "beginner",
    tags: ["meetings", "notes", "summary"],
    prefill: "Summarize these meeting notes and extract action items and owners",
  },
  {
    id: "p10",
    title: "Business Plan Outline",
    description: "Create a comprehensive business plan outline with market analysis and financial projections.",
    category: "business",
    difficulty: "advanced",
    tags: ["startup", "strategy", "planning"],
    prefill: "Create a business plan outline for a food delivery startup in the Middle East",
  },
  {
    id: "p11",
    title: "Creative Story Starter",
    description: "Generate vivid, original story openings that hook readers from the first sentence.",
    category: "writing",
    difficulty: "beginner",
    tags: ["fiction", "creative", "storytelling"],
    prefill: "Write an opening chapter for a sci-fi novel set in a future Dubai",
  },
  {
    id: "p12",
    title: "API Documentation Writer",
    description: "Generate clear, developer-friendly API documentation with examples and error handling.",
    category: "code",
    difficulty: "advanced",
    tags: ["docs", "api", "developer"],
    prefill: "Write API documentation for a REST endpoint that handles user authentication",
  },
];

export default function Templates() {
  usePageTitle("Templates");
  const { isSignedIn } = useSafeUser();
  const [, navigate] = useLocation();
  const [category, setCategory] = useState("all");
  const [userTemplates, setUserTemplates] = useState<any[]>(
    () => readJSON<any[]>(STORAGE_KEYS.userTemplates, [])
  );

  const deleteUserTemplate = (id: string) => {
    const updated = userTemplates.filter((t: any) => t.id !== id);
    setUserTemplates(updated);
    writeJSON(STORAGE_KEYS.userTemplates, updated);
    toast.success("Template deleted");
  };

  const allCategories = ["all", ...Array.from(new Set(PRESET_TEMPLATES.map((t) => t.category)))];
  const filtered = category === "all" ? PRESET_TEMPLATES : PRESET_TEMPLATES.filter((t) => t.category === category);

  const handleUseTemplate = (prefill: string) => openBuilderWith(navigate, prefill);

  return (
    <Page className="mx-auto max-w-6xl px-4 py-10">
      <FadeUp className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Templates</h1>
        <p className="text-muted-foreground">Start faster with curated prompts and save your own.</p>
      </FadeUp>

      {/* My Templates */}
      {isSignedIn && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> My Templates
            </h2>
          </div>
          {userTemplates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium mb-1">No custom templates yet</p>
              <p className="text-sm text-muted-foreground">Go to <Link href="/saved" className="text-primary underline">Saved Prompts</Link> and click "Save as template".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTemplates.map((t: any) => (
                <TemplateCard key={t.id} template={t} onUse={() => handleUseTemplate(t.content ?? t.title)} onDelete={() => deleteUserTemplate(t.id)} />
              ))}
            </div>
          )}
        </section>
      )}

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
          {allCategories.map((c) => (
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
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onUse={() => handleUseTemplate(t.prefill)} />
          ))}
        </div>
      </section>
    </Page>
  );
}

function TemplateCard({ template, onUse, onDelete }: { template: any; onUse: () => void; onDelete?: () => void }) {
  const catColor = CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.general;
  const diffColor = DIFFICULTY_COLORS[template.difficulty] ?? DIFFICULTY_COLORS.beginner;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-snug">{template.title}</h3>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${catColor}`}>
          {template.category}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{template.description}</p>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${diffColor}`}>
          {template.difficulty ?? "custom"}
        </span>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onUse} className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
            <Wand2 className="h-3 w-3" /> Use
          </button>
        </div>
      </div>
      {template.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
