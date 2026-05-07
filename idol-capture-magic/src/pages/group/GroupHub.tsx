import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays } from "lucide-react";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";

const recentSamples = [
  "/samples/polaroid-selca.png",
  "/samples/holo-frame-photocard.png",
  "/samples/cherry-blossom-selca.png",
  "/samples/pastel-frame-strip.png"
];

function debutYear(date: string | null | undefined): string {
  return date ? new Date(date).getFullYear().toString() : "TBA";
}

export default function GroupHub() {
  const { groupSlug = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["group", groupSlug],
    queryFn: () => api.group(groupSlug),
    enabled: Boolean(groupSlug)
  });
  const group = data?.group;
  const activeCampaign = data?.campaigns.find((campaign) => campaign.status === "active");

  return (
    <AppPageShell
      title={group ? group.name : "Group Hub"}
      description={
        group
          ? `${group.agency ?? "K-pop"} group hub. Pick a member, then choose a selca, photocard, or 4-cut strip concept.`
          : "Pick a member, then choose a selca, photocard, or 4-cut strip concept."
      }
      image={group?.coverImage ?? "/placeholders/group_newjeans.png"}
    >
      {isLoading && <div className="h-40 animate-pulse bg-gray-100" />}

      {group && (
        <div className="mb-8 grid gap-4 border-b border-black/10 pb-8 md:grid-cols-3">
          <div className="border border-black/10 p-5">
            <p className="text-sm text-gray-500">Agency</p>
            <p className="mt-1 text-2xl font-semibold">{group.agency ?? "Independent"}</p>
          </div>
          <div className="border border-black/10 p-5">
            <p className="text-sm text-gray-500">Debut year</p>
            <p className="mt-1 text-2xl font-semibold">{debutYear(group.debutDate)}</p>
          </div>
          <div className="border border-black/10 p-5" style={{ borderColor: group.themeColor }}>
            <p className="text-sm text-gray-500">Theme color</p>
            <p className="mt-1 text-2xl font-semibold">{group.themeColor}</p>
          </div>
        </div>
      )}

      {activeCampaign && (
        <Link
          to={`/c/${activeCampaign.slug}`}
          className="mb-8 flex flex-col justify-between gap-4 border border-idol-gold p-5 md:flex-row md:items-center"
        >
          <div>
            <p className="text-sm uppercase tracking-wide text-idol-gold">Active campaign</p>
            <h2 className="mt-1 text-2xl font-semibold">{activeCampaign.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{activeCampaign.description}</p>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>
      )}

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">Members</h2>
          <Link to="/selca" className="text-sm font-semibold text-idol-gold">
            Start with default bias
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {data?.members.map((member) => (
            <Link
              key={member.id}
              to={`/g/${groupSlug}/${member.slug}`}
              className="group aspect-[3/4] overflow-hidden border border-black/10 bg-white"
            >
              <img
                src={member.silhouetteImage}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="-mt-12 bg-white/90 px-3 py-2 text-sm font-semibold backdrop-blur">
                {member.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-black/10 pt-10">
        <h2 className="text-2xl font-semibold">Recent generations</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {recentSamples.map((sample) => (
            <Link key={sample} to="/selca" className="group border border-black/10">
              <img src={sample} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="flex items-center justify-between p-3 text-sm font-semibold">
                Make yours <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-black/10 pt-10">
        <h2 className="text-2xl font-semibold">Group dates</h2>
        <div className="mt-5 flex items-center gap-3 border border-black/10 p-5">
          <CalendarDays className="h-5 w-5 text-idol-gold" />
          <p className="text-sm text-gray-600">
            Debut anniversary: {group?.debutDate ?? "TBA"}
          </p>
        </div>
      </section>
    </AppPageShell>
  );
}
