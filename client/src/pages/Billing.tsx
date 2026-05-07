import { useState } from "react";
import { CheckCircle, Zap, Star, Infinity } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Page, FadeUp } from "@/components/ui/page-motion";

const PLANS = [
  {
    tier: "free",
    monthly: 0,
    yearly: 0,
    dailyLimit: 10,
    features: [
      "10 prompt generations per day",
      "2 versions per generation",
      "Download as .md / .txt / .json",
      "Public template library",
      "No credit card required",
    ],
  },
  {
    tier: "pro",
    monthly: 9,
    yearly: 79,
    dailyLimit: 50,
    features: [
      "50 prompt generations per day",
      "Save unlimited prompts",
      "Full prompt history",
      "Custom templates",
      "Priority support",
    ],
  },
  {
    tier: "unlimited",
    monthly: 25,
    yearly: 199,
    dailyLimit: -1,
    features: [
      "Unlimited generations",
      "Everything in Pro",
      "🧩 Browser Extension (Chrome/Edge/Brave)",
      "Works on ChatGPT, Claude, Gemini & more",
      "Analytics dashboard",
      "Dedicated support",
    ],
  },
];

const PLAN_ICONS = { free: Zap, pro: Star, unlimited: Infinity };
const PLAN_COLORS = {
  free: "border-border",
  pro: "border-primary shadow-lg shadow-primary/20",
  unlimited: "border-secondary shadow-lg shadow-secondary/10",
};

export default function Billing() {
  usePageTitle("Pricing");
  const [yearly, setYearly] = useState(false);

  return (
    <Page className="mx-auto max-w-5xl px-4 py-16">
      <FadeUp className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-3">Simple, transparent pricing</h1>
        <p className="text-muted-foreground text-lg">Start for free. Upgrade when you need more.</p>
        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-2xl p-1.5" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <button
            onClick={() => setYearly(false)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={!yearly ? { background: "hsl(var(--card))", color: "hsl(var(--foreground))", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" } : { color: "hsl(var(--muted-foreground))" }}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className="relative px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={yearly ? { background: "hsl(var(--primary))", color: "white", boxShadow: "0 0 20px hsl(var(--primary) / 0.4)" } : { color: "hsl(var(--muted-foreground))" }}
          >
            Yearly
            <span className="absolute -top-2.5 -right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "hsl(var(--secondary))", color: "white" }}>
              SAVE 30%
            </span>
          </button>
        </div>
      </FadeUp>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.tier as keyof typeof PLAN_ICONS] ?? Zap;
          const borderClass = PLAN_COLORS[plan.tier as keyof typeof PLAN_COLORS] ?? "border-border";
          const isPro = plan.tier === "pro";
          const price = plan.tier === "free" ? "$0" : yearly ? `$${plan.yearly}` : `$${plan.monthly}`;
          const period = plan.tier === "free" ? "forever" : yearly ? "/ year" : "/ month";
          const savingsNote = yearly && plan.tier !== "free"
            ? `vs $${plan.monthly * 12}/yr billed monthly`
            : null;

          return (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border-2 bg-card p-7 flex flex-col ${borderClass}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isPro ? "bg-primary/15 border border-primary/30" : "bg-muted border border-border"}`}>
                  <Icon className={`h-5 w-5 ${isPro ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h2 className="font-bold text-lg capitalize">{plan.tier}</h2>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-extrabold">{price}</p>
                    <span className="text-sm text-muted-foreground">{period}</span>
                  </div>
                  {savingsNote && <p className="text-[10px] text-secondary mt-0.5">{savingsNote}</p>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                {plan.dailyLimit === -1 ? "Unlimited generations" : `${plan.dailyLimit} generations/day`}
              </p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.tier === "free" ? (
                <a href="/sign-up" className="block text-center rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                  Get started free
                </a>
              ) : (
                <a
                  href={`mailto:yousifalbalooshi@gmail.com?subject=PromptCraft%20Upgrade%20%E2%80%94%20${plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}%20(${yearly ? "Yearly" : "Monthly"})`}
                  className={`block text-center rounded-xl py-2.5 text-sm font-medium transition-all ${
                    isPro
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:scale-[1.02]"
                      : "border border-secondary/40 text-secondary hover:bg-secondary/10"
                  }`}
                >
                  Contact us to upgrade
                </a>
              )}
            </div>
          );
        })}
      </div>

      <FadeUp className="mt-10 text-center text-sm text-muted-foreground">
        All prices in USD. Payment via BenefitPay or bank transfer. Tier activated within 24 hours after confirmation.
      </FadeUp>
    </Page>
  );
}
