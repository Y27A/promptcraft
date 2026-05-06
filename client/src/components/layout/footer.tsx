import { Link } from "wouter";
import { Zap, Github, Twitter, Mail, ArrowUpRight } from "lucide-react";

const LINKS = {
  Product: [
    { href: "/builder", label: "Builder" },
    { href: "/templates", label: "Templates" },
    { href: "/gallery", label: "Gallery" },
    { href: "/billing", label: "Pricing" },
    { href: "/guide", label: "Guide" },
  ],
  Account: [
    { href: "/sign-up", label: "Sign up free" },
    { href: "/sign-in", label: "Sign in" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Settings" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden" style={{ background: "hsl(var(--background))", borderTop: "1px solid hsl(var(--primary) / 0.1)" }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[800px]" style={{ background: "radial-gradient(ellipse at center bottom, hsl(248 95% 65% / 0.06) 0%, transparent 70%)" }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-lg mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "hsl(248 95% 62%)", boxShadow: "0 0 20px hsl(248 95% 65% / 0.4)" }}>
                <Zap className="h-4.5 w-4.5 text-white" />
              </div>
              <span style={{ background: "linear-gradient(135deg, hsl(248 95% 75%), hsl(350 90% 68%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }} className="font-extrabold text-xl">
                PromptCraft
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "hsl(230 15% 52%)" }}>
              Turn plain English into expert-level AI prompts in seconds. Free forever, no credit card required.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Y27A"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-110"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              >
                <Github className="h-4 w-4" style={{ color: "hsl(230 15% 55%)" }} />
              </a>
              <a
                href="mailto:yousifalbalooshi@gmail.com"
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:scale-110"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              >
                <Mail className="h-4 w-4" style={{ color: "hsl(230 15% 55%)" }} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "hsl(230 15% 50%)" }}>{section}</h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm transition-colors group inline-flex items-center gap-1" style={{ color: "hsl(230 15% 58%)" }}>
                      <span className="group-hover:text-white transition-colors">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 mb-10" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.15)" }}>
          <div>
            <p className="font-bold text-base mb-1">Start crafting better prompts today</p>
            <p className="text-sm" style={{ color: "hsl(230 15% 55%)" }}>Free plan · No credit card · 10 generations/day forever</p>
          </div>
          <Link
            href="/sign-up"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.03] hover:brightness-110"
            style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 24px hsl(248 95% 65% / 0.3)" }}
          >
            Get started free <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <p className="text-xs" style={{ color: "hsl(230 15% 38%)" }}>
            © {new Date().getFullYear()} PromptCraft. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "hsl(230 15% 38%)" }}>
            Built with ♥ in Bahrain
          </p>
        </div>
      </div>
    </footer>
  );
}
