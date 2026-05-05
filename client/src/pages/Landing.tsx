import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import { useSafeUser } from "@/lib/clerk-safe";
import { Zap, BookOpen, Tag, Share2, Users, Star, ArrowRight, Sparkles, Terminal, Layers, Globe } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const ROTATING_WORDS = ["human.", "friend.", "expert.", "builder.", "creator."];

const FEATURES = [
  { icon: Zap, title: "Instant Generation", desc: "Zero wait — the AI crafts your prompt the moment you hit send.", size: "large" },
  { icon: Layers, title: "Two Versions Always", desc: "Detailed long-form AND concise — pick what fits your workflow.", size: "small" },
  { icon: Tag, title: "Save & Organize", desc: "Tags, favorites, categories. Your personal prompt library.", size: "small" },
  { icon: Share2, title: "One-Click Share", desc: "Public link to any saved prompt in seconds.", size: "small" },
  { icon: Star, title: "Curated Templates", desc: "10+ expert-crafted templates across every domain.", size: "small" },
  { icon: Globe, title: "Community Gallery", desc: "Browse and remix prompts from the PromptCraft community.", size: "large" },
];

const TESTIMONIALS = [
  { name: "Layla H.", handle: "@layla_creates", role: "Content Creator", quote: "I used to spend 20 minutes tweaking ChatGPT prompts. Now I describe what I want and PromptCraft does the rest in seconds.", avatar: "L", color: "hsl(248 95% 65%)" },
  { name: "Marcus T.", handle: "@marcust_dev", role: "Full-stack Developer", quote: "The two-version output is genius. I use the concise one when I'm in a flow state and the detailed one when I need precise output.", avatar: "M", color: "hsl(350 90% 62%)" },
  { name: "Nour A.", handle: "@noura_mkts", role: "Marketing Manager", quote: "Our whole team shares prompts through PromptCraft. It's become our AI ops layer.", avatar: "N", color: "hsl(248 95% 65%)" },
  { name: "James K.", handle: "@jk_builds", role: "Product Manager", quote: "Finally a tool that speaks plain English. No more prompt engineering rabbit holes.", avatar: "J", color: "hsl(350 90% 62%)" },
  { name: "Sara M.", handle: "@saradesigns", role: "UX Designer", quote: "I paste my design briefs in and get prompts for Midjourney instantly. Game changer.", avatar: "S", color: "hsl(248 95% 65%)" },
  { name: "Ali R.", handle: "@ali_research", role: "Research Analyst", quote: "The detailed version is perfect for complex research tasks. It thinks of angles I'd miss.", avatar: "A", color: "hsl(350 90% 62%)" },
];

const STEPS = [
  { n: "01", title: "Describe your goal", desc: "Type what you want in plain language. No prompt engineering knowledge needed.", icon: Terminal },
  { n: "02", title: "Get two versions", desc: "Receive a detailed expert prompt AND a concise one — both production-ready.", icon: Layers },
  { n: "03", title: "Copy, refine, reuse", desc: "Save to your library, share with one click, or keep refining until perfect.", icon: Sparkles },
];

