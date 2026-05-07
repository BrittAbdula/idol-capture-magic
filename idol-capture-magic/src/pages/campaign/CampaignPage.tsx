import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays } from "lucide-react";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";

function parsePalette(value: string | undefined): string[] {
  if (!value) {
    return ["#FFD700", "#FFFFFF"];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : ["#FFD700"];
  } catch {
    return ["#FFD700"];
  }
}

function campaignCountdown(releaseDate: string | undefined, status: string | undefined): string {
  if (status === "active") {
    return "Now active";
  }
  if (!releaseDate) {
    return "Release date TBA";
  }
  const days = Math.ceil((new Date(releaseDate).getTime() - Date.now()) / 86_400_000);
  return days > 0 ? `${days} days to release` : "Released";
}

export default function CampaignPage() {
  const { slug = "" } = useParams();
  const [memberId, setMemberId] = useState<string>("");
  const campaign = useQuery({
    queryKey: ["campaign", slug],
    queryFn: () => api.campaign(slug),
    enabled: Boolean(slug)
  });
  const groups = useQuery({ queryKey: ["groups"], queryFn: api.groups });
  const groupSlug = groups.data?.find((group) => group.id === campaign.data?.campaign.groupId)?.slug;
  const group = useQuery({
    queryKey: ["group", groupSlug],
    queryFn: () => api.group(groupSlug ?? ""),
    enabled: Boolean(groupSlug)
  });
  const campaignConcepts = useQuery({
    queryKey: ["concepts", "campaign", campaign.data?.campaign.id],
    queryFn: () => api.concepts({ campaignId: campaign.data?.campaign.id }),
    enabled: Boolean(campaign.data?.campaign.id)
  });
  const fallbackConcepts = useQuery({
    queryKey: ["concepts", "campaign-fallback"],
    queryFn: () => api.concepts()
  });
  const palette = parsePalette(campaign.data?.campaign.conceptPalette);
  const concepts = useMemo(
    () => (campaignConcepts.data?.length ? campaignConcepts.data : fallbackConcepts.data ?? []).slice(0, 8),
    [campaignConcepts.data, fallbackConcepts.data]
  );
  const selectedMemberId = memberId || group.data?.members[0]?.id || "";

  return (
    <AppPageShell
      title={
        campaign.data?.campaign && group.data?.group
          ? `${group.data.group.name} ${campaign.data.campaign.title} Concept Photo Maker`
          : "Campaign"
      }
      description={campaign.data?.campaign.description ?? "Explore comeback-inspired fan concepts."}
      image={campaign.data?.campaign.heroImage ?? group.data?.group.coverImage ?? "/placeholders/group_newjeans.png"}
    >
      <div
        className="mb-8 border border-black/10 p-5"
        style={{
          background: `linear-gradient(135deg, ${palette[0] ?? "#FFD700"}22, ${palette[1] ?? "#FFFFFF"}44)`
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CalendarDays className="h-4 w-4 text-idol-gold" />
          {campaignCountdown(campaign.data?.campaign.releaseDate, campaign.data?.campaign.status)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {palette.map((color) => (
            <span key={color} className="h-8 w-8 border border-black/10" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold">Choose member</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {group.data?.members.map((member) => (
            <button
              key={member.id}
              onClick={() => setMemberId(member.id)}
              className={`shrink-0 border px-4 py-2 text-sm ${
                selectedMemberId === member.id ? "border-idol-gold text-idol-gold" : "border-black/10"
              }`}
            >
              {member.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Concept cards</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {concepts.map((concept) => (
            <Link
              key={concept.id}
              to={`/${concept.format === "fancall" ? "photocard" : concept.format}?memberId=${selectedMemberId}&conceptId=${concept.id}`}
              className="group border border-black/10"
            >
              <img src={concept.sampleOutputUrl} alt="" className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between gap-3 p-3">
                <div>
                  <h3 className="font-semibold">{concept.name}</h3>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{concept.category}</p>
                </div>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-black/10 pt-10">
        <h2 className="text-2xl font-semibold">Members</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {group.data?.members.map((member) => (
            <Link key={member.id} to={`/g/${groupSlug}/${member.slug}`} className="border border-black/10 p-3">
              <img src={member.silhouetteImage} alt="" className="aspect-square w-full object-cover" />
              <p className="mt-3 font-semibold">{member.name}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 max-w-3xl leading-7 text-gray-600">
          {campaign.data?.campaign.description} IdolBooth keeps campaign concepts stylized and fan-safe with placeholder member assets, anonymized companion prompts, and visible AI watermarks.
        </p>
      </section>
    </AppPageShell>
  );
}
