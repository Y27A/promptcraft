import { Link } from "wouter";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <Zap className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                PromptCraft
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Talk to us like a friend. We'll craft the perfect prompt for you.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Product</h4>
            <ul className="space-y-2">
              {[
                { href: "/builder", label: "Builder" },
                { href: "/templates", label: "Templates" },
                { href: "/gallery", label: "Gallery" },
                { href: "/billing", label: "Pricing" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">
              {[
                { href: "/guide", label: "Guide" },
                { href: "/gallery", label: "Community" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              {[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/50 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PromptCraft. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
