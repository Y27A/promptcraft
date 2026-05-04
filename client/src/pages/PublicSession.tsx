import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Loader2, User, Bot } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";

export default function PublicSession() {
  usePageTitle("Public Session");
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-session", slug],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/p/${slug}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
  });

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (isError || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-bold mb-2">Session not found</h2>
      <p className="text-muted-foreground">This session may no longer be public.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">You're viewing a public PromptCraft session.</p>
        <Link href="/sign-up" className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          Try it free <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-8">{data.title ?? "Untitled session"}</h1>

      <div className="space-y-4">
        {data.sessionMessages?.map((msg: any) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user"
                ? "rounded-tr-sm bg-primary text-primary-foreground"
                : "rounded-tl-sm border border-border bg-muted"
            }`}>
              {msg.role === "assistant" ? (
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{msg.content}</ReactMarkdown>
              ) : msg.content}
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
