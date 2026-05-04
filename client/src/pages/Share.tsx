import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Loader2 } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";

export default function SharePage() {
  usePageTitle("Shared Prompt");
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shared", token],
    queryFn: async () => {
      const r = await fetch(`${API_BASE}/api/shared/${token}`);
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
      <h2 className="text-2xl font-bold mb-2">Prompt not found</h2>
      <p className="text-muted-foreground">This share link may have expired or been revoked.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-2 text-xs text-muted-foreground">Shared prompt</div>
      <h1 className="text-3xl font-bold mb-8">{data.title}</h1>
      <div className="rounded-2xl border border-border bg-card p-6 mb-8">
        <ReactMarkdown className="prose prose-sm prose-invert max-w-none">{data.content}</ReactMarkdown>
      </div>
      <div className="text-center">
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02] transition-all"
        >
          Use as a template — Sign up free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
