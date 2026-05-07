import { AppPageShell } from "@/components/app/AppPageShell";
import { AuthStatus } from "@/components/app/AuthStatus";
import { useQuota } from "@/hooks/useQuota";

export default function Dashboard() {
  const quota = useQuota();

  return (
    <AppPageShell title="My IdolBooth" description="Your generations, quota, and binder shortcuts.">
      <div className="flex items-center justify-between border-b border-black/10 pb-6">
        <AuthStatus />
        <span className="text-sm text-gray-600">
          {quota.remaining}/{quota.total} left today
        </span>
      </div>
    </AppPageShell>
  );
}
