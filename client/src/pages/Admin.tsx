import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "wouter";
import { ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";

export default function Admin() {
  usePageTitle("Admin");
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const authFetch = async (path: string, init?: RequestInit) => {
    const token = await getToken();
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
      credentials: "include",
    });
  };

  const { data: settings } = useQuery({
    queryKey: ["my-settings"],
    queryFn: async () => { const r = await authFetch("/api/me/settings"); return r.json(); },
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => { const r = await authFetch("/api/admin/users"); return r.json(); },
    enabled: settings?.isAdmin === true,
  });

  const tierMut = useMutation({
    mutationFn: async ({ userId, tier }: { userId: string; tier: string }) =>
      authFetch(`/api/admin/users/${userId}/tier`, { method: "PATCH", body: JSON.stringify({ tier }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Tier updated"); },
  });

  if (!settings?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Lock className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
        <h2 className="text-2xl font-bold mb-2">Admin only</h2>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-primary" /> Admin Panel
      </h1>
      <p className="text-muted-foreground mb-8">Manage user tiers.</p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">User ID</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tier</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Daily usage</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Admin</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Change tier</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.userId} className="border-t border-border hover:bg-muted transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.userId.slice(0, 20)}…</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      u.tier === "unlimited" ? "bg-amber-500/10 text-amber-400"
                        : u.tier === "pro" ? "bg-violet-500/10 text-violet-400"
                        : "bg-muted text-muted-foreground"
                    }`}>{u.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.dailyGenCount}</td>
                  <td className="px-4 py-3">{u.isAdmin ? "✓" : "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.tier}
                      onChange={(e) => tierMut.mutate({ userId: u.userId, tier: e.target.value })}
                      className="rounded-lg border border-border bg-muted px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {["free", "pro", "unlimited"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
