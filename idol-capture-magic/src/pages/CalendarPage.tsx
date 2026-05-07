import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Star } from "lucide-react";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";

export default function CalendarPage() {
  const campaigns = useQuery({
    queryKey: ["campaigns", "calendar"],
    queryFn: () => api.campaigns({ status: "upcoming,active,archived", limit: 20 })
  });
  const groups = useQuery({ queryKey: ["groups"], queryFn: api.groups });
  const sortedCampaigns = [...(campaigns.data ?? [])].sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );

  return (
    <AppPageShell
      title="K-pop Calendar"
      description="Upcoming campaigns and member moments for IdolBooth concepts."
      image="/samples/cherry-blossom-selca.png"
    >
      <section>
        <h2 className="text-2xl font-semibold">Upcoming events</h2>
        <div className="mt-5 divide-y divide-black/10 border border-black/10">
          {sortedCampaigns.map((campaign) => (
            <Link key={campaign.id} to={`/c/${campaign.slug}`} className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <CalendarDays className="h-5 w-5 text-idol-gold" />
                <div>
                  <h3 className="font-semibold">{campaign.title}</h3>
                  <p className="text-sm text-gray-600">{campaign.releaseDate}</p>
                </div>
              </div>
              <span className="text-sm uppercase tracking-wide text-gray-500">{campaign.status}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-black/10 pt-10">
        <h2 className="text-2xl font-semibold">Group anniversaries</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {groups.data?.slice(0, 12).map((group) => (
            <Link key={group.id} to={`/g/${group.slug}`} className="flex items-center gap-3 border border-black/10 p-4">
              <Star className="h-4 w-4 text-idol-gold" />
              <div>
                <p className="font-semibold">{group.name}</p>
                <p className="text-sm text-gray-600">{group.debutDate ?? "Debut date TBA"}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppPageShell>
  );
}
