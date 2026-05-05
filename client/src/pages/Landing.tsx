import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { useSafeUser } from "@/lib/clerk-safe";
import { Zap, BookOpen, Tag, Share2, Users, Star, ArrowRight, CheckCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const DEMO_PROMPTS = [
  {
    user: "Write me a blog post about AI trends",
    ai: `### Version 1: Detailed\nYou are an expert tech journalist with 10 years covering AI...\n\n### Version 2: Normal\nWrite a 1000-word blog post about the top 5 AI trends in 2025...`,
  },
  {
    user: "Help me code a REST API in Python",
    ai: `### Version 1: Detailed\nYou are a senior Python engineer at a top tech company...\n\n### Version 2: Normal\nBuild a FastAPI REST API with CRUD endpoints for a user system...`,
  },
  {
    user: "Create a marketing email for my SaaS product",
    ai: `### Version 1: Detailed\nYou are a B2B SaaS copywriter who has driven $10M+ in pipeline...\n\n### Version 2: Normal\nWrite a cold outreach email for a project management tool targeting CTOs...`,
  },
];

const FEATURES = [
  { icon: Zap, title: "Instant Generation", desc: "Zero wait — the AI crafts your prompt the moment you hit send." },
  { icon: BookOpen, title: "Two Versions Always", desc: "Get a detailed long-form prompt AND a concise version, side by side." },
  { icon: Tag, title: "Save & Organize", desc: "Build your personal prompt library with tags, favorites, and categories." },
  { icon: Share2, title: "One-Click Share", desc: "Generate a public link to any saved prompt in seconds." },
  { icon: Star, title: "Curated Templates", desc: "Jump-start with 10+ expert-crafted templates across all domains." },
  { icon: Users, title: "Community Gallery", desc: "Browse and remix prompts shared by the PromptCraft community." },
];

const TESTIMONIALS = [
  {
    name: "Layla H.",
    role: "Content Creator",
    quote: "I used to spend 20 minutes tweaking ChatGPT prompts. Now I describe what I want in plain English and PromptCraft does the rest in seconds.",
  },
  {
    name: "Marcus T.",
    role: "Full-stack Developer",
    quote: "The two-version output is genius. I use the concise version when I'm in a flow state and the detailed one when I need precise output.",
  },
  {
    name: "Nour A.",
    role: "Marketing Manager",
    quote: "Our whole team shares prompts through PromptCraft. It's become our AI ops layer.",
  },
];

export default function Landing() {
  usePageTitle("AI Prompt Engineering");
  const { isSignedIn } = useSafeUser();
  const [demoIdx, setDemoIdx] = useState(0);
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [phase, setPhase] = useState<"user" | "ai" | "pause">("user");
  const frameRef = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const demo = DEMO_PROMPTS[demoIdx];

    if (phase === "user") {
      if (userText.length < demo.user.length) {
        timeout = setTimeout(() => setUserText(demo.user.slice(0, userText.length + 1)), 40);
      } else {
        timeout = setTimeout(() => { setPhase("ai"); }, 600);
      }
    } else if (phase === "ai") {
      if (aiText.length < demo.ai.length) {
        timeout = setTimeout(() => setAiText(demo.ai.slice(0, aiText.length + 2)), 12);
      } else {
        timeout = setTimeout(() => { setPhase("pause"); }, 2000);
      }
    } else {
      timeout = setTimeout(() => {
        setUserText("");
        setAiText("");
        setDemoIdx((i) => (i + 1) % DEMO_PROMPTS.length);
        setPhase("user");
      }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [phase, userText, aiText, demoIdx]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-20 pb-32 text-center">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-80px] -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-primary/25 blur-[120px]" />
          <div className="absolute right-[-100px] top-[20%] h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[100px]" />
          <div className="absolute left-[-80px] bottom-0 h-[400px] w-[400px] rounded-full bg-primary/15 blur-[90px]" />
        </div>
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-3.5 w-3.5" /> AI-powered prompt engineering
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl md:text-7xl">
            Talk to us like a{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              friend.
            </span>
            <br />
            We'll craft the perfect prompt.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            Describe what you want in plain language. Get two polished, production-ready prompts instantly — one detailed, one concise.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isSignedIn ? (
              <>
                <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] transition-all">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-semibold hover:bg-muted transition-colors">
                  See examples
                </Link>
              </>
            ) : (
              <>
                <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all">
                  Open builder <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-semibold hover:bg-muted transition-colors">
                  My dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Animated demo */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-primary">See it in action</h2>
          <h3 className="mb-10 text-center text-3xl font-bold">Watch it craft prompts live</h3>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-secondary/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <div className="h-3 w-3 rounded-full bg-primary/70" />
              <span className="ml-2 text-xs text-muted-foreground">PromptCraft Builder</span>
            </div>
            <div className="p-6 space-y-4 min-h-[280px]">
              <div className="flex justify-end">
                <div className="max-w-sm rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground min-h-[2.5rem]">
                  {userText}<span className={phase === "user" ? "animate-pulse" : "opacity-0"}>|</span>
                </div>
              </div>
              {(aiText || phase === "ai") && (
                <div className="flex justify-start">
                  <div className="max-w-lg rounded-2xl rounded-tl-sm border border-border bg-muted px-4 py-3 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {aiText}<span className={phase === "ai" ? "animate-pulse" : "opacity-0"}>|</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-24 border-t border-b" style={{ borderColor: "hsl(248 95% 65% / 0.12)", background: "hsl(230 38% 6%)" }}>
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(248 95% 65%)" }}>Features</p>
          <h2 className="mb-12 text-center text-3xl font-bold">Everything you need to prompt like a pro</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl p-px transition-all" style={{ background: "linear-gradient(135deg, hsl(248 95% 65% / 0.2), hsl(230 38% 14%))" }}>
                <div className="rounded-2xl h-full p-6" style={{ background: "hsl(230 38% 9%)" }}>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "hsl(248 95% 65% / 0.15)", border: "1px solid hsl(248 95% 65% / 0.3)" }}>
                    <Icon className="h-5 w-5" style={{ color: "hsl(248 95% 65%)" }} />
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(230 15% 60%)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(350 90% 62%)" }}>Process</p>
          <h2 className="mb-16 text-3xl font-bold">How it works</h2>
          <div className="flex flex-col md:flex-row items-start gap-8 md:gap-4">
            {[
              { n: "1", title: "Describe your goal", desc: "Type what you want in plain language — no prompt engineering required.", color: "hsl(248 95% 65%)" },
              { n: "2", title: "Get two versions", desc: "Receive a detailed long-form prompt and a concise version instantly.", color: "hsl(350 90% 62%)" },
              { n: "3", title: "Copy, refine, reuse", desc: "Save to your library, share with others, or keep refining until perfect.", color: "hsl(248 95% 65%)" },
            ].map((step, i) => (
              <div key={step.n} className="flex flex-col md:flex-row items-center gap-6 flex-1">
                <div className="flex flex-col items-center flex-1 px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-extrabold text-white mb-4 shadow-lg" style={{ background: step.color, boxShadow: `0 0 24px ${step.color}55` }}>
                    {step.n}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(230 15% 60%)" }}>{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex items-center shrink-0">
                    <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
                      <path d="M0 8h28M22 2l8 6-8 6" stroke="hsl(248 95% 65% / 0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-24 border-t border-b" style={{ borderColor: "hsl(350 90% 62% / 0.12)", background: "hsl(230 38% 6%)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "hsl(350 90% 62%)" }}>Testimonials</p>
          <h2 className="mb-12 text-center text-3xl font-bold">Loved by builders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)" }}>
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: i === 1 ? "hsl(350 90% 62%)" : "hsl(248 95% 65%)" }} />
                <p className="text-2xl font-serif mb-3" style={{ color: i === 1 ? "hsl(350 90% 62%)" : "hsl(248 95% 65%)" }}>"</p>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "hsl(230 15% 72%)" }}>{t.quote}</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: i === 1 ? "hsl(350 90% 62%)" : "hsl(248 95% 65%)" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs" style={{ color: "hsl(230 15% 55%)" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-24">
        <div className="relative mx-auto max-w-2xl text-center rounded-2xl p-12 overflow-hidden" style={{ background: "hsl(230 38% 8%)", border: "1px solid hsl(248 95% 65% / 0.25)" }}>
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, hsl(248 95% 65% / 0.15), transparent)" }} />
          <h2 className="mb-4 text-3xl font-bold">Start crafting better prompts today</h2>
          <p className="mb-8" style={{ color: "hsl(230 15% 60%)" }}>Free to start. No credit card required.</p>
          {!isSignedIn ? (
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: "hsl(248 95% 65%)", boxShadow: "0 0 32px hsl(248 95% 65% / 0.4)" }}>
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: "hsl(248 95% 65%)", boxShadow: "0 0 32px hsl(248 95% 65% / 0.4)" }}>
              Open builder <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
