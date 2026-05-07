import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard, Image, Sparkles } from "lucide-react";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { AuthStatus } from "@/components/app/AuthStatus";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuota } from "@/hooks/useQuota";

export default function Dashboard() {
  const quota = useQuota();
  const auth = useAuth();
  const campaigns = useQuery({
    queryKey: ["campaigns", "dashboard"],
    queryFn: () => api.campaigns({ status: "upcoming,active", limit: 4 })
  });
  const binder = useQuery({
    queryKey: ["binder", "items"],
    queryFn: api.binderItems,
    enabled: auth.isAuthenticated
  });
  const usedPercent = ((quota.total - quota.remaining) / quota.total) * 100;

  return (
    <AppPageShell title="My IdolBooth" description="Your generations, quota, and binder shortcuts.">
      {auth.isLoading && <LoadingSkeleton rows={2} />}

      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 md:flex-row md:items-center">
        <AuthStatus />
        <span className="text-sm text-gray-600">
          {quota.remaining}/{quota.total} left today
        </span>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-black/10 p-5 md:col-span-2">
          <p className="text-sm text-gray-500">Daily quota</p>
          <h2 className="mt-2 text-2xl font-semibold">{quota.plan.toUpperCase()}</h2>
          <Progress className="mt-4" value={usedPercent} />
          <p className="mt-3 text-sm text-gray-600">Quota refreshes daily. Anonymous generation is more limited.</p>
        </div>
        {quota.plan === "free" && (
          <Link to="/pricing" className="border border-idol-gold p-5">
            <CreditCard className="h-5 w-5 text-idol-gold" />
            <h2 className="mt-3 text-2xl font-semibold">Upgrade plan</h2>
            <p className="mt-2 text-sm text-gray-600">Plus increases daily generations and reduces watermark size.</p>
          </Link>
        )}
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Today's bias card</h2>
          <Link to="/selca" className="mt-5 block border border-black/10 p-5">
            <img src="/samples/polaroid-selca.png" alt="" className="aspect-[4/5] w-full object-cover" />
            <div className="mt-4 flex items-center justify-between font-semibold">
              Make a selca <Sparkles className="h-4 w-4 text-idol-gold" />
            </div>
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Upcoming events</h2>
          <div className="mt-5 divide-y divide-black/10 border border-black/10">
            {campaigns.data?.map((campaign) => (
              <Link key={campaign.id} to={`/c/${campaign.slug}`} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{campaign.title}</p>
                  <p className="text-sm text-gray-600">{campaign.releaseDate}</p>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-black/10 pt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Recent generations</h2>
          <Link to="/me/binder" className="text-sm font-semibold text-idol-gold">
            Open Binder
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          {auth.isAuthenticated && binder.data?.items.length
            ? binder.data.items.slice(0, 6).map((item) => (
                <Link key={item.id} to="/me/binder" className="border border-black/10">
                  {item.outputUrl ? (
                    <img src={item.outputUrl} alt="" className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center bg-gray-100">
                      <Image className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </Link>
              ))
            : ["/samples/holo-frame-photocard.png", "/samples/cafe-window-selca.png", "/samples/life4cuts-classic-strip.png"].map((sample) => (
                <Link key={sample} to="/selca" className="border border-black/10">
                  <img src={sample} alt="" className="aspect-[4/5] w-full object-cover" />
                </Link>
              ))}
        </div>
      </section>
    </AppPageShell>
  );
}
