import { useSearchParams } from "react-router-dom";

import { AppPageShell } from "@/components/app/AppPageShell";
import { GenerationFlow } from "@/components/generate/GenerationFlow";

export default function SelcaPage() {
  const [searchParams] = useSearchParams();

  return (
    <AppPageShell
      title="AI Selca Maker"
      description="Pick a concept, upload a photo, and create a watermarked fan-safe selca."
      image="/samples/polaroid-selca.png"
    >
      <GenerationFlow
        format="selca"
        memberId={searchParams.get("memberId")}
        conceptId={searchParams.get("conceptId")}
      />
    </AppPageShell>
  );
}
