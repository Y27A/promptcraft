import { BookOpen, Zap, Target, Layers, RefreshCw, Share2 } from "lucide-react";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";

const SECTIONS = [
  {
    icon: Zap,
    title: "What is prompt engineering?",
    body: "Prompt engineering is the art of crafting instructions that get the best results from AI tools like ChatGPT, Claude, and Gemini. A well-crafted prompt tells the AI who it is, what to do, how to do it, and what format to use.",
  },
  {
    icon: Layers,
    title: "Anatomy of a great prompt",
    body: "Every powerful prompt has 8 key components: Role & Persona, Task Instructions, Context, Output Format, Constraints & Goals, Tone & Style, Examples, and Edge Cases. PromptCraft generates all 8 for you automatically.",
  },
  {
    icon: Target,
    title: "Detailed vs Normal versions",
    body: "PromptCraft always gives you two versions. The Detailed version (300–600 words) works best for complex tasks where precision matters. The Normal version (80–150 words) is perfect for quick, everyday use.",
  },
  {
    icon: RefreshCw,
    title: "Refining your prompt",
    body: "After your prompt is generated, you can ask to adjust the tone, format, level of detail, or any specific section. The AI will refine until you're satisfied — no need to start over.",
  },
  {
    icon: Share2,
    title: "Saving and sharing",
    body: "Sign up for free to save prompts to your personal library, add tags, mark favorites, and generate a shareable link. Others can view and remix your prompts from the Community Gallery.",
  },
];

export default function Guide() {
  usePageTitle("How-to Guide");
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-3">How to use PromptCraft</h1>
        <p className="text-lg text-muted-foreground">Everything you need to craft perfect AI prompts.</p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-border/50 bg-card p-6">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary">0{i + 1}</span>
                <h2 className="font-semibold text-lg">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center rounded-2xl border border-primary/20 bg-primary/5 p-8">
        <h2 className="font-bold text-xl mb-2">Ready to try it?</h2>
        <p className="text-muted-foreground mb-6">No sign-up needed. Get 10 free generations instantly.</p>
        <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02] transition-all">
          Open builder
        </Link>
      </div>
    </div>
  );
}
