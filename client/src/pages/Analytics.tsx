import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, MessageSquare, Bookmark, FolderOpen, Zap } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { STORAGE_KEYS, readJSON } from "@/lib/storage";

export default function Analytics() {
  usePageTitle("Analytics");

  const history = useMemo(() => readJSON<any[]>(STORAGE_KEYS.history, []), []);
  const saved = useMemo(() => readJSON<any[]>(STORAGE_KEYS.saved, []), []);
  const projects = useMemo(() => readJSON<any[]>(STORAGE_KEYS.projects, []), []);

  const totalMsgs = useMemo(() => history.reduce((s: number, h: any) => s + (h.messages?.filter((m: any) => m.role === "user").length ?? 0), 0), [history]);

  // Sessions per day — last 14 days
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      map[d.toLocaleDateString("en-US", { month: "short", day: "numeric" })] = 0;
    }
    history.forEach((h: any) => {
      const d = new Date(h.ts);
      if (Date.now() - h.ts < 14 * 86400000) {
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (key in map) map[key]++;
      }
    });
    return Object.entries(map).map(([day, sessions]) => ({ day, sessions }));
  }, [history]);

  const stats = [
    { icon: MessageSquare, label: "Total sessions", value: history.length },
    { icon: Zap, label: "Messages sent", value: totalMsgs },
    { icon: Bookmark, label: "Saved prompts", value: saved.length },
    { icon: FolderOpen, label: "Projects", value: projects.length },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" /> Analytics
        </h1>
        <p className="text-muted-foreground">Your local usage stats.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl border border-border/50 bg-card p-5">
            <Icon className="h-5 w-5 text-primary mb-2" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <h2 className="font-semibold mb-4">Sessions — last 14 days</h2>
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No sessions yet — start building!</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
