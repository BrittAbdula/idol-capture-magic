import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { AppPageShell } from "@/components/app/AppPageShell";
import { GenerationFlow } from "@/components/generate/GenerationFlow";

interface SelcaPageProps {
  title?: string;
  description?: string;
  image?: string;
  showSearchIntentLinks?: boolean;
  preferredConceptSlug?: string | null;
  landingProofItems?: string[];
}

export default function SelcaPage({
  title = "AI Selca Maker",
  description = "Pick a concept, upload a photo, and create a watermarked fan-safe selca.",
  image = "/samples/polaroid-selca.png",
  showSearchIntentLinks = false,
  preferredConceptSlug = null,
  landingProofItems = []
}: SelcaPageProps) {
  const [searchParams] = useSearchParams();

  return (
    <AppPageShell title={title} description={description} image={image}>
      <GenerationFlow
        format="selca"
        memberId={searchParams.get("memberId")}
        conceptId={searchParams.get("conceptId")}
        preferredConceptSlug={preferredConceptSlug}
        landingProofItems={landingProofItems}
      />
      {showSearchIntentLinks && <PhotoWithIdolSearchIntent />}
    </AppPageShell>
  );
}

function PhotoWithIdolSearchIntent() {
  return (
    <section className="mt-12 border-t border-black/10 pt-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-idol-gold">
            Related creators
          </p>
          <h2 className="mt-3 text-2xl font-semibold">More K-pop photobooth formats</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/strip",
              title: "K-pop photobooth online free",
              description: "Make a 4-cut photo strip in the browser."
            },
            {
              href: "/templates",
              title: "Photobooth web K-pop free",
              description: "Start from a K-pop photo template."
            },
            {
              href: "/photocard",
              title: "AI photocard maker",
              description: "Create a vertical collectible fan card."
            }
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="group border border-black/10 p-4 transition hover:border-idol-gold/60"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{item.title}</h3>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
              </div>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
