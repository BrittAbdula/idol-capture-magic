import { useCallback, useEffect, useState } from "react";
import { Check, LogIn, Minus } from "lucide-react";
import { toast } from "sonner";

import { api, getGoogleAuthUrl, isApiError, type BillingCycle } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import { openGoogleSignInTab } from "@/lib/authWindow";
import { PRICING_FEATURES, PRICING_PLANS, type PaidPlan } from "@/lib/pricing";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceSurface?: string | null;
}

interface PendingCheckout {
  plan: PaidPlan;
  billingCycle: BillingCycle;
}

export function UpgradeDialog({ open, onOpenChange, sourceSurface }: UpgradeDialogProps) {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const auth = useAuth();
  const authBusy = auth.isLoading || auth.isFetching;
  const waitingForSignIn = Boolean(pendingCheckout && !auth.user);

  const openCheckout = useCallback(
    async (plan: PaidPlan, billingCycle: BillingCycle, resumedAfterSignIn = false) => {
      setLoadingPlan(plan);
      trackEvent("checkout_start", {
        surface: "upgrade_dialog",
        trigger_surface: sourceSurface,
        plan,
        billing_cycle: billingCycle,
        resumed_after_sign_in: resumedAfterSignIn
      });
      try {
        const session = await api.billingCheckout(plan, billingCycle, {
          source: "upgrade_dialog",
          triggerSurface: sourceSurface,
          checkoutFlow: resumedAfterSignIn ? "resumed_after_sign_in" : "direct"
        });
        window.location.href = session.url;
      } catch (error) {
        trackEvent("checkout_error", {
          surface: "upgrade_dialog",
          trigger_surface: sourceSurface,
          plan,
          billing_cycle: billingCycle,
          resumed_after_sign_in: resumedAfterSignIn,
          error_code: isApiError(error) ? error.code : "unknown"
        });
        if (isApiError(error) && error.code === "checkout_unavailable") {
          toast.error("Checkout is temporarily unavailable. Try again in a moment.");
        } else {
          toast.info(error instanceof Error ? error.message : "Sign in before checkout.");
        }
      } finally {
        setLoadingPlan(null);
      }
    },
    [sourceSurface]
  );

  useEffect(() => {
    if (!pendingCheckout || auth.user) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void auth.refetch();
    }, 2_000);

    return () => window.clearInterval(intervalId);
  }, [auth, pendingCheckout]);

  useEffect(() => {
    if (!auth.user || !pendingCheckout || loadingPlan) {
      return;
    }

    const checkout = pendingCheckout;
    setPendingCheckout(null);
    toast.success("Signed in. Opening checkout...");
    void openCheckout(checkout.plan, checkout.billingCycle, true);
  }, [auth.user, loadingPlan, openCheckout, pendingCheckout]);

  async function startCheckout(plan: PaidPlan) {
    const billingCycle: BillingCycle = annual ? "annual" : "monthly";

    if (!auth.user) {
      trackEvent("sign_in_prompt", {
        surface: "upgrade_dialog",
        trigger_surface: sourceSurface,
        plan,
        billing_cycle: billingCycle
      });
      const opened = openGoogleSignInTab(getGoogleAuthUrl());
      if (opened) {
        setPendingCheckout({ plan, billingCycle });
        toast.info("Sign in with Google. Checkout will continue here.");
      } else {
        toast.error("Popup blocked. Allow popups and try again.");
      }
      return;
    }

    await openCheckout(plan, billingCycle);
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

        {!auth.user && !authBusy && (
          <div className="border border-idol-gold/30 bg-idol-gold/10 p-4 text-sm text-gray-700">
            {waitingForSignIn
              ? "Waiting for Google sign-in. Checkout will continue in this tab."
              : "Sign in first so the plan is attached to your IdolBooth account."}
          </div>
        )}

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
                  disabled={authBusy || waitingForSignIn || loadingPlan === item.plan}
                >
                  {!auth.user && !authBusy ? <LogIn className="mr-2 h-4 w-4" /> : null}
                  {loadingPlan === item.plan
                    ? "Opening..."
                    : authBusy
                      ? "Checking session..."
                      : waitingForSignIn && pendingCheckout?.plan === item.plan
                        ? "Waiting for sign-in..."
                        : auth.user
                          ? `Choose ${item.name}`
                          : `Sign in for ${item.name}`}
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
