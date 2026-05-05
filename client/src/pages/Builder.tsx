import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { useSafeUser, useSafeAuth } from "@/lib/clerk-safe";
import { Send, Plus, Copy, Download, Save, Share2, TerminalSquare, ChevronDown, Zap, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";
import { exportPrompt } from "@/lib/export";

function extractVersions(text: string): { v1: string; v2: string } | null {
  const v1 = text.match(/###\s*Version\s*1[^#\n]*\n+([\s\S]+?)(?=###\s*Version\s*2|$)/i);
  const v2 = text.match(/###\s*Version\s*2[^#\n]*\n+([\s\S]+?)(?=###\s*Version\s*[3-9]|$)/i);
  if (!v1 || !v2) return null;
  const clean = (s: string) => s.replace(/```[\w]*\n?/g, "").replace(/\n?```/g, "").trim();
  return { v1: clean(v1[1]), v2: clean(v2[1]) };
}

type Message = { role: "user" | "assistant"; content: string; id: string };

export default function Builder() {
  usePageTitle("Builder");
  const { isSignedIn } = useSafeUser();
  const { getToken } = useSafeAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [promptVersions, setPromptVersions] = useState<{ v1: string; v2: string } | null>(null);
  const [activeVersion, setActiveVersion] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);
  const [trialUsed, setTrialUsed] = useState(0);
  const [trialLimit, setTrialLimit] = useState(10);
  const [domain, setDomain] = useState("");
  const [tone, setTone] = useState("");
  const [mode, setMode] = useState<"beginner" | "advanced">("beginner");
  const [showStyle, setShowStyle] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { role: "assistant", content: "", id: assistantId }]);
    setStreaming(true);

    try {
      let url: string;
      let body: object;

      if (isSignedIn) {
        let sid = sessionId;
        if (!sid) {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/api/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          const data = await res.json();
          sid = data.id;
          setSessionId(sid);
        }
        url = `${API_BASE}/api/openai/sessions/${sid}/messages`;
        const token = await getToken();
        body = { content, mode, domain: domain || undefined, style: tone || undefined };
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
          credentials: "include",
        });
        await handleStream(response, assistantId);
      } else {
        const response = await fetch(`${API_BASE}/api/trial/refine`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, mode, domain: domain || undefined, style: tone || undefined }),
          credentials: "include",
        });
        if (response.status === 402) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          toast.error("Trial limit reached — sign up for free to continue");
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
  }, [input, streaming, isSignedIn, sessionId, mode, domain, tone, getToken]);

  async function handleStream(response: Response, assistantId: string) {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let full = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            full += parsed.content;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
            );
          }
        } catch {}
      }
    }

    const versions = extractVersions(full);
    if (versions) {
      setPromptVersions(versions);
      setActiveVersion(1);
    }
  }

  const activeContent = promptVersions
    ? activeVersion === 1 ? promptVersions.v1 : promptVersions.v2
    : [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";

  const copyActive = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const quotaExhausted = !isSignedIn && trialUsed >= trialLimit;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" style={{ background: "hsl(230 40% 4%)" }}>
      {/* Chat pane */}
      <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: "1px solid hsl(230 30% 12%)" }}>
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid hsl(230 30% 12%)", background: "hsl(230 38% 5%)" }}>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(248 95% 62%)", boxShadow: "0 0 12px hsl(248 95% 65% / 0.4)" }}>
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: "hsl(0 0% 92%)" }}>PromptCraft Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === "beginner" ? "advanced" : "beginner")}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={mode === "advanced" ? {
                background: "hsl(248 95% 65% / 0.12)",
                border: "1px solid hsl(248 95% 65% / 0.3)",
                color: "hsl(248 95% 75%)",
              } : {
                background: "hsl(230 38% 9%)",
                border: "1px solid hsl(230 30% 16%)",
                color: "hsl(230 15% 55%)",
              }}
            >
              {mode === "advanced" ? "⚡ Advanced" : "Beginner"}
            </button>
            {isSignedIn && (
              <button
                onClick={() => { setMessages([]); setSessionId(null); setPromptVersions(null); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                style={{ color: "hsl(230 15% 55%)", border: "1px solid hsl(230 30% 14%)" }}
              >
                <Plus className="h-3 w-3" /> New
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-3xl" style={{ background: "hsl(248 95% 65% / 0.15)", filter: "blur(20px)" }} />
                <div className="relative h-16 w-16 rounded-3xl flex items-center justify-center" style={{ background: "hsl(248 95% 65% / 0.1)", border: "1px solid hsl(248 95% 65% / 0.2)" }}>
                  <TerminalSquare className="h-7 w-7" style={{ color: "hsl(248 95% 72%)" }} />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "hsl(0 0% 92%)" }}>What do you want to prompt?</h3>
              <p className="text-sm max-w-xs leading-relaxed" style={{ color: "hsl(230 15% 50%)" }}>Describe your goal in plain English and get two production-ready prompts instantly</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["Write a cold email", "Build a React hook", "Analyze my data", "Summarize this doc"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:brightness-110"
                    style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)", color: "hsl(230 15% 62%)" }}
                  >
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
                  background: "hsl(248 95% 62%)",
                  color: "white",
                  boxShadow: "0 4px 16px hsl(248 95% 65% / 0.25)",
                } : {
                  background: "hsl(230 38% 8%)",
                  border: "1px solid hsl(230 30% 14%)",
                  color: "hsl(0 0% 88%)",
                }}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{msg.content || "Thinking…"}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quota banner */}
        {!isSignedIn && (
          <div className="px-4 py-2 text-xs text-center" style={{
            borderTop: "1px solid hsl(230 30% 12%)",
            background: quotaExhausted ? "hsl(0 60% 12%)" : "hsl(230 38% 6%)",
            color: quotaExhausted ? "hsl(0 70% 65%)" : "hsl(230 15% 50%)",
          }}>
            {quotaExhausted
              ? <>Trial limit reached — <Link href="/sign-up" className="font-semibold underline">Sign up free</Link> to continue</>
              : `${trialLimit - trialUsed} of ${trialLimit} free trials remaining`}
          </div>
        )}

        {/* Input */}
        <div className="p-3" style={{ borderTop: "1px solid hsl(230 30% 12%)", background: "hsl(230 38% 5%)" }}>
          {showStyle && (
            <div className="flex gap-2 mb-2">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Domain (e.g. marketing)"
                className="flex-1 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)", color: "hsl(0 0% 88%)" }}
              />
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Tone (e.g. casual)"
                className="flex-1 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)", color: "hsl(0 0% 88%)" }}
              />
            </div>
          )}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => setShowStyle((v) => !v)}
              className="p-2 rounded-xl transition-all"
              style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)", color: "hsl(230 15% 55%)" }}
              title="Style options"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showStyle ? "rotate-180" : ""}`} />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); }
              }}
              placeholder="Describe what you want to prompt…"
              disabled={quotaExhausted || streaming}
              rows={2}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)", color: "hsl(0 0% 90%)" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming || quotaExhausted}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 20px hsl(248 95% 65% / 0.35)" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px]" style={{ color: "hsl(230 15% 38%)" }}>Ctrl/Cmd + Enter to send</p>
        </div>
      </div>

      {/* Output pane */}
      <div className="hidden md:flex flex-col w-[45%] min-w-[340px] max-w-[600px]">
        {/* Output header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid hsl(230 30% 12%)", background: "hsl(230 38% 5%)" }}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "hsl(248 95% 70%)" }} />
            <span className="font-bold text-sm" style={{ color: "hsl(0 0% 92%)" }}>Generated Output</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={copyActive}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)", color: "hsl(230 15% 60%)" }}
            >
              <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy"}
            </button>
            <div className="relative group">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)", color: "hsl(230 15% 60%)" }}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 w-28 rounded-xl py-1" style={{ background: "hsl(230 38% 8%)", border: "1px solid hsl(230 30% 15%)", boxShadow: "0 16px 40px hsl(0 0% 0% / 0.5)" }}>
                {(["md", "txt", "json"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => exportPrompt("prompt", activeContent, fmt)}
                    className="block w-full px-3 py-2 text-left text-xs transition-all hover:bg-white/5"
                    style={{ color: "hsl(230 15% 65%)" }}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Version toggle */}
        {promptVersions && (
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid hsl(230 30% 12%)", background: "hsl(230 38% 5%)" }}>
            {([1, 2] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveVersion(v)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={activeVersion === v ? {
                  background: "hsl(248 95% 62%)",
                  color: "white",
                  boxShadow: "0 0 16px hsl(248 95% 65% / 0.3)",
                } : {
                  background: "hsl(230 38% 9%)",
                  border: "1px solid hsl(230 30% 16%)",
                  color: "hsl(230 15% 55%)",
                }}
              >
                {v === 1 ? "V1 · Detailed" : "V2 · Concise"}
              </button>
            ))}
          </div>
        )}

        {/* Output content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeContent ? (
            <div className="rounded-2xl p-5" style={{ background: "hsl(230 38% 7%)", border: "1px solid hsl(230 30% 14%)" }}>
              <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{activeContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="relative mb-5">
                <div className="absolute inset-0 rounded-3xl" style={{ background: "hsl(230 30% 14% / 0.5)", filter: "blur(15px)" }} />
                <div className="relative h-14 w-14 rounded-3xl flex items-center justify-center" style={{ background: "hsl(230 38% 9%)", border: "1px solid hsl(230 30% 16%)" }}>
                  <TerminalSquare className="h-6 w-6" style={{ color: "hsl(230 15% 45%)" }} />
                </div>
              </div>
              <h3 className="font-semibold mb-1.5" style={{ color: "hsl(230 15% 65%)" }}>No output yet</h3>
              <p className="text-xs" style={{ color: "hsl(230 15% 40%)" }}>Send a message to generate your prompt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
