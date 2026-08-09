import { useLocation } from "wouter";
import { Link } from "wouter";
import { Zap, FolderOpen, Clock, MessageSquare, ExternalLink, Plus } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSafeUser } from "@/lib/clerk-safe";
import { formatAge } from "@/lib/utils";
import { readJSON } from "@/lib/storage";

function getStats() {
  const history = readJSON<any[]>("pc:history", []);
  const projects = readJSON<any[]>("pc:projects", []);
  const totalMsgs = history.reduce((n: number, h: any) => n + (h.messages?.length ?? 0), 0);
  return { sessions: history.length, projects: projects.length, messages: totalMsgs, recent: history.slice(0, 5) };
}

export default function Dashboard() {
  usePageTitle("Dashboard");
  const { user } = useSafeUser();
  const [, navigate] = useLocation();
  const stats = getStats();

  const resume = (entry: any) => {
    sessionStorage.setItem("pc:resume", JSON.stringify(entry));
    navigate("/builder?resume=1");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Welcome back{user?.firstName ? `, ${user.firstName}` : ""} 👋</h1>
        <p className="text-muted-foreground">Here's your PromptCraft overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {[
          { label: "Sessions", value: stats.sessions, icon: Clock },
          { label: "Projects", value: stats.projects, icon: FolderOpen },
          { label: "Messages", value: stats.messages, icon: MessageSquare },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border/50 bg-card p-5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        <Link href="/builder"
          className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 hover:bg-primary/10 transition-colors">
          <Zap className="h-5 w-5 text-primary" />
          <div><p className="font-semibold text-sm">New prompt</p><p className="text-xs text-muted-foreground">Open builder</p></div>
        </Link>
        <Link href="/projects"
          className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <div><p className="font-semibold text-sm">Projects</p><p className="text-xs text-muted-foreground">{stats.projects} workspace{stats.projects !== 1 ? "s" : ""}</p></div>
        </Link>
        <Link href="/history"
          className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div><p className="font-semibold text-sm">History</p><p className="text-xs text-muted-foreground">{stats.sessions} session{stats.sessions !== 1 ? "s" : ""}</p></div>
        </Link>
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
        {stats.recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground text-sm mb-3">No sessions yet.</p>
            <Link href="/builder" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" /> Start building
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recent.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3 hover:border-primary/30 transition-all">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{formatAge(Date.now() - entry.ts)}</p>
                </div>
                <button onClick={() => resume(entry)}
                  className="ml-3 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors shrink-0">
                  <ExternalLink className="h-3 w-3" /> Resume
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
