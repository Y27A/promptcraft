import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Zap, Star, Infinity } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { API_BASE } from "@/lib/utils";

const PLAN_ICONS = { free: Zap, pro: Star, unlimited: Infinity };
const PLAN_COLORS = {
  free: "border-border",
  pro: "border-primary shadow-lg shadow-primary/10",
  unlimited: "border-secondary shadow-lg shadow-secondary/10",
};

export default function Billing() {
  usePageTitle("Pricing");
  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => { const r = await fetch(`${API_BASE}/api/me/plans`); return r.json(); },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-3">Simple, transparent pricing</h1>
        <p className="text-muted-foreground text-lg">Start for free. Upgrade when you need more.</p>
        <p className="mt-2 text-sm text-muted-foreground italic">
          Stripe is not available in the GCC region — upgrades are processed manually. Contact us to upgrade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: any) => {
          const Icon = PLAN_ICONS[plan.tier as keyof typeof PLAN_ICONS] ?? Zap;
          const borderClass = PLAN_COLORS[plan.tier as keyof typeof PLAN_COLORS] ?? "border-border";
          const isPro = plan.tier === "pro";
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
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isPro ? "bg-primary/10 border border-primary/20" : "bg-muted border border-border"}`}>
                  <Icon className={`h-5 w-5 ${isPro ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h2 className="font-bold text-lg capitalize">{plan.tier}</h2>
                  <p className="text-2xl font-extrabold">{plan.price}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                {plan.dailyLimit === -1 ? "Unlimited" : `${plan.dailyLimit} generations/day`}
              </p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f: string) => (
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
                  href="mailto:yousifalbalooshi@gmail.com?subject=PromptCraft%20Upgrade"
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
    </div>
  );
}
