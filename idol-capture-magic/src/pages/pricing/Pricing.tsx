import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const FEATURES = [
  ["Daily generations", "3", "30", "200"],
  ["Watermark", "Visible", "Small", "None"],
  ["Photocard double-side", true, true, true],
  ["HD download", false, true, true],
  ["Binder unlimited", true, true, true],
  ["Print PDF", false, false, true],
  ["Premium concepts", false, true, true],
  ["Fancall", false, false, true]
] as const;

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<"plus" | "pro" | null>(null);

  async function startCheckout(plan: "plus" | "pro") {
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
        {[
          ["Free", "$0", "Try the core flow with visible watermark.", null],
          ["Plus", annual ? "$49.90/yr" : "$4.99/mo", "More daily generations and small watermark.", "plus"],
          ["Pro", annual ? "$99.90/yr" : "$9.99/mo", "High-volume generation and Pro-only stubs.", "pro"]
        ].map(([name, price, description, plan]) => (
          <section key={name} className="border border-black/10 p-5">
            <h2 className="text-2xl font-semibold">{name}</h2>
            <p className="mt-2 text-3xl font-bold">{price}</p>
            <p className="mt-3 min-h-12 text-sm text-gray-600">{description}</p>
            {plan ? (
              <Button
                className="mt-5 w-full"
                onClick={() => startCheckout(plan as "plus" | "pro")}
                disabled={loadingPlan === plan}
              >
                {loadingPlan === plan ? "Opening..." : `Choose ${name}`}
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
            {FEATURES.map(([feature, free, plus, pro]) => (
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
