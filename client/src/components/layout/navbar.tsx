import { Link, useLocation } from "wouter";
import { Zap, ChevronDown, LayoutDashboard, History, Settings, Menu, X, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSafeUser } from "@/lib/clerk-safe";

const NAV_LINKS = [
  { href: "/builder", label: "Builder" },
  { href: "/projects", label: "Projects" },
  { href: "/templates", label: "Templates" },
  { href: "/billing", label: "Pricing" },
  { href: "/guide", label: "Guide" },
];

export function Navbar() {
  const [location] = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn, user } = useSafeUser();
  const firstName = user?.firstName;

  return (
    <header className="sticky top-0 z-50 w-full" style={{ borderBottom: "1px solid hsl(var(--primary) / 0.08)", background: "hsl(var(--background) / 0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "hsl(var(--primary))", boxShadow: "0 0 16px hsl(var(--primary) / 0.5)" }}>
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span style={{ background: "linear-gradient(135deg, hsl(248 95% 78%), hsl(350 90% 70%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }} className="font-extrabold">
            PromptCraft
          </span>
        </Link>

        {/* Center nav — desktop */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn("px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150", location === l.href ? "text-white" : "hover:text-white")}
              style={location === l.href ? { background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))", boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.2)" } : { color: "hsl(var(--muted-foreground))" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {!isSignedIn ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/sign-in" className="px-3.5 py-1.5 text-sm font-medium transition-colors rounded-lg hover:bg-white/5" style={{ color: "hsl(var(--muted-foreground))" }}>
                Sign in
              </Link>
              <Link href="/sign-up" className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.03] hover:brightness-110"
                style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))", boxShadow: "0 0 20px hsl(248 95% 65% / 0.35)" }}>
                Sign up free
              </Link>
            </div>
          ) : (
            <div className="relative hidden md:block">
              <button onClick={() => setDropOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:brightness-110"
                style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.25)" }}>
                <div className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "hsl(248 95% 62%)", boxShadow: "0 0 10px hsl(248 95% 65% / 0.4)" }}>
                  {firstName?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="text-white">{firstName}</span>
                <ChevronDown className="h-3 w-3" style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>
              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl py-1.5 z-50"
                  style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", boxShadow: "0 20px 60px hsl(var(--primary) / 0.12), 0 8px 24px rgba(0,0,0,0.4)" }}
                  onMouseLeave={() => setDropOpen(false)}>
                  {[
                    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
                    { href: "/history", icon: History, label: "History" },
                    { href: "/settings", icon: Settings, label: "Settings" },
                    { href: "/admin", icon: ShieldCheck, label: "Admin" },
                  ].map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-all rounded-xl mx-1 hover:bg-white/5"
                      style={{ color: "hsl(230 15% 72%)" }}>
                      <Icon className="h-4 w-4" style={{ color: "hsl(230 15% 50%)" }} />
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-2 rounded-lg transition-all" style={{ color: "hsl(var(--muted-foreground))" }}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-4 space-y-1" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background) / 0.98)" }}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={location === l.href ? { background: "hsl(248 95% 65% / 0.1)", color: "hsl(248 95% 78%)", border: "1px solid hsl(248 95% 65% / 0.15)" } : { color: "hsl(230 15% 65%)" }}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 border-t mt-2 space-y-1" style={{ borderColor: "hsl(var(--border))" }}>
            {!isSignedIn ? (
              <>
                <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="flex px-3 py-2.5 text-sm font-medium rounded-xl" style={{ color: "hsl(var(--muted-foreground))" }}>Sign in</Link>
                <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="flex justify-center px-3 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: "linear-gradient(135deg, hsl(248 95% 62%), hsl(268 95% 58%))" }}>Sign up free</Link>
              </>
            ) : (
              <>
                {[{ href: "/dashboard", label: "Dashboard" }, { href: "/history", label: "History" }, { href: "/settings", label: "Settings" }].map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex px-3 py-2.5 text-sm font-medium rounded-xl" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
