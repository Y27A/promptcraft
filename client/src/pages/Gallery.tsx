import { useState } from "react";
import { useLocation } from "wouter";
import { Copy, Shuffle, Search, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";

const GALLERY = [
  { id:"g1", title:"Viral Twitter Thread Writer", category:"marketing", author:"@sara_mkts", prompt:"You are a Twitter growth strategist who has grown accounts to 100K+ followers. Write a 10-tweet thread about {topic} that hooks readers in the first tweet, delivers one actionable insight per tweet, and ends with a strong CTA. Use short punchy sentences. No filler. Every tweet must standalone." },
  { id:"g2", title:"Senior Code Reviewer", category:"code", author:"@marcust_dev", prompt:"You are a senior engineer with 10+ years experience. Review the following code for: (1) bugs and edge cases, (2) security vulnerabilities, (3) performance issues, (4) readability and naming, (5) missing tests. For each issue, explain why it's a problem and provide the corrected code snippet." },
  { id:"g3", title:"Cold Email That Gets Replies", category:"marketing", author:"@layla_h", prompt:"You are a B2B sales expert. Write a cold email to {recipient_role} at {company_type} companies. Subject under 6 words. Open with a specific insight, not a pitch. One value claim with a number. Soft CTA (15-min call). Max 120 words. No jargon." },
  { id:"g4", title:"Academic Paper Summarizer", category:"research", author:"@ali_research", prompt:"You are an academic researcher. Summarize the following paper in exactly this structure: (1) One-sentence TL;DR, (2) Problem being solved, (3) Methodology in plain English, (4) Key findings with numbers, (5) Limitations the authors admit, (6) Real-world applications. Max 300 words." },
  { id:"g5", title:"Product Launch Announcement", category:"marketing", author:"@nour_a", prompt:"You are a product marketing manager. Write a launch announcement for {product_name} targeting {audience}. Include: a compelling headline, the core problem it solves, 3 key benefits (outcome-focused), social proof placeholder, and a clear CTA. Tone: excited but professional. 250 words max." },
  { id:"g6", title:"1:1 Meeting Agenda Builder", category:"productivity", author:"@james_k", prompt:"You are an engineering manager. Create a structured 30-minute 1:1 agenda for a meeting with a direct report. Include: (1) Check-in question (2) Project updates section with specific questions (3) Blockers discussion (4) Career development touchpoint (5) Action items template. Make it feel human, not bureaucratic." },
  { id:"g7", title:"Python Refactor Expert", category:"code", author:"@ali_research", prompt:"You are a Python expert specialising in clean code. Refactor the provided code to: use idiomatic Python, improve readability, apply SOLID principles where relevant, add type hints, write docstrings, and suggest unit tests. Show the before and after side by side with explanations." },
  { id:"g8", title:"UX Copy Writer", category:"writing", author:"@saradesigns", prompt:"You are a UX writer at a top-tier product company. Rewrite the provided UI copy to be clearer, more human, and action-oriented. Apply these principles: use active voice, lead with benefit, avoid jargon, be specific not vague, and keep it scannable. Show original vs revised with notes." },
  { id:"g9", title:"Investor Pitch Deck Narrative", category:"business", author:"@james_k", prompt:"You are a startup pitch coach who has helped companies raise $50M+. Write the narrative for a pitch deck for {startup_name} in {industry}. Cover: problem, solution, market size, traction, business model, team, and ask. Each slide gets 2-3 punchy sentences. No fluff." },
  { id:"g10", title:"Lesson Plan Creator", category:"education", author:"@nour_a", prompt:"You are an experienced teacher. Create a 45-minute lesson plan for teaching {topic} to {age_group} students. Include: learning objectives, warm-up activity (5 min), main instruction (20 min), group activity (15 min), assessment (5 min). List materials needed and differentiation strategies." },
  { id:"g11", title:"Legal Document Simplifier", category:"legal", author:"@layla_h", prompt:"You are a legal expert who specialises in plain-English explanations. Read the following legal text and rewrite it so a non-lawyer can understand it. Keep all key obligations and rights. Flag any clauses that are unusual or potentially unfavourable. Use bullet points for clarity." },
  { id:"g12", title:"Performance Review Writer", category:"business", author:"@marcust_dev", prompt:"You are an HR professional. Write a balanced performance review for {employee_name} who is a {role}. Cover: key achievements (with specifics), areas of strength, one growth area with constructive framing, and goals for next quarter. Tone: honest, supportive, professional. 300 words." },
];

const CATS = ["all","marketing","code","writing","research","business","productivity","education","legal"];

export default function Gallery() {
  usePageTitle("Community Gallery");
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");

  const filtered = GALLERY.filter(g =>
    (cat === "all" || g.category === cat) &&
    (!search || g.title.toLowerCase().includes(search.toLowerCase()) || g.prompt.toLowerCase().includes(search.toLowerCase()))
  );

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch (err) {
      console.error("Clipboard write failed", err);
      toast.error("Couldn't copy — clipboard access was denied");
    }
  };
  const remix = (prompt: string) => {
    sessionStorage.setItem("promptcraft:prefillInput", `Remix and improve this prompt: ${prompt}`);
    navigate("/builder?refine=1");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-7 w-7 text-secondary" /> Community Gallery
        </h1>
        <p className="text-muted-foreground">Browse and remix expert prompts curated by the community.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search gallery…"
            className="w-full rounded-xl border border-border bg-muted pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors"
              style={cat === c ? { background: "hsl(var(--primary))", color: "white", borderColor: "hsl(var(--primary))" } : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-snug">{item.title}</h3>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground border border-border">{item.category}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 flex-1 leading-relaxed">{item.prompt}</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60">{item.author}</span>
              <div className="flex gap-1.5">
                <button onClick={() => copy(item.prompt)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Copy className="h-3 w-3" /> Copy
                </button>
                <button onClick={() => remix(item.prompt)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
                  <Zap className="h-3 w-3" /> Use
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
