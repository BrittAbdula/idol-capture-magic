import { useSearchParams } from "react-router-dom";
import { CreditCard } from "lucide-react";

import { AppPageShell } from "@/components/app/AppPageShell";
import { GenerationFlow } from "@/components/generate/GenerationFlow";
import { Input } from "@/components/ui/input";

export default function PhotocardPage() {
  const [searchParams] = useSearchParams();

  return (
    <AppPageShell
      title="AI Photocard Maker"
      description="Generate a collectible card-style image with visible AI watermarking."
      image="/samples/holo-frame-photocard.png"
    >
      <GenerationFlow
        format="photocard"
        memberId={searchParams.get("memberId")}
        conceptId={searchParams.get("conceptId")}
      />
      <section className="mt-12 border-t border-black/10 pt-10">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-idol-gold" />
          <h2 className="text-2xl font-semibold">Card-back editor</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-600">Back caption</span>
            <Input className="mt-2" placeholder="Write a short collector caption" maxLength={80} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-600">Serial note</span>
            <Input className="mt-2" placeholder="IB-2026-001" maxLength={24} />
          </label>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Double-side download is prepared here and uses the generated front image in V2.0.
        </p>
      </section>
    </AppPageShell>
  );
}
