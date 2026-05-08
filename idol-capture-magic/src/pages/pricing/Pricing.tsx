import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PRICING_FEATURES, PRICING_PLANS, type PaidPlan } from "@/lib/pricing";

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);

  async function startCheckout(plan: PaidPlan) {
    setLoadingPlan(plan);
    try {
      const session = await api.billingCheckout(plan);
      window.location.href = session.url;
    } catch (error) {
      toast.info(error instanceof Error ? error.message : "Sign in before checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <AppPageShell title="Pricing" description="Free, Plus, and Pro generation plans.">
      <div className="mb-8 flex items-center justify-end gap-3">
        <span className="text-sm text-gray-600">Monthly</span>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <span className="text-sm font-semibold text-idol-gold">Annual, 2 months free</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PRICING_PLANS.map((item) => (
          <section key={item.name} className="border border-black/10 p-5">
            <h2 className="text-2xl font-semibold">{item.name}</h2>
            <p className="mt-2 text-3xl font-bold">
              {annual ? item.annualPrice : item.monthlyPrice}
            </p>
            <p className="mt-3 min-h-12 text-sm text-gray-600">{item.description}</p>
            {item.plan ? (
              <Button
                className="mt-5 w-full"
                onClick={() => startCheckout(item.plan as PaidPlan)}
                disabled={loadingPlan === item.plan}
              >
                {loadingPlan === item.plan ? "Opening..." : `Choose ${item.name}`}
              </Button>
            ) : (
              <Button className="mt-5 w-full" variant="outline" asChild>
                <a href="/selca">Start free</a>
              </Button>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10 overflow-x-auto border border-black/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Feature</th>
              <th className="p-4">Free</th>
              <th className="p-4">Plus</th>
              <th className="p-4">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {PRICING_FEATURES.map(([feature, free, plus, pro]) => (
              <tr key={feature}>
                <td className="p-4 font-medium">{feature}</td>
                {[free, plus, pro].map((value, index) => (
                  <td key={`${feature}-${index}`} className="p-4">
                    {typeof value === "boolean" ? (
                      value ? (
                        <Check className="h-5 w-5 text-idol-gold" />
                      ) : (
                        <Minus className="h-5 w-5 text-gray-300" />
                      )
                    ) : (
                      value
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppPageShell>
  );
}