export default function Landing() {
  usePageTitle("AI Prompt Engineering");
  const { isSignedIn } = useSafeUser();
  const [wordIdx, setWordIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIdx((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative px-4 pt-24 pb-32 text-center bg-grid">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 -translate-x-1/2 top-[-120px] h-[800px] w-[800px] rounded-full" style={{ background: "radial-gradient(circle, hsl(248 95% 65% / 0.18) 0%, transparent 70%)" }} />
          <div className="absolute right-[-150px] top-[10%] h-[600px] w-[600px] rounded-full" style={{ background: "radial-gradient(circle, hsl(350 90% 62% / 0.12) 0%, transparent 70%)" }} />
          <div className="absolute left-[-100px] bottom-0 h-[400px] w-[400px] rounded-full" style={{ background: "radial-gradient(circle, hsl(248 95% 65% / 0.1) 0%, transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium" style={{ background: "hsl(248 95% 65% / 0.1)", border: "1px solid hsl(248 95% 65% / 0.25)", color: "hsl(248 95% 75%)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "hsl(248 95% 65%)" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "hsl(248 95% 65%)" }} />
            </span>
            AI-powered prompt engineering · Free to start
          </div>

          {/* Headline */}
          <h1 className="mb-6 font-extrabold tracking-tight" style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            Talk to us like a{" "}
            <br className="hidden sm:block" />
            <span
              className="inline-block transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, hsl(248 95% 75%), hsl(350 90% 70%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
              }}
            >
              {ROTATING_WORDS[wordIdx]}
            </span>
            <br />
            <span style={{ color: "hsl(0 0% 90%)" }}>We'll craft the perfect prompt.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed" style={{ color: "hsl(230 15% 62%)" }}>
            Describe your goal in plain English. Get two polished, production-ready prompts instantly — one detailed, one concise.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            {!isSignedIn ? (
              <>
                <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:brightness-110" style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 40px hsl(248 95% 65% / 0.35), 0 4px 20px hsl(248 95% 65% / 0.2)" }}>
                  Start for free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-all hover:brightness-110" style={{ background: "hsl(230 38% 10%)", border: "1px solid hsl(230 30% 20%)", color: "hsl(0 0% 90%)" }}>
                  See it live
                </Link>
              </>
            ) : (
              <>
                <Link href="/builder" className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-all hover:scale-[1.03]" style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 40px hsl(248 95% 65% / 0.35)" }}>
                  Open builder <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold transition-all hover:brightness-110" style={{ background: "hsl(230 38% 10%)", border: "1px solid hsl(230 30% 20%)", color: "hsl(0 0% 90%)" }}>
                  My dashboard
                </Link>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 text-sm" style={{ color: "hsl(230 15% 55%)" }}>
            <div className="flex -space-x-2">
              {["L","M","N","J","S"].map((l, i) => (
                <div key={i} className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2" style={{ background: i % 2 === 0 ? "hsl(248 95% 62%)" : "hsl(350 90% 60%)", ringColor: "hsl(230 40% 4%)" }}>
                  {l}
                </div>
              ))}
            </div>
            <span>Join <strong style={{ color: "hsl(0 0% 90%)" }}>2,400+</strong> builders already using PromptCraft</span>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ──────────────────────────────────── */}
      <section className="px-4 py-28" style={{ background: "hsl(230 40% 4%)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "hsl(248 95% 70%)" }}>Features</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>Everything in one place</h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "hsl(230 15% 58%)" }}>One tool that handles the full prompt workflow — generate, save, share, and iterate.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Big card */}
            <div className="md:col-span-2 md:row-span-2 rounded-3xl p-8 relative overflow-hidden group cursor-default" style={{ background: "hsl(230 38% 8%)", border: "1px solid hsl(248 95% 65% / 0.15)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at 30% 50%, hsl(248 95% 65% / 0.07), transparent 60%)" }} />
              <div className="relative">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "hsl(248 95% 65% / 0.15)", border: "1px solid hsl(248 95% 65% / 0.3)" }}>
                  <Zap className="h-6 w-6" style={{ color: "hsl(248 95% 70%)" }} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Instant Generation</h3>
                <p className="text-base leading-relaxed mb-8" style={{ color: "hsl(230 15% 58%)" }}>Zero wait — the moment you hit send, two polished, production-ready prompts appear. No tweaking, no iterations needed.</p>
                <div className="rounded-2xl p-4" style={{ background: "hsl(230 40% 5%)", border: "1px solid hsl(230 30% 14%)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full" style={{ background: "hsl(248 95% 65%)" }} />
                    <span className="text-xs font-mono" style={{ color: "hsl(230 15% 50%)" }}>promptcraft.ai · generating...</span>
                  </div>
                  <p className="text-sm font-mono leading-relaxed" style={{ color: "hsl(248 95% 75%)" }}>
                    <span style={{ color: "hsl(230 15% 50%)" }}>You: </span>Write a cold email for my SaaS product
                  </p>
                  <p className="text-sm font-mono mt-2 leading-relaxed" style={{ color: "hsl(0 0% 85%)" }}>
                    <span style={{ color: "hsl(350 90% 68%)" }}>AI: </span>Version 1 · Detailed · Version 2 · Concise ✓
                  </p>
                </div>
              </div>
            </div>

            {/* Small cards */}
            {FEATURES.slice(1, 5).map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="rounded-3xl p-6 relative overflow-hidden group cursor-default" style={{ background: "hsl(230 38% 8%)", border: "1px solid hsl(230 30% 13%)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 50%, ${i % 2 === 0 ? "hsl(248 95% 65% / 0.06)" : "hsl(350 90% 62% / 0.06)"}, transparent 70%)` }} />
                <div className="relative">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: i % 2 === 0 ? "hsl(248 95% 65% / 0.12)" : "hsl(350 90% 62% / 0.12)", border: `1px solid ${i % 2 === 0 ? "hsl(248 95% 65% / 0.25)" : "hsl(350 90% 62% / 0.25)"}` }}>
                    <Icon className="h-5 w-5" style={{ color: i % 2 === 0 ? "hsl(248 95% 70%)" : "hsl(350 90% 68%)" }} />
                  </div>
                  <h3 className="font-bold text-base mb-1.5">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(230 15% 55%)" }}>{desc}</p>
                </div>
              </div>
            ))}

            {/* Last big card */}
            <div className="md:col-span-2 rounded-3xl p-8 relative overflow-hidden group cursor-default" style={{ background: "linear-gradient(135deg, hsl(350 90% 10%), hsl(230 38% 8%))", border: "1px solid hsl(350 90% 62% / 0.15)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "radial-gradient(circle at 70% 50%, hsl(350 90% 62% / 0.08), transparent 60%)" }} />
              <div className="relative flex items-center gap-8">
                <div className="flex-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "hsl(350 90% 62% / 0.15)", border: "1px solid hsl(350 90% 62% / 0.3)" }}>
                    <Globe className="h-6 w-6" style={{ color: "hsl(350 90% 68%)" }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Community Gallery</h3>
                  <p className="leading-relaxed" style={{ color: "hsl(230 15% 58%)" }}>Browse thousands of prompts shared by the community. Remix, fork, and build on top of what works.</p>
                </div>
                <div className="hidden md:flex flex-col gap-2 shrink-0">
                  {["Marketing copy", "Code review", "Research brief", "Email outreach"].map((tag) => (
                    <span key={tag} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "hsl(350 90% 62% / 0.12)", border: "1px solid hsl(350 90% 62% / 0.2)", color: "hsl(350 90% 72%)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="px-4 py-28 relative" style={{ background: "hsl(230 38% 6%)", borderTop: "1px solid hsl(248 95% 65% / 0.08)", borderBottom: "1px solid hsl(248 95% 65% / 0.08)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px]" style={{ background: "radial-gradient(circle, hsl(248 95% 65% / 0.05) 0%, transparent 70%)" }} />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-20 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "hsl(350 90% 68%)" }}>How it works</p>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.02em" }}>Three steps to a perfect prompt</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(248 95% 65% / 0.4), transparent)" }} />
            {STEPS.map(({ n, title, desc, icon: Icon }, i) => (
              <div key={n} className="flex flex-col items-center text-center relative">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: i === 1 ? "hsl(350 90% 62%)" : "hsl(248 95% 62%)", boxShadow: `0 0 40px ${i === 1 ? "hsl(350 90% 62% / 0.4)" : "hsl(248 95% 65% / 0.4)"}` }}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "hsl(230 40% 4%)", border: "1px solid hsl(230 30% 18%)", color: "hsl(230 15% 55%)" }}>{n}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(230 15% 55%)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="px-4 py-28" style={{ background: "hsl(230 40% 4%)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: "hsl(248 95% 70%)" }}>Testimonials</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>Loved by builders worldwide</h2>
            <p className="text-lg" style={{ color: "hsl(230 15% 55%)" }}>Don't take our word for it.</p>
          </div>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="break-inside-avoid rounded-2xl p-6 relative overflow-hidden" style={{ background: "hsl(230 38% 8%)", border: "1px solid hsl(230 30% 14%)" }}>
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} className="h-3.5 w-3.5 fill-current" style={{ color: "hsl(45 95% 60%)" }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "hsl(230 15% 75%)" }}>"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs" style={{ color: "hsl(230 15% 50%)" }}>{t.handle} · {t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="px-4 py-28" style={{ background: "hsl(230 38% 6%)", borderTop: "1px solid hsl(248 95% 65% / 0.08)" }}>
        <div className="mx-auto max-w-3xl text-center relative">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px]" style={{ background: "radial-gradient(circle, hsl(248 95% 65% / 0.12) 0%, transparent 70%)" }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6" style={{ color: "hsl(248 95% 70%)" }}>Get started today</p>
          <h2 className="font-extrabold tracking-tight mb-6" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Start crafting prompts that{" "}
            <span style={{ background: "linear-gradient(135deg, hsl(248 95% 75%), hsl(350 90% 70%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              actually work.
            </span>
          </h2>
          <p className="text-lg mb-10 max-w-lg mx-auto" style={{ color: "hsl(230 15% 58%)" }}>
            Free forever. No credit card. Join 2,400+ builders who already use PromptCraft daily.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isSignedIn ? (
              <>
                <Link href="/sign-up" className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all hover:scale-[1.03] hover:brightness-110" style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 50px hsl(248 95% 65% / 0.4), 0 4px 24px hsl(248 95% 65% / 0.25)" }}>
                  Create free account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all hover:brightness-110" style={{ background: "hsl(230 38% 10%)", border: "1px solid hsl(230 30% 20%)", color: "hsl(0 0% 85%)" }}>
                  Try the builder
                </Link>
              </>
            ) : (
              <Link href="/builder" className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white transition-all hover:scale-[1.03]" style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 50px hsl(248 95% 65% / 0.4)" }}>
                Open builder <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
          <p className="mt-6 text-sm" style={{ color: "hsl(230 15% 45%)" }}>No credit card required · Free plan available · Cancel anytime</p>
        </div>
      </section>
    </div>
  );
}
