import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "wouter";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Lock } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";

export default function Analytics() {
  usePageTitle("Analytics");
  const { getToken } = useAuth();

  const { data: sub } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const token = await getToken();
      const r = await fetch(`${API_BASE}/api/me/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      return r.json();
    },
  });

  const isPro = sub?.tier === "pro" || sub?.tier === "unlimited";

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Analytics is a Pro feature</h2>
        <p className="text-muted-foreground mb-6">Upgrade to Pro or Unlimited to see your usage charts.</p>
        <Link href="/billing" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02] transition-all">
          View plans
        </Link>
      </div>
    );
  }

  // Mock data — a real implementation would query a per-day usage table
  const dailyData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    generations: Math.floor(Math.random() * 40) + 5,
  }));

  const domainData = [
    { domain: "Writing", count: 45 },
    { domain: "Code", count: 38 },
    { domain: "Marketing", count: 22 },
    { domain: "Research", count: 18 },
    { domain: "Other", count: 12 },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" /> Analytics
        </h1>
        <p className="text-muted-foreground">Your usage over the last 30 days.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold mb-4">Generations per day</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 12%)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="generations" stroke="hsl(262 83% 58%)" fill="hsl(262 83% 58% / 0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold mb-4">Top domains</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={domainData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="domain" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
              <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 10% 12%)", borderRadius: 8 }} />
              <Bar dataKey="count" fill="hsl(180 70% 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
