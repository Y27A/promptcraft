import { BookOpen, Zap, Target, Layers, RefreshCw, FolderOpen, Clock, Smartphone } from "lucide-react";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";

const SECTIONS = [
  {
    icon: Zap,
    title: "1. Describe your goal in plain English",
    body: 'Open the Builder and type what you need — no special syntax required. For example: "Write a cold email to a potential client for my design agency" or "Create a prompt for summarising legal documents." The AI understands natural language.',
  },
  {
    icon: Layers,
    title: "2. Get two ready-to-use versions",
    body: "Every generation produces V1 Detailed (600–1000 words) and V2 Concise (150–250 words). V1 includes Role & Persona, Task Instructions, Output Format, Tone, Constraints, and a worked example. V2 captures the core in a tighter paragraph — ideal for quick use.",
  },
  {
    icon: Target,
    title: "3. Use Domain & Tone selectors",
    body: 'Before sending, pick a Domain (e.g. Marketing, Coding, Legal) and a Tone (e.g. Professional, Friendly, Technical) from the dropdowns at the top of the chat. These shape the output without needing extra instructions in your message.',
  },
  {
    icon: RefreshCw,
    title: "4. Refine until it's perfect",
    body: 'After generation, keep chatting to adjust. Say "make it shorter", "add a worked example", or "change the tone to casual". Use the Regen button to redo the last message. Your full conversation is remembered — no need to repeat context.',
  },
  {
    icon: FolderOpen,
    title: "5. Organise with Projects",
    body: 'Create colour-coded Projects from the Projects page. After generating, hit the Save button in the output pane and pick a project. Find everything later by opening the project — each session is resumable with one click.',
  },
  {
    icon: Clock,
    title: "6. Your history is always saved",
    body: "Every completed conversation is automatically saved to History — even if you close the tab or refresh. Open History to search past sessions, resume them, or delete ones you no longer need. Nothing is lost.",
  },
  {
    icon: Smartphone,
    title: "7. Works on mobile too",
    body: "On phones and tablets, use the Chat / Output tabs at the top of the Builder to switch between writing and reading your generated prompts. Copy or export directly from the Output tab.",
  },
];

const TIPS = [
  "Be specific about the audience — \"for a 10-year-old\" vs \"for a senior developer\" changes everything.",
  "Mention the platform — ChatGPT, Claude, and Gemini have different strengths.",
  "Ask for a worked example in your refinement message to see the prompt in action.",
  "Use V2 for everyday tasks and V1 when precision really matters.",
];

export default function Guide() {
  usePageTitle("Guide");
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <BookOpen className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-3">How to use PromptCraft</h1>
        <p className="text-lg text-muted-foreground">From first message to production-ready prompt in under a minute.</p>
      </div>

      <div className="space-y-4 mb-12">
        {SECTIONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-border/50 bg-card p-6">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold mb-1.5">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pro tips */}
      <div className="rounded-2xl border border-border/50 bg-card p-6 mb-10">
        <h2 className="font-bold mb-4">💡 Pro tips</h2>
        <ul className="space-y-2">
          {TIPS.map(t => (
            <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5 shrink-0">→</span> {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center rounded-2xl border border-primary/20 bg-primary/5 p-8">
        <h2 className="font-bold text-xl mb-2">Ready to try it?</h2>
        <p className="text-muted-foreground mb-6">No sign-up needed. Start with 10 free generations.</p>
        <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02] transition-all">
          Open Builder →
        </Link>
      </div>
    </div>
  );
}
