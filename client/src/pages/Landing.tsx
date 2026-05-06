import { Link } from "wouter";
import { useEffect, useState, useRef } from "react";
import {
  motion, AnimatePresence, useInView,
  useMotionValue, useTransform, useSpring,
} from "framer-motion";
import { useSafeUser } from "@/lib/clerk-safe";
import {
  Zap, Tag, Share2, Star, ArrowRight, Sparkles,
  Terminal, Layers, Globe, Check, X, Plus, Minus,
  Code, Mail, BarChart3, PenLine, Bot, Cpu, Wand2, BookOpen,
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

/* ─── CSS var helpers ─────────────────────────────────────── */
const V = {
  bg: "hsl(var(--background))",
  surface: "hsl(var(--surface))",
  card: "hsl(var(--card))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted))",
  fg: "hsl(var(--foreground))",
  fgMuted: "hsl(var(--muted-foreground))",
  fgDim: "hsl(var(--muted-foreground) / 0.65)",
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  primaryGlow: (o: number) => `hsl(var(--primary) / ${o})`,
  secondaryGlow: (o: number) => `hsl(var(--secondary) / ${o})`,
  borderWith: (o: number) => `hsl(var(--border) / ${o})`,
};

/* ─── animation variants ─────────────────────────────────── */
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const staggerGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardReveal = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Reveal ──────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className, style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} className={className} style={style}>
      {children}
    </motion.div>
  );
}

/* ─── TiltCard ────────────────────────────────────────────── */
function TiltCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d", ...style }}
      onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── MagneticButton ──────────────────────────────────────── */
function MagneticButton({ children, className, style, href }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; href?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 15 });
  const sy = useSpring(y, { stiffness: 150, damping: 15 });
  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.3);
    y.set((e.clientY - r.top - r.height / 2) * 0.3);
  };
  return (
    <motion.a href={href} style={{ x: sx, y: sy, ...style }} onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }} whileTap={{ scale: 0.96 }} className={className}>
      {children}
    </motion.a>
  );
}

/* ─── CountUp ─────────────────────────────────────────────── */
function CountUp({ from = 0, to, decimals = 0, prefix = "", suffix = "" }: {
  from?: number; to: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(from);
  const [display, setDisplay] = useState(from.toFixed(decimals));
  useEffect(() => {
    if (!inView) return;
    const unsub = mv.on("change", (v) => setDisplay(v.toFixed(decimals)));
    import("framer-motion").then(({ animate }) => { animate(mv, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1] }); });
    return unsub;
  }, [inView]);
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/* ─── data ───────────────────────────────────────────────── */
const ROTATING_WORDS = ["human.", "friend.", "expert.", "builder.", "creator."];

const STATS = [
  { prefix: "", to: 12, suffix: "K+", decimals: 0, label: "Prompts generated" },
  { prefix: "", to: 2400, suffix: "+", decimals: 0, label: "Active builders" },
  { prefix: "", to: 4.9, suffix: "/5", decimals: 1, label: "User rating" },
  { prefix: "<", to: 2, suffix: "s", decimals: 0, label: "Generation time" },
];

const USE_CASES = [
  {
    id: "marketing", icon: PenLine, label: "Marketing",
    input: "Write a cold outreach email for a project management SaaS",
    output: `### Version 1 · Detailed\nYou are a B2B SaaS copywriter who has driven $10M+ in pipeline at companies like Linear and Notion. Your writing is conversational, specific, and value-led — never salesy.\n\nWrite a cold outreach email for {product_name} targeting {target_role} at {target_company_size} companies.\n\nConstraints:\n- Subject line under 6 words, curiosity-driven\n- Open with a relevant insight, not a pitch\n- One specific value claim with a number\n- Soft CTA (15-min call), no link in first send`,
  },
  {
    id: "code", icon: Code, label: "Code",
    input: "Help me build a REST API with FastAPI and PostgreSQL",
    output: `### Version 1 · Detailed\nYou are a senior Python backend engineer who has shipped APIs at scale. You write idiomatic FastAPI code with proper async patterns, dependency injection, and Pydantic models.\n\nBuild a REST API with the following:\n- FastAPI + async SQLAlchemy + PostgreSQL\n- JWT auth with refresh tokens\n- Pydantic v2 schemas for I/O validation\n- Proper error handling with custom exceptions\n- Pagination on list endpoints`,
  },
  {
    id: "research", icon: BarChart3, label: "Research",
    input: "Analyze the impact of remote work on team productivity",
    output: `### Version 1 · Detailed\nYou are a research analyst at a top consultancy. Your reports are evidence-based, structured, and balanced — you cite sources, acknowledge counter-evidence, and avoid hype.\n\nProduce a research brief on: How has remote work impacted team productivity since 2020?\n\nStructure:\n1. Executive summary (3 bullets)\n2. Key findings with supporting data\n3. Counter-evidence and limitations\n4. Recommendations for hybrid teams`,
  },
  {
    id: "email", icon: Mail, label: "Email",
    input: "Write a polite follow-up email after no response",
    output: `### Version 1 · Detailed\nYou are an experienced sales rep known for warm, persistent follow-ups that get responses without being annoying. You're confident but never pushy.\n\nWrite a follow-up email to {recipient_name} who hasn't replied to your initial message about {topic} sent {days_ago} days ago.\n\nTone: Casual but professional · 60-80 words · One clear ask · Open-ended question to restart the conversation`,
  },
];

