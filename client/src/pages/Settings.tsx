import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { Save, Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTheme } from "@/components/theme-provider";
import { API_BASE } from "@/lib/utils";

export default function SettingsPage() {
  usePageTitle("Settings");
  const { getToken } = useAuth();
  const { themePref, setThemePref } = useTheme();
  const [localTheme, setLocalTheme] = useState(themePref);
  const [tone, setTone] = useState("professional");

  const authFetch = async (path: string, init?: RequestInit) => {
    const token = await getToken();
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
      credentials: "include",
    });
  };

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => { const r = await authFetch("/api/me/settings"); return r.json(); },
  });

  useEffect(() => {
    if (settings) { setTone(settings.defaultTone ?? "professional"); }
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async () => authFetch("/api/me/settings", {
      method: "PUT",
      body: JSON.stringify({ themePref: localTheme, defaultTone: tone }),
    }),
    onSuccess: () => { setThemePref(localTheme as any); toast.success("Settings saved"); },
    onError: () => toast.error("Failed to save settings"),
  });

  const THEMES = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  const TONES = ["professional", "casual", "academic", "playful", "formal", "friendly"];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your PromptCraft experience.</p>
      </div>

      <div className="space-y-8">
        {/* Theme */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Theme</h2>
          <div className="flex gap-3">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setLocalTheme(value as any); setThemePref(value as any); }}
                className={`flex flex-col items-center gap-2 flex-1 rounded-xl border p-3 transition-all ${
                  localTheme === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Default tone */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Default Tone</h2>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium capitalize transition-colors ${
                  tone === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Default model */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold text-lg mb-1">AI Model</h2>
          <p className="text-sm text-muted-foreground mb-3">Model selection is available on Pro and Unlimited plans.</p>
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            gpt-4o-mini (default)
          </div>
        </section>

        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {saveMut.isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
