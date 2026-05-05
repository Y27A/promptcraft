import { useState, useRef, useEffect, useCallback } from "react";
import { useSearch, useLocation } from "wouter";
import { useSafeUser, useSafeAuth } from "@/lib/clerk-safe";
import { Send, Plus, Copy, Download, Save, Share2, TerminalSquare, ChevronDown, Zap } from "lucide-react";
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Chat pane */}
      <div className="flex flex-col flex-1 border-r border-border/50 min-w-0">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold">PromptCraft</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === "beginner" ? "advanced" : "beginner")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                mode === "advanced"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "advanced" ? "Advanced" : "Beginner"}
            </button>
            {isSignedIn && (
              <button
                onClick={() => { setMessages([]); setSessionId(null); setPromptVersions(null); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <TerminalSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">What do you want to prompt?</h3>
              <p className="text-sm text-muted-foreground">Describe your goal in plain language</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm border border-border bg-muted"
                }`}
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
          <div className={`px-4 py-2 text-xs text-center border-t border-border/50 ${quotaExhausted ? "bg-destructive/10 text-destructive" : "text-muted-foreground"}`}>
            {quotaExhausted
              ? "Trial limit reached — Sign up for free to continue"
              : `${trialLimit - trialUsed} of ${trialLimit} free trials remaining`}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border/50 p-3">
          {showStyle && (
            <div className="flex gap-2 mb-2">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Domain (e.g. marketing)"
                className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Tone (e.g. casual)"
                className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
          <div className="flex gap-2 items-end">
            <button
              onClick={() => setShowStyle((v) => !v)}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              className="flex-1 resize-none rounded-xl border border-border bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming || quotaExhausted}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-center text-[10px] text-muted-foreground">Ctrl/Cmd + Enter to send</p>
        </div>
      </div>

      {/* Output pane */}
      <div className="hidden md:flex flex-col w-[45%] min-w-[340px] max-w-[600px]">
        {/* Output header */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <span className="font-semibold text-sm">Generated Output</span>
          <div className="flex items-center gap-2">
            <button onClick={copyActive} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy"}
            </button>
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 w-28 rounded-lg border border-border bg-card shadow-lg py-1">
                {(["md", "txt", "json"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => exportPrompt("prompt", activeContent, fmt)}
                    className="block w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
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
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
            {([1, 2] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveVersion(v)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeVersion === v
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === 1 ? "Version 1 · Detailed" : "Version 2 · Normal"}
              </button>
            ))}
          </div>
        )}

        {/* Output content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeContent ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{activeContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
                <TerminalSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No prompt yet</h3>
              <p className="text-sm text-muted-foreground">Send a message to generate your prompt</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
