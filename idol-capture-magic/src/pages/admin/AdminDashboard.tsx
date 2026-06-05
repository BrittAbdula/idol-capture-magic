import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock3,
  CreditCard,
  Image as ImageIcon,
  ShieldCheck,
  Users
} from "lucide-react";
import { toast } from "sonner";

import {
  api,
  getGoogleAuthUrl,
  isApiError,
  type ApiAdminActiveUser,
  type ApiAdminUserAsset
} from "@/api/client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/admin";
import { cn } from "@/lib/utils";

function formatDate(seconds?: number | null): string {
  if (!seconds) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(seconds * 1000));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function statusClassName(status: ApiAdminUserAsset["status"]): string {
  if (status === "succeeded") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "failed") {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  action
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Users;
  action?: ReactNode;
}) {
  return (
    <div className="border border-black/10 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <Icon className="h-4 w-4 text-idol-gold" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
      <p className="mt-2 text-sm text-gray-600">{detail}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function ImageSlot({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden border border-black/10 bg-gray-50"
        >
          <img src={url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
        </a>
      ) : (
        <div className="flex aspect-square items-center justify-center border border-black/10 bg-gray-50">
          <ImageIcon className="h-6 w-6 text-gray-300" />
        </div>
      )}
    </div>
  );
}

function UploadedImages({ urls }: { urls: string[] }) {
  const visibleUrls = urls.length ? urls : [null];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Uploaded</p>
      <div className="grid grid-cols-2 gap-2">
        {visibleUrls.map((url, index) => (
          <ImageSlot
            key={url ?? `missing-${index}`}
            label={urls.length > 1 ? `Photo ${index + 1}` : "Photo"}
            url={url}
          />
        ))}
      </div>
    </div>
  );
}

function ActiveUserRow({
  user,
  selected,
  onSelect
}: {
  user: ApiAdminActiveUser;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      className="cursor-pointer"
      onClick={onSelect}
    >
      <TableCell>
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.handle}</p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="uppercase">
          {user.plan}
        </Badge>
      </TableCell>
      <TableCell className="text-right">{formatNumber(user.generationCount)}</TableCell>
      <TableCell className="text-right text-emerald-700">{user.succeededCount}</TableCell>
      <TableCell className="text-right text-rose-700">{user.failedCount}</TableCell>
      <TableCell className="whitespace-nowrap text-right text-gray-600">
        {formatDate(user.lastActiveAt)}
      </TableCell>
    </TableRow>
  );
}