const COMPARE_BEFORE = [
  "Spending 20 minutes tweaking ChatGPT prompts",
  "Forgetting which prompt worked best",
  "Re-typing the same prompt structure daily",
  "No way to share prompts with your team",
  "Inconsistent results across projects",
];
const COMPARE_AFTER = [
  "Type your goal in plain English, get the prompt in 2 seconds",
  "Saved library with tags, favorites, and search",
  "12+ curated templates ready to remix",
  "One-click share links for any saved prompt",
  "Two-version output (detailed + concise) every time",
];

const FAQS = [
  { q: "Is PromptCraft really free?", a: "Yes. The free plan includes 10 generations per day forever — no credit card, no trial. Pro plans unlock higher limits and analytics." },
  { q: "Which AI model does it use?", a: "PromptCraft uses GPT-4o-mini under the hood. It's optimized for speed and quality, and the cost is included in your plan — you don't need your own OpenAI key." },
  { q: "Can I use the prompts commercially?", a: "Absolutely. Every prompt you generate is yours. Use them in client work, products, or internal tools — no attribution required." },
  { q: "Does it work for non-English languages?", a: "Yes. PromptCraft generates prompts in any language you describe your goal in. The system prompt adapts automatically." },
  { q: "Can I share prompts with my team?", a: "Yes. Every saved prompt has a one-click public share link. Pro plans add team workspaces with private collections." },
  { q: "How is this different from ChatGPT?", a: "ChatGPT generates answers. PromptCraft generates the prompts that make ChatGPT (or any LLM) give you better answers — saved, organized, and reusable." },
];

const TESTIMONIALS = [
  { name: "Layla H.", handle: "@layla_creates", role: "Content Creator", quote: "I used to spend 20 minutes tweaking ChatGPT prompts. Now I describe what I want and PromptCraft does the rest in seconds.", avatar: "L", color: V.primary },
  { name: "Marcus T.", handle: "@marcust_dev", role: "Full-stack Developer", quote: "The two-version output is genius. I use the concise one when I'm in a flow state and the detailed one when I need precise output.", avatar: "M", color: V.secondary },
  { name: "Nour A.", handle: "@noura_mkts", role: "Marketing Manager", quote: "Our whole team shares prompts through PromptCraft. It's become our AI ops layer.", avatar: "N", color: V.primary },
  { name: "James K.", handle: "@jk_builds", role: "Product Manager", quote: "Finally a tool that speaks plain English. No more prompt engineering rabbit holes.", avatar: "J", color: V.secondary },
  { name: "Sara M.", handle: "@saradesigns", role: "UX Designer", quote: "I paste my design briefs in and get prompts for Midjourney instantly. Game changer.", avatar: "S", color: V.primary },
  { name: "Ali R.", handle: "@ali_research", role: "Research Analyst", quote: "The detailed version is perfect for complex research tasks. It thinks of angles I'd miss.", avatar: "A", color: V.secondary },
];

const STEPS = [
  { n: "01", title: "Describe your goal", desc: "Type what you want in plain language. No prompt engineering knowledge needed.", icon: Terminal },
  { n: "02", title: "Get two versions", desc: "Receive a detailed expert prompt AND a concise one — both production-ready.", icon: Layers },
  { n: "03", title: "Copy, refine, reuse", desc: "Save to your library, share with one click, or keep refining until perfect.", icon: Sparkles },
];

