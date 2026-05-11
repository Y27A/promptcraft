import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useSafeUser, useSafeAuth } from "@/lib/clerk-safe";
import { Send, Plus, Copy, Download, TerminalSquare, Zap, Sparkles, RefreshCw, FolderPlus, Check, Bookmark, Share2, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";
import { exportPrompt } from "@/lib/export";
import { streamGroq, buildSystemPrompt, type Mode } from "@/lib/groq";

function extractPlan(text: string): { plan: string; prompt: string } | null {
  const idx = text.search(/##\s*✦\s*Prompt/i);
  if (idx === -1) return null;
  const plan = text.slice(0, idx).replace(/##\s*🗺️?\s*Plan\s*/i, "").trim();
  const prompt = text.slice(idx).replace(/##\s*✦\s*Prompt\s*/i, "").trim();
  return plan && prompt ? { plan, prompt } : null;
}

function extractVersions(text: string): { v1: string; v2: string } | null {
  const sep = /#{1,3}\s*Version\s*2/i;
  const v1Start = text.search(/#{1,3}\s*Version\s*1/i);
  const v2Start = text.search(sep);
  if (v1Start === -1 || v2Start === -1) return null;
  const clean = (s: string) => s.replace(/^[^\n]*\n/, "").replace(/```[\w]*\n?/g, "").replace(/\n?```/g, "").replace(/^---+\s*$/m, "").trim();
  const v1 = clean(text.slice(v1Start, v2Start));
  const afterV2 = text.slice(v2Start);
  const endMatch = afterV2.search(/\n#{1,3}\s*(?!Version\s*2)/);
  const v2 = clean(endMatch > -1 ? afterV2.slice(0, endMatch) : afterV2);
  if (!v1 || !v2) return null;
  return { v1, v2 };
}

type Message = { role: "user" | "assistant"; content: string; id: string };

const DOMAINS = ["","Marketing","Coding","Writing","Research","Education","Business","Creative","Legal","Finance","Social"];
const TONES = ["","Professional","Casual","Formal","Friendly","Technical","Creative","Persuasive","Empathetic"];
const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "quick",     label: "⚡ Quick",     desc: "One short ready-to-paste prompt" },
  { id: "standard",  label: "✦ Standard",  desc: "Detailed + concise versions" },
  { id: "advanced",  label: "🔬 Advanced",  desc: "Maximum depth & examples" },
  { id: "developer", label: "💻 Developer", desc: "Code-task optimised" },
  { id: "marketing", label: "📣 Marketing", desc: "Copy & persuasion focused" },
  { id: "plan",      label: "🗺️ Plan",      desc: "See reasoning + final prompt" },
  { id: "action",    label: "▶ Action",    desc: "Generate prompt & run it instantly" },
];

export default function Builder() {
  usePageTitle("Builder");
  const { isSignedIn } = useSafeUser();
  const { getToken } = useSafeAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const sessionKeyRef = useRef(Date.now().toString());

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [promptVersions, setPromptVersions] = useState<{ v1: string; v2: string } | null>(null);
  const [activeVersion, setActiveVersion] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);
  const [trialUsed, setTrialUsed] = useState(() => { try { const today = new Date().toDateString(); if (localStorage.getItem("pc:trialDate") !== today) { localStorage.setItem("pc:trialDate", today); localStorage.setItem("pc:trialUsed", "0"); return 0; } return parseInt(localStorage.getItem("pc:trialUsed") ?? "0", 10); } catch { return 0; } });
  const trialLimit = 10;
  const [domain, setDomain] = useState(() => { try { return JSON.parse(localStorage.getItem("pc:settings") ?? "{}").defaultDomain ?? ""; } catch { return ""; } });
  const [tone, setTone] = useState(() => { try { return JSON.parse(localStorage.getItem("pc:settings") ?? "{}").defaultTone ?? ""; } catch { return ""; } });
  const [lastUserInput, setLastUserInput] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [savedToProject, setSavedToProject] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("standard");
  const [mobileTab, setMobileTab] = useState<"chat"|"output">("chat");
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("pc:visited"));
  const [actionResult, setActionResult] = useState("");
  const [actionStreaming, setActionStreaming] = useState(false);
  const [planData, setPlanData] = useState<{ plan: string; prompt: string } | null>(null);
  const [actionTab, setActionTab] = useState<"prompt"|"result">("prompt");
  const exportRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // Auto-switch to output on mobile when done
  useEffect(() => {
    if (!streaming && promptVersions) setMobileTab("output");
  }, [streaming, promptVersions]);

  // Save to history after streaming ends
  useEffect(() => {
    if (streaming || messages.length === 0) return;
    const hasReply = messages.some(m => m.role === "assistant" && m.content.length > 10);
    if (!hasReply) return;
    try {
      const title = messages.find(m => m.role === "user")?.content.slice(0, 70) ?? "Untitled";
      const history: any[] = JSON.parse(localStorage.getItem("pc:history") ?? "[]");
      const key = sessionKeyRef.current;
      const idx = history.findIndex(h => h.id === key);
      const entry = { id: key, title, messages, versions: promptVersions, ts: Date.now() };
      if (idx >= 0) history[idx] = entry; else history.unshift(entry);
      localStorage.setItem("pc:history", JSON.stringify(history.slice(0, 100)));
    } catch {}
  }, [streaming]);

  const addTrial = () => setTrialUsed(u => { const n = u + 1; try { localStorage.setItem("pc:trialUsed", String(n)); } catch {} return n; });

  const runAction = useCallback(async (generatedPrompt: string) => {
    setActionResult("");
    setActionStreaming(true);
    setActionTab("result");
    try {
      await streamGroq(
        [{ role: "user", content: generatedPrompt }],
        (delta) => setActionResult(r => r + delta),
        () => setActionStreaming(false),
      );
    } catch (err) {
      setActionStreaming(false);
      toast.error("Action execution failed");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    const prefill = sessionStorage.getItem("promptcraft:prefillInput");
    if (params.get("refine") && prefill) {
      setInput(prefill);
      sessionStorage.removeItem("promptcraft:prefillInput");
    }
    const remix = sessionStorage.getItem("promptcraft:remixPrompt");
    if (params.get("remix") && remix) {
      setInput(`Remix this prompt: ${remix}`);
      sessionStorage.removeItem("promptcraft:remixPrompt");
    }
    // Resume a history session
    const resumeRaw = sessionStorage.getItem("pc:resume");
    if (params.get("resume") && resumeRaw) {
      try {
        const entry = JSON.parse(resumeRaw);
        sessionKeyRef.current = entry.id;
        localStorage.setItem("pc:sessionKey", entry.id);
        setMessages(entry.messages ?? []);
        setPromptVersions(entry.versions ?? null);
      } catch {}
      sessionStorage.removeItem("pc:resume");
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) setShowProjectPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const DIRECT = !!import.meta.env.VITE_GK;

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || streaming) return;
    if (!isSignedIn && trialUsed >= trialLimit) {
      toast.error("Trial limit reached — sign up for 25 free trials");
      return;
    }
    setInput("");
    setLastUserInput(content);

    const userMsg: Message = { role: "user", content, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId }]);
    setStreaming(true);

    try {
      if (DIRECT) {
        const sysPrompt = buildSystemPrompt(mode, domain, tone);
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        await streamGroq(
          [{ role: "system", content: sysPrompt }, ...history, { role: "user", content }],
          (delta) => setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + delta } : m)),
          () => {
            setStreaming(false);
            setMessages((prev) => {
              const last = prev.find((m) => m.id === assistantId);
              if (last) {
                if (mode === "plan") {
                  const pd = extractPlan(last.content);
                  if (pd) { setPlanData(pd); setPromptVersions(null); }
                } else if (mode === "action") {
                  setActionTab("prompt");
                  runAction(last.content);
                } else {
                  const versions = extractVersions(last.content);
                  if (versions) { setPromptVersions(versions); setActiveVersion(1); }
                }
              }
              return prev;
            });
          },
        );
        addTrial();
        return;
      }

      if (isSignedIn) {
        let sid = sessionId;
        if (!sid) {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/api/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          sid = (await res.json()).id;
          setSessionId(sid);
        }
        const token = await getToken();
        const response = await fetch(`${API_BASE}/api/openai/sessions/${sid}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content, mode: "advanced", domain: domain || undefined, style: tone || undefined }),
          credentials: "include",
        });
        await handleStream(response, assistantId);
      } else {
        const response = await fetch(`${API_BASE}/api/trial/refine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, mode: "advanced", domain: domain || undefined, style: tone || undefined }),
          credentials: "include",
        });
        if (response.status === 402) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          toast.error("Trial limit reached — sign up free to continue");
          setStreaming(false);
          return;
        }
        addTrial();
        await handleStream(response, assistantId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, isSignedIn, sessionId, domain, tone, getToken, messages]);

  async function handleStream(response: Response, assistantId: string) {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            full += parsed.content;
            setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: full } : m));
          }
        } catch {}
      }
    }
    const versions = extractVersions(full);
    if (versions) { setPromptVersions(versions); setActiveVersion(1); }
  }

  const rawAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const activeContent = mode === "plan"
    ? (planData ? ((actionTab as string) === "plan" ? planData.plan : planData.prompt) : rawAssistant)
    : mode === "action"
    ? (actionTab === "result" ? actionResult : rawAssistant)
    : promptVersions
    ? (activeVersion === 1 ? promptVersions.v1 : promptVersions.v2)
    : rawAssistant;

  const copyActive = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const saveToProject = (projectId: string) => {
    try {
      const history: any[] = JSON.parse(localStorage.getItem("pc:history") ?? "[]");
      const key = sessionKeyRef.current;
      const idx = history.findIndex(h => h.id === key);
      if (idx >= 0) {
        history[idx].projectId = projectId;
        localStorage.setItem("pc:history", JSON.stringify(history));
        const proj: any[] = JSON.parse(localStorage.getItem("pc:projects") ?? "[]");
        const name = proj.find(p => p.id === projectId)?.name ?? "project";
        setSavedToProject(projectId);
        toast.success(`Saved to "${name}"`);
      } else {
        toast.error("Generate something first, then save to a project");
      }
    } catch {}
    setShowProjectPicker(false);
  };

  const savePrompt = () => {
    if (!activeContent) return;
    try {
      const saved = JSON.parse(localStorage.getItem("pc:saved") ?? "[]");
      const title = messages.find(m => m.role === "user")?.content.slice(0, 70) ?? "Saved prompt";
      saved.unshift({ id: Date.now().toString(), title, content: activeContent, version: activeVersion, ts: Date.now() });
      localStorage.setItem("pc:saved", JSON.stringify(saved.slice(0, 200)));
      toast.success("Prompt saved to library");
    } catch {}
  };

  const sharePrompt = () => {
    if (!activeContent) return;
    try {
      const encoded = btoa(unescape(encodeURIComponent(activeContent)));
      const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${encoded}`;
      navigator.clipboard.writeText(url);
      toast.success("Share link copied!");
    } catch { toast.error("Failed to copy link"); }
  };

  const doExport = (fmt: "md" | "txt" | "json") => {
    exportPrompt(`prompt-v${activeVersion}`, activeContent, fmt);
    setShowExport(false);
    toast.success(`Exported as .${fmt}`);
  };

  const quotaExhausted = !isSignedIn && trialUsed >= trialLimit;

  const selectStyle = {
    background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))",
    color: "hsl(var(--muted-foreground))", borderRadius: "0.5rem",
    padding: "0.25rem 0.5rem", fontSize: "0.75rem", outline: "none", cursor: "pointer",
  } as React.CSSProperties;

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background" style={{ minHeight: 0 }}>
      {/* Onboarding banner */}
      {showOnboarding && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm" style={{ background: "hsl(248 95% 62% / 0.12)", borderBottom: "1px solid hsl(248 95% 62% / 0.25)" }}>
          <span className="text-muted-foreground">👋 <strong className="text-foreground">Welcome!</strong> Describe what you need in plain English — PromptCraft writes the perfect AI prompt for you.</span>
          <button onClick={() => { setShowOnboarding(false); localStorage.setItem("pc:visited","1"); }} className="shrink-0 text-xs px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">Got it</button>
        </div>
      )}

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-border bg-card">
        {(["chat","output"] as const).map(tab => (
          <button key={tab} onClick={() => setMobileTab(tab)}
            className="flex-1 py-2.5 text-sm font-semibold capitalize transition-all"
            style={mobileTab === tab ? { color: "hsl(var(--primary))", borderBottom: "2px solid hsl(var(--primary))" } : { color: "hsl(var(--muted-foreground))" }}>
            {tab === "chat" ? "💬 Chat" : "✨ Output"}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      {/* Chat pane */}
      <div className={`flex-col flex-1 min-w-0 border-r border-border ${mobileTab === "chat" ? "flex" : "hidden md:flex"}`}>

        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 12px hsl(var(--primary) / 0.4)" }}>
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground">PromptCraft Builder</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isSignedIn
              ? <span className="hidden sm:inline text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>✦ Unlimited</span>
              : <span className="text-xs font-semibold px-2 py-1 rounded-full" style={quotaExhausted ? { background: "hsl(0 60% 18%)", color: "hsl(0 70% 65%)" } : { background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                  {quotaExhausted ? "Limit reached" : `${trialLimit - trialUsed}/${trialLimit}`}
                </span>
            }
            {lastUserInput && !streaming && (
              <button onClick={() => { setInput(lastUserInput); setTimeout(() => send(), 0); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all border border-border text-muted-foreground hover:text-foreground"
                title="Regenerate">
                <RefreshCw className="h-3 w-3" /><span className="hidden sm:inline ml-0.5">Regen</span>
              </button>
            )}
            <button
              onClick={() => {
                const newKey = Date.now().toString();
                sessionKeyRef.current = newKey;
                localStorage.setItem("pc:sessionKey", newKey);
                localStorage.removeItem("pc:msgs");
                localStorage.removeItem("pc:vers");
                setMessages([]); setSessionId(null); setPromptVersions(null); setLastUserInput(""); setPlanData(null); setActionResult(""); setActionTab("prompt");
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all border border-border text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3 w-3" /><span className="hidden sm:inline ml-0.5">New</span>
            </button>
            <Link href="/history"
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all border border-border text-muted-foreground hover:text-foreground">
              <History className="h-3 w-3" /> History
            </Link>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-card/50 overflow-x-auto scrollbar-none">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} title={m.desc}
              className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={mode === m.id
                ? { background: "hsl(var(--primary))", color: "white" }
                : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Mode hint for plan/action */}
        {(mode === "plan" || mode === "action") && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs border-b border-border"
            style={{ background: "hsl(var(--primary) / 0.07)", color: "hsl(var(--primary))" }}>
            {mode === "plan"
              ? <><span className="text-base">🗺️</span> <span><strong>Plan mode:</strong> describe what you need — the AI will first show its <em>reasoning</em>, then give you the final prompt in two separate tabs.</span></>
              : <><span className="text-base">▶</span> <span><strong>Action mode:</strong> describe what you need — the AI writes a prompt, then <em>automatically runs it</em> so you see the real output instantly.</span></>
            }
          </div>
        )}

        {/* Domain + Tone + Model */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">Domain</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} style={selectStyle}>
            {DOMAINS.map((d) => <option key={d} value={d.toLowerCase()}>{d || "Any"}</option>)}
          </select>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">Tone</span>
          <select value={tone} onChange={(e) => setTone(e.target.value)} style={selectStyle}>
            {TONES.map((t) => <option key={t} value={t.toLowerCase()}>{t || "Any"}</option>)}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-3xl" style={{ background: "hsl(var(--primary) / 0.15)", filter: "blur(20px)" }} />
                <div className="relative h-16 w-16 rounded-3xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                  <TerminalSquare className="h-7 w-7" style={{ color: "hsl(var(--primary))" }} />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">
                {mode === "plan" ? "What do you want to build?" : mode === "action" ? "What should the AI do?" : "What do you want to prompt?"}
              </h3>
              <p className="text-sm max-w-xs leading-relaxed text-muted-foreground">
                {mode === "plan" ? "Describe your goal — you'll see the reasoning plan and the final prompt in separate tabs" : mode === "action" ? "Describe a task — a prompt gets written and run automatically, showing you the real AI output" : "Describe your goal in plain English and get two production-ready prompts instantly"}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["Write a cold email", "Build a React hook", "Analyze my data", "Summarize this doc"].map((s) => (
                  <button key={s} onClick={() => setInput(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:brightness-110 bg-card border border-border text-muted-foreground">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                style={msg.role === "user" ? {
                  background: "hsl(var(--primary))", color: "white", boxShadow: "0 4px 16px hsl(var(--primary) / 0.25)",
                } : {
                  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))",
                }}
              >
                {msg.role === "assistant" ? (
                  <div className="relative">
                    {streaming && msg === messages[messages.length - 1] && !msg.content ? (
                      <span className="flex gap-1 py-1">
                        {[0,1,2].map((i) => (
                          <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce" style={{ background: "hsl(var(--primary) / 0.7)", animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </span>
                    ) : (
                      <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{msg.content}</ReactMarkdown>
                    )}
                    {streaming && msg === messages[messages.length - 1] && msg.content && (
                      <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse rounded-sm" style={{ background: "hsl(var(--primary))" }} />
                    )}
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Trial wall */}
        {quotaExhausted && (
          <div className="mx-3 mb-1 mt-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm font-semibold text-foreground mb-0.5">You've used all 10 free trials</p>
            <p className="text-xs text-muted-foreground mb-3">Create a free account to keep going</p>
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 16px hsl(var(--primary) / 0.35)" }}>
              Sign up free →
            </Link>
          </div>
        )}
        {/* Input */}
        <div className="px-3 pt-2 pb-2 border-t border-border bg-card">
          <div className="flex gap-2 items-end">
            <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Describe what you want to prompt… (Enter or Ctrl+Enter to send)"
              disabled={quotaExhausted || streaming} rows={2}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed bg-muted border border-border text-foreground" />
            <button onClick={send} disabled={!input.trim() || streaming || quotaExhausted}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 20px hsl(var(--primary) / 0.35)" }}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Output pane */}
      <div className={`flex-col w-full md:w-[45%] md:min-w-[340px] md:max-w-[600px] ${mobileTab === "output" ? "flex" : "hidden md:flex"}`}>
        {/* Output header */}
        <div className="flex flex-col px-4 pt-3 pb-2 border-b border-border bg-card gap-2">
          {/* Row 1: icon + tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--primary))" }} />
              <div className="flex gap-1">
                {mode === "plan" ? (
                  ["plan","prompt"].map(t => (
                    <button key={t} onClick={() => setActionTab(t as any)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                      style={(actionTab as string) === t && planData ? { background: "hsl(var(--primary))", color: "white" } : { background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))", opacity: planData ? 1 : 0.3 }}>
                      {t === "plan" ? "🗺️ Plan" : "✦ Prompt"}
                    </button>
                  ))
                ) : mode === "action" ? (
                  ["prompt","result"].map(t => (
                    <button key={t} onClick={() => setActionTab(t as any)}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                      style={actionTab === t ? { background: "hsl(var(--primary))", color: "white" } : { background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                      {t === "prompt" ? "📝 Prompt" : "✨ Result"}
                    </button>
                  ))
                ) : (
                  ([1, 2] as const).map((v) => (
                    <button key={v} onClick={() => setActiveVersion(v)}
                      disabled={!promptVersions}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-30"
                      style={activeVersion === v && promptVersions ? { background: "hsl(var(--primary))", color: "white", boxShadow: "0 0 12px hsl(var(--primary) / 0.35)" } : { background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                      {v === 1 ? "V1 Detailed" : "V2 Concise"}
                    </button>
                  ))
                )}
              </div>
            </div>
            <button onClick={copyActive} disabled={!activeContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={activeContent ? { background: "hsl(var(--primary))", color: "white" } : { background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {/* Row 2: secondary actions — scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button onClick={sharePrompt} disabled={!activeContent}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-40">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button onClick={savePrompt} disabled={!activeContent}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-40">
              <Bookmark className="h-3.5 w-3.5" /> Save
            </button>
            {/* Save to project */}
            <div className="relative shrink-0" ref={projectRef}>
              <button onClick={() => setShowProjectPicker(v => !v)} disabled={!activeContent}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-40">
                {savedToProject ? <Check className="h-3.5 w-3.5 text-primary" /> : <FolderPlus className="h-3.5 w-3.5" />}
                Project
              </button>
              {showProjectPicker && (
                <div className="absolute left-0 top-full mt-1 z-20 w-48 rounded-xl py-1 bg-card border border-border shadow-xl">
                  {(() => {
                    const projects: any[] = JSON.parse(localStorage.getItem("pc:projects") ?? "[]");
                    return projects.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-muted-foreground text-center">
                        No projects yet.<br />
                        <Link href="/projects" className="text-primary underline">Create one →</Link>
                      </div>
                    ) : projects.map((p: any) => (
                      <button key={p.id} onClick={() => saveToProject(p.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                        {p.name}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>
            {/* Export */}
            <div className="relative shrink-0" ref={exportRef}>
              <button onClick={() => setShowExport((v) => !v)} disabled={!activeContent}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-40">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              {showExport && (
                <div className="absolute left-0 top-full mt-1 z-20 w-28 rounded-xl py-1 bg-card border border-border shadow-xl">
                  {(["md", "txt", "json"] as const).map((fmt) => (
                    <button key={fmt} onClick={() => doExport(fmt)}
                      className="block w-full px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                      .{fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === "action" && actionTab === "result" && actionStreaming && !actionResult && (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce bg-primary/60" style={{ animationDelay: `${i*0.15}s` }} />)}</span>
              Running your prompt…
            </div>
          )}
          {activeContent ? (
            <>
              <div className="rounded-2xl p-5 border border-border" style={{ background: "hsl(230 35% 9%)" }}>
                <ReactMarkdown className="prose prose-base prose-invert max-w-none" components={{
                  p: ({children}) => <p style={{ color: "hsl(220 20% 90%)", lineHeight: 1.75 }}>{children}</p>,
                  li: ({children}) => <li style={{ color: "hsl(220 20% 85%)" }}>{children}</li>,
                  strong: ({children}) => <strong style={{ color: "hsl(0 0% 100%)", fontWeight: 700 }}>{children}</strong>,
                  h1: ({children}) => <h1 style={{ color: "hsl(0 0% 100%)" }}>{children}</h1>,
                  h2: ({children}) => <h2 style={{ color: "hsl(0 0% 98%)" }}>{children}</h2>,
                  h3: ({children}) => <h3 style={{ color: "hsl(0 0% 96%)" }}>{children}</h3>,
                  code: ({children}) => <code style={{ background: "hsl(230 30% 15%)", color: "hsl(248 95% 80%)", padding: "0.1em 0.35em", borderRadius: "0.3em", fontSize: "0.85em" }}>{children}</code>,
                }}>{activeContent}</ReactMarkdown>
              </div>
              <div className="flex gap-3 mt-2 px-1 text-[10px] text-muted-foreground/60">
                <span>{activeContent.split(/\s+/).filter(Boolean).length} words</span>
                <span>{activeContent.length} chars</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-3xl bg-border/50" style={{ filter: "blur(15px)" }} />
                <div className="relative h-14 w-14 rounded-3xl flex items-center justify-center bg-muted border border-border">
                  <TerminalSquare className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold mb-1.5 text-muted-foreground">No output yet</h3>
              <p className="text-xs text-muted-foreground/60">Send a message to generate your prompt</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
