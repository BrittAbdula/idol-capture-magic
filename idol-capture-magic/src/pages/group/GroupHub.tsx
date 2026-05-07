import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";

export default function GroupHub() {
  const { groupSlug = "" } = useParams();
  const { data } = useQuery({
    queryKey: ["group", groupSlug],
    queryFn: () => api.group(groupSlug),
    enabled: Boolean(groupSlug)
  });
  const group = data?.group;

  return (
    <AppPageShell
      title={group ? group.name : "Group Hub"}
      description="Pick a member, then choose a selca, photocard, or 4-cut strip concept."
      image={group?.coverImage ?? "/placeholders/group_newjeans.png"}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
    </AppPageShell>
  );
}