const WORKS_WITH = [
  { label: "ChatGPT", icon: Bot }, { label: "Claude", icon: Sparkles },
  { label: "Gemini", icon: Cpu }, { label: "Midjourney", icon: Wand2 },
  { label: "Perplexity", icon: Globe }, { label: "Notion AI", icon: BookOpen },
  { label: "Copilot", icon: Code }, { label: "Llama", icon: Terminal },
];

/* ─── FAQ item ───────────────────────────────────────────── */
function FAQItem({ q, a, isOpen, onClick }: { q: string; a: string; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: V.card, border: `1px solid ${isOpen ? V.primaryGlow(0.3) : V.border}` }}>
      <button onClick={onClick} className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] dark:hover:bg-white/[0.02] transition-colors">
        <span className="font-semibold text-base pr-4">{q}</span>
        <motion.div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
          animate={{ background: isOpen ? V.primary : V.muted }} transition={{ duration: 0.2 }}>
          <AnimatePresence mode="wait" initial={false}>
            {isOpen
              ? <motion.div key="m" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><Minus className="h-4 w-4 text-white" /></motion.div>
              : <motion.div key="p" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Plus className="h-4 w-4" style={{ color: V.fgMuted }} /></motion.div>
            }
          </AnimatePresence>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: "hidden" }}>
            <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: V.fgMuted }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── page ───────────────────────────────────────────────── */
