import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSafeUser } from "@/lib/clerk-safe";
import { readJSON, writeJSON, remove } from "@/lib/storage";

const DOMAINS = ["","Marketing","Coding","Writing","Research","Education","Business","Creative","Legal","Finance","Social"];
const TONES = ["","Professional","Casual","Formal","Friendly","Technical","Creative","Persuasive","Empathetic"];

function loadSettings() {
  return readJSON<{ defaultDomain?: string; defaultTone?: string }>("pc:settings", {});
}

export default function SettingsPage() {
  usePageTitle("Settings");
  const { user } = useSafeUser();
  const saved = loadSettings();
  const [domain, setDomain] = useState(saved.defaultDomain ?? "");
  const [tone, setTone] = useState(saved.defaultTone ?? "");

  const save = () => {
    if (!writeJSON("pc:settings", { defaultDomain: domain, defaultTone: tone })) {
      toast.error("Couldn't save settings — browser storage is full or unavailable");
      return;
    }
    toast.success("Settings saved");
  };

  const clearData = (key: string, label: string) => {
    remove(key);
    toast.success(`${label} cleared`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your PromptCraft experience.</p>
      </div>

      <div className="space-y-6">
        {/* Account info */}
        {user && (
          <section className="rounded-2xl border border-border/50 bg-card p-6">
            <h2 className="font-semibold text-lg mb-4">Account</h2>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "hsl(248 95% 62%)" }}>
                {user.firstName?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-muted-foreground">{user.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>
          </section>
        )}

        {/* Builder defaults */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold text-lg mb-1">Builder Defaults</h2>
          <p className="text-sm text-muted-foreground mb-5">Pre-select domain and tone every time you open the builder.</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Default Domain</label>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map(d => (
                  <button key={d} onClick={() => setDomain(d.toLowerCase())}
                    className="px-3 py-1.5 rounded-full border text-sm font-medium capitalize transition-colors"
                    style={domain === d.toLowerCase() ? { background: "hsl(var(--primary))", color: "white", borderColor: "hsl(var(--primary))" } : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    {d || "None"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Default Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t.toLowerCase())}
                    className="px-3 py-1.5 rounded-full border text-sm font-medium capitalize transition-colors"
                    style={tone === t.toLowerCase() ? { background: "hsl(var(--secondary))", color: "white", borderColor: "hsl(var(--secondary))" } : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                    {t || "None"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Model */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold text-lg mb-1">AI Model</h2>
          <p className="text-sm text-muted-foreground mb-3">Current model used for all generations.</p>
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            llama-3.3-70b-versatile (Groq) — fast & free
          </div>
        </section>

        {/* Data management */}
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Data Management</h2>
          <div className="space-y-3">
            {[
              { key: "pc:history", label: "Chat History" },
              { key: "pc:saved", label: "Saved Prompts" },
              { key: "pc:projects", label: "Projects" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <button onClick={() => clearData(key, label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
            ))}
          </div>
        </section>

        <button onClick={save}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:scale-[1.02] transition-all"
          style={{ boxShadow: "0 0 20px hsl(var(--primary) / 0.3)" }}>
          <Save className="h-4 w-4" /> Save settings
        </button>
      </div>
    </div>
  );
}
