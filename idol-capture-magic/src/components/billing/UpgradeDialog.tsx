import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";

import { api, isApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PRICING_FEATURES, PRICING_PLANS, type PaidPlan } from "@/lib/pricing";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);

  async function startCheckout(plan: PaidPlan) {
    setLoadingPlan(plan);
    try {
      const session = await api.billingCheckout(plan);
      window.location.href = session.url;
    } catch (error) {
      if (isApiError(error) && error.code === "checkout_unavailable") {
        toast.error("Checkout is temporarily unavailable. Try again in a moment.");
      } else {
        toast.info(error instanceof Error ? error.message : "Sign in before checkout.");
      }
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upgrade credits</DialogTitle>
          <DialogDescription>
            Daily credits are used only when a generation succeeds. Pick a plan to keep creating.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-3">
          <span className="text-sm text-gray-600">Monthly</span>
          <Switch checked={annual} onCheckedChange={setAnnual} />
          <span className="text-sm font-semibold text-idol-gold">Annual, 2 months free</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PRICING_PLANS.map((item) => (
            <section key={item.name} className="border border-black/10 p-4">
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <p className="mt-2 text-2xl font-bold">
                {annual ? item.annualPrice : item.monthlyPrice}
              </p>
              <p className="mt-3 min-h-12 text-sm text-gray-600">{item.description}</p>
              {item.plan ? (
                <Button
                  className="mt-4 w-full"
                  onClick={() => startCheckout(item.plan)}
                  disabled={loadingPlan === item.plan}
                >
                  {loadingPlan === item.plan ? "Opening..." : `Choose ${item.name}`}
                </Button>
              ) : (
                <Button className="mt-4 w-full" variant="outline" disabled>
                  Current free tier
                </Button>
              )}
            </section>
          ))}
        </div>

        <div className="overflow-x-auto border border-black/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Feature</th>
                <th className="p-3">Free</th>
                <th className="p-3">Plus</th>
                <th className="p-3">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {PRICING_FEATURES.map(([feature, free, plus, pro]) => (
                <tr key={feature}>
                  <td className="p-3 font-medium">{feature}</td>
                  {[free, plus, pro].map((value, index) => (
                    <td key={`${feature}-${index}`} className="p-3">
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
      </DialogContent>
    </Dialog>
  );
}