export default function Landing() {
  usePageTitle("AI Prompt Engineering");
  const { isSignedIn } = useSafeUser();
  const [wordIdx, setWordIdx] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(USE_CASES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoUserText, setDemoUserText] = useState("");
  const [demoAiText, setDemoAiText] = useState("");
  const [demoPhase, setDemoPhase] = useState<"user" | "ai" | "pause">("user");

  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % ROTATING_WORDS.length), 2400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const u = activeUseCase.input, a = activeUseCase.output;
    if (demoPhase === "user") {
      if (demoUserText.length < u.length) t = setTimeout(() => setDemoUserText(u.slice(0, demoUserText.length + 1)), 35);
      else t = setTimeout(() => setDemoPhase("ai"), 500);
    } else if (demoPhase === "ai") {
      if (demoAiText.length < a.length) t = setTimeout(() => setDemoAiText(a.slice(0, demoAiText.length + 4)), 12);
      else t = setTimeout(() => setDemoPhase("pause"), 2500);
    }
    return () => clearTimeout(t);
  }, [demoPhase, demoUserText, demoAiText, activeUseCase]);

  useEffect(() => { setDemoUserText(""); setDemoAiText(""); setDemoPhase("user"); }, [activeUseCase]);

  return (
    <div className="min-h-screen overflow-hidden">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative px-4 pt-24 pb-24 text-center bg-grid overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 -translate-x-1/2 top-[-120px] h-[900px] w-[900px] rounded-full" style={{ background: `radial-gradient(circle, ${V.primaryGlow(0.15)} 0%, transparent 65%)` }} />
          <div className="absolute right-[-150px] top-[10%] h-[600px] w-[600px] rounded-full" style={{ background: `radial-gradient(circle, ${V.secondaryGlow(0.1)} 0%, transparent 70%)` }} />
        </div>

        <motion.div className="relative mx-auto max-w-5xl" variants={heroContainer} initial="hidden" animate="show">
          {/* badge */}
          <motion.div variants={fadeUp} className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
            style={{ background: V.primaryGlow(0.1), border: `1px solid ${V.primaryGlow(0.25)}`, color: V.primary }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: V.primary }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: V.primary }} />
            </span>
            AI-powered prompt engineering · Free to start
          </motion.div>

          {/* headline */}
          <motion.h1 variants={fadeUp} className="mb-6 font-extrabold tracking-tight"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            Talk to us like a{" "}
            <br className="hidden sm:block" />
            <AnimatePresence mode="wait">
              <motion.span key={wordIdx}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block"
                style={{ background: `linear-gradient(135deg, ${V.primary}, ${V.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {ROTATING_WORDS[wordIdx]}
              </motion.span>
            </AnimatePresence>
            <br />
            <span className="text-foreground">We'll craft the perfect prompt.</span>
          </motion.h1>

          {/* subtext */}
          <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Describe your goal in plain English. Get two polished, production-ready prompts instantly — one detailed, one concise.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            {!isSignedIn ? (
              <>
                <MagneticButton href="/sign-up" className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: `0 0 40px ${V.primaryGlow(0.35)}, 0 4px 20px ${V.primaryGlow(0.2)}` }}>
                  Start for free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </MagneticButton>
                <MagneticButton href="/builder" className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold"
                  style={{ background: V.card, border: `1px solid ${V.border}`, color: V.fg }}>
                  See it live ↓
                </MagneticButton>
              </>
            ) : (
              <>
                <MagneticButton href="/builder" className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: `0 0 40px ${V.primaryGlow(0.35)}` }}>
                  Open builder <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </MagneticButton>
                <MagneticButton href="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold"
                  style={{ background: V.card, border: `1px solid ${V.border}`, color: V.fg }}>
                  My dashboard
                </MagneticButton>
              </>
            )}
          </motion.div>

          {/* social proof */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 text-sm mb-16 text-muted-foreground">
            <div className="flex -space-x-2">
              {["L","M","N","J","S"].map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.06, duration: 0.3, ease: "backOut" }}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2"
                  style={{ background: i % 2 === 0 ? V.primary : V.secondary, outline: `2px solid ${V.bg}` }}>
                  {l}
                </motion.div>
              ))}
            </div>
            <span>Join <strong className="text-foreground">2,400+</strong> builders already using PromptCraft</span>
          </motion.div>

          {/* floating hero card */}
          <motion.div variants={fadeUp} className="mx-auto max-w-2xl relative">
            <div className="absolute inset-0 rounded-3xl" style={{ background: `radial-gradient(ellipse at center, ${V.primaryGlow(0.2)}, transparent 70%)`, filter: "blur(30px)", transform: "translateY(20px) scaleX(0.9)" }} />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-3xl overflow-hidden"
              style={{ background: V.card, border: `1px solid ${V.primaryGlow(0.2)}`, boxShadow: `0 24px 80px ${V.primaryGlow(0.12)}, 0 4px 24px rgba(0,0,0,0.4)` }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ background: V.bg, borderBottom: `1px solid ${V.border}` }}>
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(0 72% 55%)" }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(43 96% 52%)" }} />
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: "hsl(142 70% 45%)" }} />
                </div>
                <div className="flex-1 mx-3 rounded-full py-0.5 px-3 text-xs font-mono text-center" style={{ background: V.muted, color: V.fgDim }}>
                  promptcraft.ai/builder
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] text-white" style={{ background: V.primary }}>
                    Write a LinkedIn post about launching my startup
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-xs font-mono leading-relaxed max-w-[88%]" style={{ background: V.bg, border: `1px solid ${V.border}`, color: V.fg }}>
                    <span style={{ color: V.primary }}>### Version 1 · Detailed</span><br />
                    You are a B2B founder turned LinkedIn creator with 15K+ followers...<br /><br />
                    <span style={{ color: V.secondary }}>### Version 2 · Concise</span><br />
                    Write a LinkedIn launch post: excitement, one key metric, CTA.
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 mt-1" style={{ background: V.bg, border: `1px solid ${V.border}` }}>
                  <span className="flex-1 text-sm text-muted-foreground">Describe your goal…</span>
                  <div className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: V.primary }}>
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── WORKS WITH TICKER ─────────────────────────────────── */}
      <section className="py-10 overflow-hidden" style={{ background: V.surface, borderTop: `1px solid ${V.border}`, borderBottom: `1px solid ${V.border}` }}>
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] mb-6 text-muted-foreground/60">Works with any AI model</p>
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10" style={{ background: `linear-gradient(90deg, ${V.surface}, transparent)` }} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10" style={{ background: `linear-gradient(270deg, ${V.surface}, transparent)` }} />
          <div className="flex animate-scroll-left" style={{ width: "max-content" }}>
            {[...WORKS_WITH, ...WORKS_WITH].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2.5 mx-6 shrink-0 rounded-xl px-5 py-2.5"
                  style={{ background: V.card, border: `1px solid ${V.border}` }}>
                  <Icon className="h-4 w-4" style={{ color: V.primary }} />
                  <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ─────────────────────────────────────────── */}
      <section className="px-4 py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {USE_CASES.map((uc) => {
              const Icon = uc.icon;
              const active = activeUseCase.id === uc.id;
              return (
                <motion.button key={uc.id} onClick={() => setActiveUseCase(uc)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    background: active ? V.primary : V.card,
                    color: active ? "white" : V.fgMuted,
                    border: `1px solid ${active ? V.primary : V.border}`,
                    boxShadow: active ? `0 0 20px ${V.primaryGlow(0.35)}` : "none",
                    transition: "background 0.2s, box-shadow 0.2s",
                  }}>
                  <Icon className="h-4 w-4" />{uc.label}
                </motion.button>
              );
            })}
          </Reveal>

          <Reveal>
            <div className="rounded-3xl overflow-hidden" style={{ background: V.bg, border: `1px solid ${V.border}`, boxShadow: `0 30px 80px ${V.primaryGlow(0.1)}` }}>
              <div className="flex items-center gap-2 px-5 py-3" style={{ background: V.card, borderBottom: `1px solid ${V.border}` }}>
                <div className="flex gap-1.5">
                  {["hsl(0 72% 55%)", "hsl(43 96% 52%)", V.primary].map((c, i) => <div key={i} className="h-3 w-3 rounded-full" style={{ background: c, opacity: 0.8 }} />)}
                </div>
                <div className="flex-1 text-center"><span className="text-xs font-mono text-muted-foreground">promptcraft.ai/builder</span></div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "hsl(140 70% 60%)" }} /> Live
                </div>
              </div>
              <div className="grid md:grid-cols-2 min-h-[480px]">
                <div className="p-6" style={{ borderRight: `1px solid ${V.border}` }}>
                  <div className="flex items-center gap-2 mb-5 text-xs text-muted-foreground"><Terminal className="h-3.5 w-3.5" /> Chat</div>
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white" style={{ background: V.primary }}>
                        {demoUserText}
                        {demoPhase === "user" && demoUserText.length < activeUseCase.input.length && <span className="animate-pulse">|</span>}
                      </div>
                    </div>
                    {(demoPhase === "ai" || demoPhase === "pause") && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="max-w-[90%] rounded-2xl rounded-tl-sm px-4 py-3 text-xs font-mono leading-relaxed" style={{ background: V.card, border: `1px solid ${V.border}`, color: V.fg }}>
                          <pre className="whitespace-pre-wrap">{demoAiText}{demoPhase === "ai" && demoAiText.length < activeUseCase.output.length && <span className="animate-pulse">|</span>}</pre>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div className="p-6" style={{ background: V.surface }}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs flex items-center gap-2 text-muted-foreground"><Sparkles className="h-3.5 w-3.5" /> Generated Output</span>
                    <div className="flex gap-1.5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: V.primary }}>V1 Detailed</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-muted-foreground" style={{ background: V.muted }}>V2 Concise</span>
                    </div>
                  </div>
                  <div className="rounded-xl p-4 text-xs font-mono leading-relaxed h-[380px] overflow-hidden" style={{ background: V.card, border: `1px solid ${V.border}`, color: V.fg }}>
                    <pre className="whitespace-pre-wrap">{demoAiText || <span className="text-muted-foreground">Output will appear here...</span>}</pre>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section className="px-4 py-12" style={{ background: V.surface, borderTop: `1px solid ${V.primaryGlow(0.08)}`, borderBottom: `1px solid ${V.primaryGlow(0.08)}` }}>
        <div className="mx-auto max-w-5xl">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6" variants={staggerGrid} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            {STATS.map((s, i) => (
              <motion.div key={s.label} variants={cardReveal} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold mb-1"
                  style={{ background: i % 2 === 0 ? `linear-gradient(135deg, ${V.primary}, ${V.primary})` : `linear-gradient(135deg, ${V.secondary}, ${V.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  <CountUp from={0} to={s.to} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── BENTO FEATURES ────────────────────────────────────── */}
      <section className="px-4 py-28 bg-background">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: V.primary }}>Features</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>Everything in one place</h2>
            <p className="text-lg max-w-xl mx-auto text-muted-foreground">One tool that handles the full prompt workflow — generate, save, share, and iterate.</p>
          </Reveal>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={staggerGrid} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            {/* big card */}
            <motion.div variants={cardReveal} className="md:col-span-2 md:row-span-2">
              <TiltCard className="h-full rounded-3xl p-8 relative overflow-hidden cursor-default group"
                style={{ background: V.card, border: `1px solid ${V.primaryGlow(0.15)}` }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 30% 50%, ${V.primaryGlow(0.07)}, transparent 60%)` }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: V.primaryGlow(0.15), border: `1px solid ${V.primaryGlow(0.3)}` }}>
                    <Zap className="h-6 w-6" style={{ color: V.primary }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Instant Generation</h3>
                  <p className="text-base leading-relaxed mb-8 text-muted-foreground">Zero wait — the moment you hit send, two polished, production-ready prompts appear. No tweaking, no iterations needed.</p>
                  <div className="rounded-2xl p-4" style={{ background: V.bg, border: `1px solid ${V.border}` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-2 w-2 rounded-full" style={{ background: V.primary }} />
                      <span className="text-xs font-mono text-muted-foreground">promptcraft.ai · 1.8s</span>
                    </div>
                    <p className="text-sm font-mono leading-relaxed" style={{ color: V.primary }}>
                      <span className="text-muted-foreground">You: </span>Write a cold email for my SaaS product
                    </p>
                    <p className="text-sm font-mono mt-2 leading-relaxed text-foreground">
                      <span style={{ color: V.secondary }}>AI: </span>Version 1 · Detailed · Version 2 · Concise ✓
                    </p>
                  </div>
                </div>
              </TiltCard>
            </motion.div>

            {/* small cards */}
            {[
              { icon: Layers, title: "Two Versions Always", desc: "Detailed long-form AND concise — pick what fits your workflow." },
              { icon: Tag, title: "Save & Organize", desc: "Tags, favorites, categories. Your personal prompt library." },
              { icon: Share2, title: "One-Click Share", desc: "Public link to any saved prompt in seconds." },
              { icon: Star, title: "Curated Templates", desc: "12+ expert-crafted templates across every domain." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} variants={cardReveal}>
                <TiltCard className="h-full rounded-3xl p-6 relative overflow-hidden cursor-default group"
                  style={{ background: V.card, border: `1px solid ${V.border}` }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 50% 50%, ${i % 2 === 0 ? V.primaryGlow(0.06) : V.secondaryGlow(0.06)}, transparent 70%)` }} />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: i % 2 === 0 ? V.primaryGlow(0.12) : V.secondaryGlow(0.12), border: `1px solid ${i % 2 === 0 ? V.primaryGlow(0.25) : V.secondaryGlow(0.25)}` }}>
                      <Icon className="h-5 w-5" style={{ color: i % 2 === 0 ? V.primary : V.secondary }} />
                    </div>
                    <h3 className="font-bold text-base mb-1.5">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}

            {/* wide bottom card */}
            <motion.div variants={cardReveal} className="md:col-span-2">
              <TiltCard className="h-full rounded-3xl p-8 relative overflow-hidden cursor-default group"
                style={{ background: V.card, border: `1px solid ${V.secondaryGlow(0.15)}` }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 70% 50%, ${V.secondaryGlow(0.08)}, transparent 60%)` }} />
                <div className="relative flex items-center gap-8">
                  <div className="flex-1">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: V.secondaryGlow(0.15), border: `1px solid ${V.secondaryGlow(0.3)}` }}>
                      <Globe className="h-6 w-6" style={{ color: V.secondary }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Community Gallery</h3>
                    <p className="leading-relaxed text-muted-foreground">Browse thousands of prompts shared by the community. Remix, fork, and build on top of what works.</p>
                  </div>
                  <div className="hidden md:flex flex-col gap-2 shrink-0">
                    {["Marketing copy", "Code review", "Research brief", "Email outreach"].map((tag, i) => (
                      <motion.span key={tag} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{ background: V.secondaryGlow(0.12), border: `1px solid ${V.secondaryGlow(0.2)}`, color: V.secondary }}>
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── BEFORE / AFTER ────────────────────────────────────── */}
      <section className="px-4 py-28" style={{ background: V.surface }}>
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: V.secondary }}>Why PromptCraft</p>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.02em" }}>Stop wrestling with prompts</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            <Reveal delay={0}>
              <div className="rounded-3xl p-8 h-full" style={{ background: V.card, border: `1px solid ${V.border}` }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 60% 15%)" }}>
                    <X className="h-5 w-5" style={{ color: "hsl(0 70% 60%)" }} />
                  </div>
                  <h3 className="font-bold text-xl">Without PromptCraft</h3>
                </div>
                <ul className="space-y-3">
                  {COMPARE_BEFORE.map((item, i) => (
                    <motion.li key={item} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-3 text-sm text-muted-foreground">
                      <X className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(0 70% 55%)" }} />{item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-3xl p-8 h-full relative overflow-hidden" style={{ background: V.card, border: `1px solid ${V.primaryGlow(0.25)}` }}>
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 70% 30%, ${V.primaryGlow(0.08)}, transparent 60%)` }} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: V.primary, boxShadow: `0 0 20px ${V.primaryGlow(0.4)}` }}>
                      <Check className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-xl">With PromptCraft</h3>
                  </div>
                  <ul className="space-y-3">
                    {COMPARE_AFTER.map((item, i) => (
                      <motion.li key={item} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-start gap-3 text-sm text-foreground">
                        <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: V.primary }} />{item}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="px-4 py-28 relative bg-background">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px]"
            style={{ background: `radial-gradient(circle, ${V.primaryGlow(0.05)} 0%, transparent 70%)` }} />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="mb-20 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: V.secondary }}>How it works</p>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.02em" }}>Three steps to a perfect prompt</h2>
          </Reveal>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative" variants={staggerGrid} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${V.primaryGlow(0.4)}, transparent)` }} />
            {STEPS.map(({ n, title, desc, icon: Icon }, i) => (
              <motion.div key={n} variants={cardReveal} className="flex flex-col items-center text-center">
                <motion.div className="relative mb-6" whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
                    style={{ background: i === 1 ? V.secondary : V.primary, boxShadow: `0 0 40px ${i === 1 ? V.secondaryGlow(0.4) : V.primaryGlow(0.4)}` }}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-black px-2 py-0.5 rounded-full text-muted-foreground"
                    style={{ background: V.bg, border: `1px solid ${V.border}` }}>{n}</span>
                </motion.div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section className="px-4 py-28" style={{ background: V.surface, borderTop: `1px solid ${V.primaryGlow(0.08)}` }}>
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: V.primary }}>Testimonials</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>Loved by builders worldwide</h2>
            <p className="text-lg text-muted-foreground">Don't take our word for it.</p>
          </Reveal>
          <motion.div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4" variants={staggerGrid} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={cardReveal} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="break-inside-avoid rounded-2xl p-6 relative overflow-hidden cursor-default"
                style={{ background: V.card, border: `1px solid ${V.border}` }}>
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => <Star key={si} className="h-3.5 w-3.5 fill-current" style={{ color: "hsl(45 95% 60%)" }} />)}
                </div>
                <p className="text-sm leading-relaxed mb-5 text-muted-foreground">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: t.color }}>{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.handle} · {t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="px-4 py-28 bg-background">
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: V.secondary }}>FAQ</p>
            <h2 className="text-4xl font-extrabold tracking-tight" style={{ letterSpacing: "-0.02em" }}>Questions, answered</h2>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 0.04}>
                <FAQItem q={faq.q} a={faq.a} isOpen={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Still have questions? <a href="mailto:yousifalbalooshi@gmail.com" className="font-medium" style={{ color: V.primary }}>Email us →</a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="px-4 py-28" style={{ background: V.surface, borderTop: `1px solid ${V.primaryGlow(0.08)}` }}>
        <motion.div className="mx-auto max-w-3xl text-center relative"
          initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px]"
              style={{ background: `radial-gradient(circle, ${V.primaryGlow(0.12)} 0%, transparent 70%)` }} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6" style={{ color: V.primary }}>Get started today</p>
          <h2 className="font-extrabold tracking-tight mb-6" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Start crafting prompts that{" "}
            <span style={{ background: `linear-gradient(135deg, ${V.primary}, ${V.secondary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              actually work.
            </span>
          </h2>
          <p className="text-lg mb-10 max-w-lg mx-auto text-muted-foreground">
            Free forever. No credit card. Join 2,400+ builders who already use PromptCraft daily.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isSignedIn ? (
              <>
                <MagneticButton href="/sign-up" className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: `0 0 50px ${V.primaryGlow(0.4)}, 0 4px 24px ${V.primaryGlow(0.25)}` }}>
                  Create free account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </MagneticButton>
                <MagneticButton href="/builder" className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold"
                  style={{ background: V.card, border: `1px solid ${V.border}`, color: V.fg }}>
                  Try the builder
                </MagneticButton>
              </>
            ) : (
              <MagneticButton href="/builder" className="group inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white"
                style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: `0 0 50px ${V.primaryGlow(0.4)}` }}>
                Open builder <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </MagneticButton>
            )}
          </div>
          <p className="mt-6 text-sm text-muted-foreground/70">No credit card required · Free plan available · Cancel anytime</p>
        </motion.div>
      </section>
    </div>
  );
}
