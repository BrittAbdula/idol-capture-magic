import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { AppPageShell } from "@/components/app/AppPageShell";
import { useQuota } from "@/hooks/useQuota";
import { useGenerationFlowStore } from "@/stores/generationFlow";

export function GenerationPlaceholder({
  format,
  title
}: {
  format: "selca" | "photocard";
  title: string;
}) {
  const [searchParams] = useSearchParams();
  const quota = useQuota();
  const { setFormat, setMemberId } = useGenerationFlowStore();

  useEffect(() => {
    setFormat(format);
    setMemberId(searchParams.get("memberId"));
  }, [format, searchParams, setFormat, setMemberId]);

  return (
    <AppPageShell
      title={title}
      description={`Choose a concept, upload a photo, and generate a watermarked ${format}.`}
      image={format === "selca" ? "/samples/polaroid-selca.png" : "/samples/holo-frame-photocard.png"}
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm uppercase tracking-wide text-gray-500">Generation flow</p>
          <h2 className="mt-2 text-2xl font-semibold">Ready for the 3-step wizard</h2>
          <p className="mt-3 text-gray-600">
            The shared generation store is active. The full concept, upload, and result screens are
            implemented in the next checkpoint.
          </p>
        </div>
        <div className="border border-black/10 p-5">
          <p className="text-sm text-gray-500">Plan</p>
          <p className="mt-1 text-2xl font-semibold">{quota.plan}</p>
          <p className="mt-3 text-sm text-gray-600">
            {quota.remaining}/{quota.total} generations available today.
          </p>
        </div>
      </div>
    </AppPageShell>
  );
}
