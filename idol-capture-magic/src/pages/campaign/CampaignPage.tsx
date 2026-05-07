import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/api/client";
import { AppPageShell } from "@/components/app/AppPageShell";

export default function CampaignPage() {
  const { slug = "" } = useParams();
  const { data } = useQuery({
    queryKey: ["campaign", slug],
    queryFn: () => api.campaign(slug),
    enabled: Boolean(slug)
  });

  return (
    <AppPageShell
      title={data?.campaign.title ?? "Campaign"}
      description={data?.campaign.description ?? "Explore comeback-inspired fan concepts."}
      image={data?.campaign.heroImage ?? "/placeholders/group_newjeans.png"}
    />
  );
}