export default function AdminDashboard() {
  const auth = useAuth();
  const canAdmin = isAdminEmail(auth.user?.email);
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const overview = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: api.adminOverview,
    enabled: canAdmin
  });
  const activeUsers = useMemo(() => overview.data?.activeUsers ?? [], [overview.data?.activeUsers]);
  const selectedUser = activeUsers.find((user) => user.id === selectedUserId) ?? null;
  const assets = useQuery({
    queryKey: ["admin", "user-assets", selectedUserId],
    queryFn: () => api.adminUserAssets(selectedUserId as string),
    enabled: canAdmin && Boolean(selectedUserId)
  });
  const cleanupStaleJobs = useMutation({
    mutationFn: api.adminCleanupStaleGenerations,
    onSuccess: (result) => {
      toast.success(
        `Cleaned ${formatNumber(result.staleGenerations)} stale job${
          result.staleGenerations === 1 ? "" : "s"
        }. Refunded ${formatNumber(result.refundedCredits)} credit${
          result.refundedCredits === 1 ? "" : "s"
        }.`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
      if (selectedUserId) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "user-assets", selectedUserId] });
      }
    },
    onError: () => {
      toast.error("Unable to clean stale jobs.");
    }
  });

  useEffect(() => {
    if (!selectedUserId && activeUsers.length) {
      setSelectedUserId(activeUsers[0].id);
    }
  }, [activeUsers, selectedUserId]);

  const stats = overview.data?.stats;
  const adminError =
    overview.error && isApiError(overview.error)
      ? overview.error.code
      : "Unable to load admin data";

  return (
    <div className="min-h-screen bg-white text-gray-950">
      <SEO
        title="Admin | IdolBooth"
        description="Private IdolBooth admin dashboard for user and generation activity."
      />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 md:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-idol-gold">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal">IdolBooth operations</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Registration, generation reliability, billing funnel, and recent user image activity.
            </p>
          </div>
          {auth.user && <p className="text-sm text-gray-500">{auth.user.email}</p>}
        </div>

        {auth.isLoading && (
          <div className="mt-8">
            <LoadingSkeleton rows={3} />
          </div>
        )}

        {!auth.isLoading && !auth.isAuthenticated && (
          <section className="mt-8 border border-idol-gold p-5">
            <h2 className="text-2xl font-semibold">Sign in required</h2>
            <p className="mt-2 text-sm text-gray-600">
              The admin dashboard requires the configured administrator Google account.
            </p>
            <a
              href={getGoogleAuthUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="idol-button-square mt-4 inline-flex"
            >
              Sign in with Google
            </a>
          </section>
        )}

        {!auth.isLoading && auth.isAuthenticated && !canAdmin && (
          <section className="mt-8 border border-black/10 p-5">
            <h2 className="text-2xl font-semibold">Admin access required</h2>
            <p className="mt-2 text-sm text-gray-600">
              This workspace is only available to auroroa@gmail.com.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/me">Back to my page</Link>
            </Button>
          </section>
        )}

        {canAdmin && overview.isLoading && (
          <div className="mt-8">
            <LoadingSkeleton rows={5} />
          </div>
        )}

        {canAdmin && overview.error && (
          <section className="mt-8 border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <h2 className="text-xl font-semibold">Admin data failed to load</h2>
            <p className="mt-2 text-sm">{adminError}</p>
          </section>
        )}

        {canAdmin && stats && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="New users"
                value={formatNumber(stats.registeredLast24h)}
                detail={`${formatNumber(stats.registeredLast7d)} in the last 7 days`}
                icon={Users}
              />
              <Metric
                label="Generations"
                value={formatNumber(stats.generationsLast24h)}
                detail={`${formatNumber(stats.generationsLast7d)} in the last 7 days`}
                icon={BarChart3}
              />
              <Metric
                label="Succeeded / failed"
                value={`${formatNumber(stats.succeededLast7d)} / ${formatNumber(stats.failedLast7d)}`}
                detail="Generation outcomes in the last 7 days"
                icon={Activity}
              />
              <Metric
                label="Estimated cost"
                value={formatCurrency(stats.costUsdLast7d)}
                detail={`${formatNumber(stats.publicGenerationsLast7d)} public generations this week`}
                icon={Clock3}
              />
            </section>

            <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Paid users"
                value={formatNumber(stats.paidUsersTotal)}
                detail={`${formatNumber(stats.registeredTotal)} registered users total`}
                icon={CreditCard}
              />
              <Metric
                label="Stale jobs"
                value={formatNumber(stats.stalePendingGenerationsTotal)}
                detail={`${formatNumber(stats.runningGenerationsTotal)} running generations total`}
                icon={AlertTriangle}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cleanupStaleJobs.mutate()}
                    disabled={
                      cleanupStaleJobs.isPending || stats.stalePendingGenerationsTotal === 0
                    }
                  >
                    {cleanupStaleJobs.isPending ? "Cleaning..." : "Clean stale jobs"}
                  </Button>
                }
              />
              <Metric
                label="Checkout opened / failed"
                value={`${formatNumber(stats.checkoutCreatedLast7d + stats.checkoutRecoveredLast7d)} / ${formatNumber(stats.checkoutFailedLast7d)}`}
                detail={`${formatNumber(stats.checkoutUpgradeDialogLast7d)} upgrade dialog, ${formatNumber(stats.checkoutPricingPageLast7d)} pricing page, ${formatNumber(stats.checkoutResumedAfterSignInLast7d)} resumed`}
                icon={CreditCard}
              />
              <Metric
                label="Checkout intent"
                value={`${formatNumber(stats.checkoutWatermarkLast7d)} / ${formatNumber(stats.checkoutHdDownloadLast7d)} / ${formatNumber(stats.checkoutQuotaLast7d)}`}
                detail="Watermark / HD download / quota checkout starts"
                icon={BarChart3}
              />
              <Metric
                label="Subscription webhooks"
                value={formatNumber(stats.subscriptionUpdatedLast7d)}
                detail={`${formatNumber(stats.subscriptionDeletedLast7d)} deleted, ${formatNumber(stats.billingWebhookIgnoredLast7d)} ignored`}
                icon={Activity}
              />
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
              <div className="min-w-0 border border-black/10">
                <div className="flex items-center justify-between gap-3 border-b border-black/10 p-4">
                  <div>
                    <h2 className="text-xl font-semibold">Recent active users</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Ordered by latest generation activity.
                    </p>
                  </div>
                  <Badge variant="secondary">{formatNumber(stats.registeredTotal)} users</Badge>
                </div>
                {activeUsers.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Uses</TableHead>
                        <TableHead className="text-right">OK</TableHead>
                        <TableHead className="text-right">Fail</TableHead>
                        <TableHead className="text-right">Last active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeUsers.map((user) => (
                        <ActiveUserRow
                          key={user.id}
                          user={user}
                          selected={user.id === selectedUserId}
                          onSelect={() => setSelectedUserId(user.id)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-sm text-gray-600">No generation activity yet.</div>
                )}
              </div>

              <aside className="min-w-0 border border-black/10">
                <div className="border-b border-black/10 p-4">
                  <h2 className="text-xl font-semibold">Recent images</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Uploaded source images and generated outputs for the selected user.
                  </p>
                  {selectedUser && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{selectedUser.handle}</Badge>
                      <span className="text-xs text-gray-500">{selectedUser.email}</span>
                    </div>
                  )}
                </div>

                {assets.isLoading && (
                  <div className="p-4">
                    <LoadingSkeleton rows={4} />
                  </div>
                )}

                {!selectedUserId && (
                  <div className="p-6 text-sm text-gray-600">Select an active user.</div>
                )}

                {assets.error && (
                  <div className="p-4 text-sm text-rose-700">Unable to load user images.</div>
                )}

                {assets.data?.items.length ? (
                  <div className="divide-y divide-black/10">
                    {assets.data.items.map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-semibold uppercase",
                              statusClassName(item.status)
                            )}
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
                        <div className="mt-3">
                          <p className="font-semibold">{item.conceptName}</p>
                          <p className="text-sm text-gray-600">{item.memberName}</p>
                          <p className="mt-1 text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(120px,0.5fr)]">
                          <UploadedImages
                            urls={item.inputUrls ?? (item.inputUrl ? [item.inputUrl] : [])}
                          />
                          <ImageSlot label="Generated" url={item.outputUrl} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : assets.data ? (
                  <div className="p-6 text-sm text-gray-600">
                    This user has no recent generation records.
                  </div>
                ) : null}
              </aside>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
