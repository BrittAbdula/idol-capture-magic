import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Image } from "lucide-react";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";
import { ImageFrame } from "@/components/media/ImageFrame";

export default function PublicBinder() {
  const { handle = "" } = useParams();
  const binder = useQuery({
    queryKey: ["binder", "public", handle],
    queryFn: () => api.publicBinder(handle),
    enabled: Boolean(handle),
    retry: false
  });

  return (
    <AppPageShell
      title={`${binder.data?.handle ?? handle ?? "Fan"}'s Binder`}
      description="A public IdolBooth binder."
      image="/illustrations/empty-binder.png"
    >
      {binder.isLoading && <LoadingSkeleton rows={4} />}

      {binder.isError && (
        <div className="border border-black/10 p-8 text-center">
          <h2 className="text-2xl font-semibold">Binder not found</h2>
          <p className="mt-2 text-sm text-gray-600">This public handle is not available yet.</p>
          <Link to="/selca" className="idol-button-square mt-5 inline-flex">
            Make your first card
          </Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {binder.data?.items.map((item) => (
          <Link key={item.id} to={`/share/${item.generationId}`} className="border border-black/10">
            {item.outputUrl ? (
              <ImageFrame
                src={item.outputUrl}
                alt=""
                ratio="portrait"
                interactive
                className="rounded-none border-0 shadow-none"
              />
            ) : (
              <div className="flex aspect-[2/3] items-center justify-center bg-gray-100">
                <Image className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <p className="truncate p-3 text-sm font-semibold">{item.customCaption ?? "IdolBooth card"}</p>
          </Link>
        ))}
      </div>
    </AppPageShell>
  );
}
