import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";

export default function MemberHub() {
  const { groupSlug = "", memberSlug = "" } = useParams();
  const { data } = useQuery({
    queryKey: ["member", groupSlug, memberSlug],
    queryFn: () => api.member(groupSlug, memberSlug),
    enabled: Boolean(groupSlug && memberSlug)
  });

  const member = data?.member;
  const group = data?.group;

  return (
    <AppPageShell
      title={member && group ? `Take an AI Selca with ${member.name} (${group.name})` : "Member Hub"}
      description="Choose a format, upload your photo, and generate a watermarked fan-safe image."
      image={member?.silhouetteImage ?? "/placeholders/silhouette_1.png"}
    >
      <div className="mb-8 flex flex-wrap gap-3 text-sm text-gray-600">
        <span>{member?.position ?? "Vocalist"}</span>
        <span>{member?.birthday ? `Birthday ${member.birthday}` : "Birthday soon"}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Link className="idol-button-square text-center" to={`/selca?memberId=${member?.id ?? ""}`}>
          Selca
        </Link>
        <Link className="idol-button-square text-center" to={`/photocard?memberId=${member?.id ?? ""}`}>
          Photocard
        </Link>
        <Link className="idol-button-square text-center" to={`/strip?memberId=${member?.id ?? ""}`}>
          Strip
        </Link>
        <button className="cursor-not-allowed border border-black/10 px-4 py-3 text-gray-400">
          Fancall Plus
        </button>
      </div>
    </AppPageShell>
  );
}
