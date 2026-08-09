import { useParams, Link } from "wouter";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Copy } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function SharePage() {
  usePageTitle("Shared Prompt");
  const { token } = useParams<{ token: string }>();

  let content = "";
  try {
    content = decodeURIComponent(escape(atob(token ?? "")));
  } catch (err) {
    console.warn("Failed to decode share token", err);
  }

  if (!content) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-bold mb-2">Invalid share link</h2>
      <p className="text-muted-foreground mb-4">This link may be broken or expired.</p>
      <Link href="/builder" className="text-primary underline">Open Builder</Link>
    </div>
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied!");
    } catch (err) {
      console.error("Clipboard write failed", err);
      toast.error("Couldn't copy — clipboard access was denied");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-4 text-xs text-muted-foreground">Shared prompt via PromptCraft</div>
      <div className="rounded-2xl border border-border bg-card p-6 mb-6">
        <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{content}</ReactMarkdown>
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={copy} className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Copy className="h-4 w-4" /> Copy prompt
        </button>
        <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02] transition-all">
          Sign up free — get 25 trials <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
