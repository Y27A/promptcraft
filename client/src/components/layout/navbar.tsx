import { Link, useLocation } from "wouter";
import { Zap, ChevronDown, LayoutDashboard, History, Settings } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSafeUser } from "@/lib/clerk-safe";

const NAV_LINKS = [
  { href: "/builder", label: "Builder" },
  { href: "/templates", label: "Templates" },
  { href: "/gallery", label: "Gallery" },
  { href: "/billing", label: "Pricing" },
  { href: "/guide", label: "Guide" },
];

export function Navbar() {
  const [location] = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const { isSignedIn, user } = useSafeUser();
  const firstName = user?.firstName;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-[hsl(230_40%_4%/0.85)] backdrop-blur-xl shadow-sm shadow-primary/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            PromptCraft
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                location === l.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border/50 px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <div className="h-5 w-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                  {firstName?.[0] ?? "U"}
                </div>
                <span className="hidden md:block">{firstName}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
              {dropOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-1 z-50"
                  onMouseLeave={() => setDropOpen(false)}
                >
                  {[
                    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                    { href: "/history", icon: History, label: "History" },
                    { href: "/settings", icon: Settings, label: "Settings" },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
