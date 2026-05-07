import { usePageTitle } from "@/hooks/usePageTitle";
import { Puzzle, Zap, MousePointerClick, KeyRound, CheckCircle } from "lucide-react";

const STEPS = [
  { icon: KeyRound, title: "Get a free Groq API key", body: <>Go to <a href="https://console.groq.com" target="_blank" className="text-primary underline">console.groq.com</a>, sign up free, and create an API key.</> },
  { icon: Puzzle, title: "Download & install", body: "Download the extension ZIP below. In Chrome/Edge/Brave go to Extensions → Enable Developer Mode → Load Unpacked → select the folder." },
  { icon: KeyRound, title: "Paste your API key", body: "Click the PromptCraft icon in your toolbar, scroll to the bottom, paste your Groq key and hit Save." },
  { icon: MousePointerClick, title: "Generate & insert", body: 'Describe what you need, pick domain & tone, hit Generate. Click "Insert into AI" to paste directly into ChatGPT, Claude, Gemini, or any supported AI.' },
];

const SUPPORTED = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Poe"];

export default function Extension() {
  usePageTitle("Browser Extension");
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <Puzzle className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-3">PromptCraft Extension</h1>
        <p className="text-lg text-muted-foreground">Generate and insert perfect prompts on any AI tool — without leaving the page.</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {SUPPORTED.map(s => (
            <span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/20 text-primary">{s}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-12">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-border/50 bg-card p-6">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-primary">0{i + 1}</span>
                <h2 className="font-semibold">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center mb-8">
        <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
        <h2 className="font-bold text-xl mb-2">Download Extension</h2>
        <p className="text-muted-foreground text-sm mb-6">Available for Chrome, Edge, and Brave. Free to install — requires a free Groq API key.</p>
        <a
          href="https://github.com/Y27A/promptcraft/archive/refs/heads/main.zip"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 hover:scale-[1.02] transition-all"
        >
          Download ZIP
        </a>
        <p className="text-xs text-muted-foreground mt-3">Extract → open Extensions page → Load Unpacked → select the <code className="bg-muted px-1 rounded">extension/</code> folder</p>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-6">
        <h3 className="font-semibold mb-3">What's included</h3>
        <ul className="space-y-2">
          {[
            "Generate V1 Detailed + V2 Concise prompts from the popup",
            "Domain & Tone selectors",
            "One-click insert into the AI's input field",
            "Floating ⚡ PC button on supported sites",
            "Your API key stored securely in browser storage",
          ].map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
