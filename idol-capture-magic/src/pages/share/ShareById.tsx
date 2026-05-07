import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, Image } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { Button } from "@/components/ui/button";

export default function ShareById() {
  const { id = "" } = useParams();
  const share = useQuery({
    queryKey: ["share", id],
    queryFn: () => api.publicShare(id),
    enabled: Boolean(id),
    retry: false
  });
  const generation = share.data?.generation;

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Share link copied.");
  }

  return (
    <AppPageShell
      title="Shared IdolBooth Creation"
      description="A public, watermarked IdolBooth AI-generated image."
      image={generation?.outputUrl ?? "/samples/polaroid-selca.png"}
    >
      {share.isError && (
        <div className="border border-black/10 p-8 text-center">
          <h2 className="text-2xl font-semibold">Shared image not found</h2>
          <p className="mt-2 text-sm text-gray-600">It may be private or no longer available.</p>
          <Link to="/selca" className="idol-button-square mt-5 inline-flex">
            Make yours
          </Link>
        </div>
      )}

      {generation && (
        <div className="grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="border border-black/10 bg-gray-50 p-4">
            {generation.outputUrl ? (
              <img src={generation.outputUrl} alt="Shared IdolBooth generation" className="max-h-[75vh] w-full object-contain" />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center">
                <Image className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <aside className="border border-black/10 p-5">
            <p className="text-sm uppercase tracking-wide text-idol-gold">{generation.format}</p>
            <h2 className="mt-2 text-2xl font-semibold">Watermarked AI output</h2>
            <p className="mt-3 text-sm text-gray-600">Watermark level: {generation.watermarkLevel}</p>
            <Button className="mt-5 w-full" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
            <Button className="mt-3 w-full" variant="outline" asChild>
              <Link to="/selca">Make yours</Link>
            </Button>
          </aside>
        </div>
      )}
    </AppPageShell>
  );
}
