import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useSafeUser, useSafeAuth } from "@/lib/clerk-safe";
import { Send, Plus, Copy, Download, TerminalSquare, Zap, Sparkles, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";
import { exportPrompt } from "@/lib/export";
import { streamGroq, SYSTEM_PROMPT } from "@/lib/groq";

function extractVersions(text: string): { v1: string; v2: string } | null {
  const v1 = text.match(/###\s*Version\s*1[^#\n]*\n+([\s\S]+?)(?=###\s*Version\s*2|$)/i);
  const v2 = text.match(/###\s*Version\s*2[^#\n]*\n+([\s\S]+?)(?=###\s*Version\s*[3-9]|$)/i);
  if (!v1 || !v2) return null;
  const clean = (s: string) => s.replace(/```[\w]*\n?/g, "").replace(/\n?```/g, "").trim();
  return { v1: clean(v1[1]), v2: clean(v2[1]) };
}

type Message = { role: "user" | "assistant"; content: string; id: string };

const DOMAINS = ["","Marketing","Coding","Writing","Research","Education","Business","Creative","Legal","Finance","Social"];
const TONES = ["","Professional","Casual","Formal","Friendly","Technical","Creative","Persuasive","Empathetic"];

export default function Builder() {
  usePageTitle("Builder");
  const { isSignedIn } = useSafeUser();
  const { getToken } = useSafeAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const LS_MSGS = "pc:msgs";
  const LS_VERS = "pc:vers";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_MSGS) ?? "[]"); } catch { return []; }
  });
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [promptVersions, setPromptVersions] = useState<{ v1: string; v2: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem(LS_VERS) ?? "null"); } catch { return null; }
  });
  const [activeVersion, setActiveVersion] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);
  const [trialUsed, setTrialUsed] = useState(0);
  const [trialLimit, setTrialLimit] = useState(10);
  const [domain, setDomain] = useState("");
  const [tone, setTone] = useState("");
  const [lastUserInput, setLastUserInput] = useState("");
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist chat to localStorage
  useEffect(() => { try { localStorage.setItem(LS_MSGS, JSON.stringify(messages)); } catch {} }, [messages]);
  useEffect(() => { try { localStorage.setItem(LS_VERS, JSON.stringify(promptVersions)); } catch {} }, [promptVersions]);

  useEffect(() => {
    if (!isSignedIn) {
      fetch(`${API_BASE}/api/trial/usage`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => { setTrialUsed(d.used); setTrialLimit(d.limit); })
        .catch(() => {});
    }
  }, [isSignedIn]);

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
  }, []);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const DIRECT = !!import.meta.env.VITE_GROQ_API_KEY;

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || streaming) return;
    setInput("");
    setLastUserInput(content);

    const userMsg: Message = { role: "user", content, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId }]);
    setStreaming(true);

    try {
      if (DIRECT) {
        let sysPrompt = SYSTEM_PROMPT + "\n\nAdvanced mode: reference chain-of-thought and few-shot techniques.";
        if (domain || tone) sysPrompt += `\n\nUser context — domain: ${domain || "general"}, tone: ${tone || "neutral"}.`;
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        await streamGroq(
          [{ role: "system", content: sysPrompt }, ...history, { role: "user", content }],
          (delta) => setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + delta } : m)),
          () => {
            setStreaming(false);
            setMessages((prev) => {
              const last = prev.find((m) => m.id === assistantId);
              if (last) {
                const versions = extractVersions(last.content);
                if (versions) { setPromptVersions(versions); setActiveVersion(1); }
              }
              return prev;
            });
          },
        );
        setTrialUsed((u) => u + 1);
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
        setTrialUsed((u) => u + 1);
        await handleStream(response, assistantId);
      }
    } catch {
      toast.error("Generation failed. Please try again.");
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

  const activeContent = promptVersions
    ? (activeVersion === 1 ? promptVersions.v1 : promptVersions.v2)
    : [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";

  const copyActive = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  };

  const doExport = (fmt: "md" | "txt" | "json") => {
    exportPrompt(`prompt-v${activeVersion}`, activeContent, fmt);
    setShowExport(false);
    toast.success(`Exported as .${fmt}`);
  };

  const quotaExhausted = !isSignedIn && trialUsed >= trialLimit;

  const selectStyle = {
    background: "hsl(var(--muted))",
    border: "1px solid hsl(var(--border))",
    color: "hsl(var(--muted-foreground))",
    borderRadius: "0.5rem",
    padding: "0.25rem 0.5rem",
    fontSize: "0.75rem",
    outline: "none",
    cursor: "pointer",
  } as React.CSSProperties;

  return (
    <div className="flex flex-1 overflow-hidden bg-background" style={{ minHeight: 0 }}>
      {/* Chat pane */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-border">

        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 12px hsl(var(--primary) / 0.4)" }}>
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground">PromptCraft Builder</span>
          </div>
          <div className="flex items-center gap-2">
            {lastUserInput && !streaming && (
              <button onClick={() => { setInput(lastUserInput); setTimeout(() => send(), 0); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all border border-border text-muted-foreground hover:text-foreground"
                title="Regenerate">
                <RefreshCw className="h-3 w-3" /> Regen
              </button>
            )}
            {isSignedIn && (
              <button
                onClick={() => { setMessages([]); setSessionId(null); setPromptVersions(null); setLastUserInput(""); localStorage.removeItem(LS_MSGS); localStorage.removeItem(LS_VERS); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all border border-border text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            )}
          </div>
        </div>

        {/* Domain + Tone dropdowns */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/50">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Domain</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} style={selectStyle}>
            {DOMAINS.map((d) => <option key={d} value={d.toLowerCase()}>{d || "Any"}</option>)}
          </select>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tone</span>
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
              <h3 className="font-bold text-lg mb-2 text-foreground">What do you want to prompt?</h3>
              <p className="text-sm max-w-xs leading-relaxed text-muted-foreground">Describe your goal in plain English and get two production-ready prompts instantly</p>
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

        {/* Quota banner */}
        {!isSignedIn && (
          <div className="px-4 py-2 text-xs text-center border-t border-border"
            style={{ background: quotaExhausted ? "hsl(0 60% 12%)" : "hsl(var(--muted))", color: quotaExhausted ? "hsl(0 70% 65%)" : "hsl(var(--muted-foreground))" }}>
            {quotaExhausted
              ? <>Trial limit reached — <Link href="/sign-up" className="font-semibold underline">Sign up free</Link> to continue</>
              : `${trialLimit - trialUsed} of ${trialLimit} free trials remaining`}
          </div>
        )}

        {/* Input */}
        <div className="px-3 pt-3 pb-2 border-t border-border bg-card">
          <div className="flex gap-2 items-end">
            <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Describe what you want to prompt… (Enter to send)"
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
      <div className="hidden md:flex flex-col w-[45%] min-w-[340px] max-w-[600px]">
        {/* Output header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
            {/* V1 / V2 always visible */}
            <div className="flex gap-1">
              {([1, 2] as const).map((v) => (
                <button key={v} onClick={() => setActiveVersion(v)}
                  disabled={!promptVersions}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all disabled:opacity-30"
                  style={activeVersion === v && promptVersions ? {
                    background: "hsl(var(--primary))", color: "white", boxShadow: "0 0 12px hsl(var(--primary) / 0.35)",
                  } : {
                    background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))",
                  }}>
                  {v === 1 ? "V1 Detailed" : "V2 Concise"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={copyActive} disabled={!activeContent}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-40">
              <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy"}
            </button>
            {/* Export — click-based dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExport((v) => !v)}
                disabled={!activeContent}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted border border-border text-muted-foreground hover:text-foreground transition-all disabled:opacity-40">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 z-20 w-28 rounded-xl py-1 bg-card border border-border shadow-xl">
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
          {activeContent ? (
            <>
              <div className="rounded-2xl p-5 bg-card border border-border">
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{activeContent}</ReactMarkdown>
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
  );
}
