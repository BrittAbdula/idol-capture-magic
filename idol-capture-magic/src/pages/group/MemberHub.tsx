import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Lock, Sparkles } from "lucide-react";

import { api, type ApiConcept, type ApiMember } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";
import { LoadingSkeleton } from "@/components/app/LoadingSkeleton";

const FILTERS = ["All", "Comeback", "Daily", "Birthday", "Concert", "Polaroid"];

function birthdayCountdown(member: ApiMember | undefined): string {
  if (!member?.birthday) {
    return "Birthday date TBA";
  }
  const [month, day] = member.birthday.split("-").map(Number);
  const today = new Date();
  const next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) {
    next.setFullYear(today.getFullYear() + 1);
  }
  const days = Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
  return `${member.birthday} (${days} days)`;
}

function factsText(member: ApiMember | undefined, groupName: string | undefined): string {
  let role = member?.position ?? "performer";
  if (member?.facts) {
    try {
      const parsed = JSON.parse(member.facts) as { groupRole?: string; position?: string };
      role = parsed.groupRole || parsed.position || role;
    } catch {
      role = member.position ?? role;
    }
  }

  return `${member?.name ?? "This member"} is listed as ${role} in ${groupName ?? "the group"} seed data. IdolBooth uses licensed-placeholder silhouettes instead of real member photos, and every generated output is watermarked as AI-generated. Choose a concept preset, upload your own image, and create a stylized fan-safe selca, photocard, or strip that keeps the companion figure anonymized rather than impersonating a real person.`;
}

export default function MemberHub() {
  const { groupSlug = "", memberSlug = "" } = useParams();
  const [filter, setFilter] = useState("All");
  const { data, isLoading } = useQuery({
    queryKey: ["member", groupSlug, memberSlug],
    queryFn: () => api.member(groupSlug, memberSlug),
    enabled: Boolean(groupSlug && memberSlug)
  });
  const concepts = useQuery({
    queryKey: ["concepts", "member", data?.member.id],
    queryFn: () => api.concepts({ memberId: data?.member.id }),
    enabled: Boolean(data?.member.id)
  });

  const member = data?.member;
  const group = data?.group;
  const filteredConcepts = useMemo(() => {
    const visible = (concepts.data ?? []).filter((concept) => concept.format !== "fancall");
    if (filter === "All") {
      return visible.slice(0, 16);
    }
    return visible
      .filter((concept) => concept.category?.toLowerCase() === filter.toLowerCase())
      .slice(0, 16);
  }, [concepts.data, filter]);

  return (
    <AppPageShell
      title={member && group ? `Take an AI Selca with ${member.name} (${group.name}) - Free` : "Member Hub"}
      description="Choose a format, upload your photo, and generate a watermarked fan-safe image."
      image={member?.silhouetteImage ?? "/placeholders/silhouette_1.png"}
    >
      {isLoading && <LoadingSkeleton rows={3} />}

      <div
        className="mb-8 grid gap-4 border border-black/10 p-5 md:grid-cols-3"
        style={{ background: group ? `${group.themeColor}22` : undefined }}
      >
        <div>
          <p className="text-sm text-gray-500">Position</p>
          <p className="mt-1 font-semibold">{member?.position ?? "Vocalist"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Birthday</p>
          <p className="mt-1 font-semibold">{birthdayCountdown(member)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Debut anniversary</p>
          <p className="mt-1 font-semibold">{group?.debutDate ?? "TBA"}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Link className="idol-button-square flex items-center justify-center gap-2 text-center" to={`/selca?memberId=${member?.id ?? ""}`}>
          <Sparkles className="h-4 w-4" />
          Selca
        </Link>
        <Link className="idol-button-square flex items-center justify-center gap-2 text-center" to={`/photocard?memberId=${member?.id ?? ""}`}>
          <Sparkles className="h-4 w-4" />
          Photocard
        </Link>
        <Link className="idol-button-square flex items-center justify-center gap-2 text-center" to={`/strip?memberId=${member?.id ?? ""}`}>
          <Sparkles className="h-4 w-4" />
          Strip
        </Link>
        <button
          className="flex cursor-not-allowed items-center justify-center gap-2 border border-black/10 px-4 py-3 text-gray-400"
          title="Coming soon"
        >
          <Lock className="h-4 w-4" />
          Fancall Plus
        </button>
      </div>

      <section className="mt-12" id="concepts">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-semibold">Concept gallery</h2>
            <p className="mt-2 text-sm text-gray-600">Fan-safe presets use stylized companion prompts and watermarking.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`shrink-0 border px-3 py-2 text-sm ${
                  filter === item ? "border-idol-gold text-idol-gold" : "border-black/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {concepts.isLoading && <LoadingSkeleton rows={4} />}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredConcepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} memberId={member?.id} />
          ))}
        </div>
      </section>

      <section className="mt-12 border-t border-black/10 pt-10">
        <h2 className="text-2xl font-semibold">About this AI photo maker</h2>
        <p className="mt-4 max-w-3xl leading-7 text-gray-600">{factsText(member, group?.name)}</p>
      </section>

      <section className="mt-12 border-t border-black/10 pt-10">
        <h2 className="text-2xl font-semibold">Recent generations</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {filteredConcepts.slice(0, 4).map((concept) => (
            <Link key={concept.id} to={`/selca?memberId=${member?.id ?? ""}&conceptId=${concept.id}`} className="border border-black/10">
              <img src={concept.sampleOutputUrl} alt="" className="aspect-[4/5] w-full object-cover" />
              <div className="flex items-center justify-between p-3 text-sm font-semibold">
                Make yours <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white p-3 md:hidden">
        <Link className="idol-button-square flex items-center justify-center gap-2 text-center" to={`/selca?memberId=${member?.id ?? ""}`}>
          Upload your photo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AppPageShell>
  );
}

function ConceptCard({ concept, memberId }: { concept: ApiConcept; memberId: string | undefined }) {
  const href = `/${concept.format}?memberId=${memberId ?? ""}&conceptId=${concept.id}`;
  return (
    <Link to={href} className="group border border-black/10">
      <img src={concept.sampleOutputUrl} alt="" className="aspect-square w-full object-cover" />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">{concept.name}</h3>
          {concept.premium && <span className="text-xs text-idol-gold">Plus</span>}
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{concept.category}</p>
      </div>
    </Link>
  );
}
