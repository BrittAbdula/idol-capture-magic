import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CreditCard, Image, Sparkles } from "lucide-react";

import { api, getGoogleAuthUrl, type ApiGenerationHistoryItem } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { ImageFrame } from "@/components/media/ImageFrame";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useQuota } from "@/hooks/useQuota";
import type { ImageFrameRatio } from "@/lib/imageRatios";

function formatGenerationDate(createdAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(createdAt * 1000));
}

function historyImageRatio(format: string): ImageFrameRatio {
  if (format === "photocard" || format === "strip") {
    return "portrait";
  }

  return "square";
}

function statusClassName(status: ApiGenerationHistoryItem["status"]): string {
  if (status === "succeeded") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "failed") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
}

export default function Dashboard() {
  const quota = useQuota();
  const auth = useAuth();
  const history = useQuery({
    queryKey: ["generations", "history"],
    queryFn: api.generationHistory,
    enabled: auth.isAuthenticated
  });
  const historyItems = history.data?.items ?? [];
  const totalCreditsUsed = historyItems.reduce((sum, item) => sum + item.creditsUsed, 0);
  const completedCount = historyItems.filter((item) => item.status === "succeeded").length;
  const usedPercent = ((quota.total - quota.remaining) / quota.total) * 100;

  return (
    <AppPageShell title="My IdolBooth" description="Your account, credits, and generation history.">
      {auth.isLoading && <LoadingSkeleton rows={2} />}

      {!auth.isLoading && !auth.isAuthenticated && (
        <div className="border border-idol-gold p-5">
          <h2 className="text-2xl font-semibold">Sign in to view your page</h2>
          <p className="mt-2 text-sm text-gray-600">
            Generation history and credit details are attached to your IdolBooth session.
          </p>
          <a
            href={getGoogleAuthUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="idol-button-square mt-4 inline-flex"
          >
            Sign in with Google
          </a>
        </div>
      )}

      {auth.isAuthenticated && (
        <>
          <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-wide text-idol-gold">{auth.user?.plan}</p>
              <h2 className="mt-2 text-3xl font-semibold">{auth.user?.handle}</h2>
              <p className="mt-1 text-sm text-gray-600">{auth.user?.email}</p>
            </div>
            <span className="text-sm text-gray-600">
              {quota.remaining}/{quota.total} credits left today
            </span>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-black/10 p-5">
              <p className="text-sm text-gray-500">Daily credits</p>
              <h3 className="mt-2 text-2xl font-semibold">{quota.plan.toUpperCase()}</h3>
              <Progress className="mt-4" value={usedPercent} />
              <p className="mt-3 text-sm text-gray-600">Credits refresh daily with your plan.</p>
            </div>
            <div className="border border-black/10 p-5">
              <p className="text-sm text-gray-500">History credits used</p>
              <h3 className="mt-2 text-2xl font-semibold">{totalCreditsUsed}</h3>
              <p className="mt-3 text-sm text-gray-600">
                Across {historyItems.length} saved generation records.
              </p>
            </div>
            {quota.plan === "free" ? (
              <Link to="/pricing" className="border border-idol-gold p-5">
                <CreditCard className="h-5 w-5 text-idol-gold" />
                <h3 className="mt-3 text-2xl font-semibold">Upgrade plan</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Plus increases daily credits and reduces watermark size.
                </p>
              </Link>
            ) : (
              <div className="border border-black/10 p-5">
                <Sparkles className="h-5 w-5 text-idol-gold" />
                <h3 className="mt-3 text-2xl font-semibold">{completedCount}</h3>
                <p className="mt-2 text-sm text-gray-600">Successful generations in history.</p>
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-black/10 pt-10">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-semibold">Generation history</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Every record includes the concept, output status, and credit charge.
                </p>
              </div>
              <Link to="/me/binder" className="text-sm font-semibold text-idol-gold">
                Open Binder
              </Link>
            </div>

            {history.isLoading && (
              <div className="mt-5">
                <LoadingSkeleton rows={5} />
              </div>
            )}

            {!history.isLoading && historyItems.length ? (
              <div className="mt-5 divide-y divide-black/10 border border-black/10">
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-4 p-4 md:grid-cols-[96px_minmax(0,1fr)_160px] md:items-center"
                  >
                    {item.outputUrl ? (
                      <ImageFrame
                        src={item.outputUrl}
                        alt=""
                        ratio={historyImageRatio(item.format)}
                        interactive
                        className="w-24 rounded-none border-0 shadow-none"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center bg-gray-100">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold uppercase ${statusClassName(item.status)}`}
                        >
                          {item.status}
                        </span>
                        <span className="text-xs font-semibold uppercase text-gray-500">
                          {item.format}
                        </span>
                        {item.isPublic && (
                          <span className="text-xs font-semibold uppercase text-idol-gold">
                            Public
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 truncate text-lg font-semibold">{item.conceptName}</h3>
                      <p className="mt-1 text-sm text-gray-600">{item.memberName}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatGenerationDate(item.createdAt)}
                      </p>
                      {item.errorMessage && (
                        <p className="mt-2 text-sm text-rose-700">{item.errorMessage}</p>
                      )}
                    </div>
                    <div className="border-t border-black/10 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                      <p className="text-sm text-gray-500">Credits used</p>
                      <p className="mt-1 text-2xl font-semibold">
                        {item.creditsUsed}{" "}
                        <span className="text-sm font-normal text-gray-500">
                          credit{item.creditsUsed === 1 ? "" : "s"}
                        </span>
                      </p>
                      <p className="mt-2 text-xs text-gray-500">Watermark: {item.watermarkLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!history.isLoading && !historyItems.length && (
              <Link
                to="/selca"
                className="mt-5 flex items-center justify-between border border-black/10 p-6"
              >
                <div>
                  <p className="font-semibold">No generation records yet</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Create a selca, photocard, or strip to start your history.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-idol-gold" />
              </Link>
            )}
          </section>
        </>
      )}
    </AppPageShell>
  );
}
