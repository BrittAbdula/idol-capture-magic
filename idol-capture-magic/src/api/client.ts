export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface ApiGroup {
  id: string;
  slug: string;
  name: string;
  agency: string | null;
  debutDate: string | null;
  themeColor: string;
  coverImage: string | null;
  popularityRank: number;
}

export interface ApiMember {
  id: string;
  groupId: string;
  slug: string;
  name: string;
  position: string | null;
  birthday: string | null;
  silhouetteImage: string;
  todoLicensedAsset: boolean;
  facts: string | null;
}

export interface ApiConcept {
  id: string;
  slug: string;
  name: string;
  format: "selca" | "photocard" | "strip" | "fancall";
  category: string | null;
  sampleOutputUrl: string;
  premium: boolean;
}

export interface ApiCampaign {
  id: string;
  slug: string;
  groupId: string;
  title: string;
  releaseDate: string;
  status: "upcoming" | "active" | "archived";
  conceptKeywords: string;
  conceptPalette: string;
  heroImage: string | null;
  description: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  handle: string;
  plan: "free" | "plus" | "pro";
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  me: () => requestJson<{ user: AuthUser | null }>("/auth/me"),
  groups: () => requestJson<ApiGroup[]>("/api/groups"),
  group: (slug: string) =>
    requestJson<{ group: ApiGroup; members: ApiMember[]; campaigns: ApiCampaign[] }>(
      `/api/groups/${slug}`
    ),
  member: (groupSlug: string, memberSlug: string) =>
    requestJson<{ group: ApiGroup; member: ApiMember }>(
      `/api/members/${groupSlug}/${memberSlug}`
    ),
  concepts: (params?: { format?: ApiConcept["format"]; memberId?: string; campaignId?: string }) => {
    const query = new URLSearchParams();
    if (params?.format) query.set("format", params.format);
    if (params?.memberId) query.set("memberId", params.memberId);
    if (params?.campaignId) query.set("campaignId", params.campaignId);
    return requestJson<ApiConcept[]>(`/api/concepts${query.size ? `?${query}` : ""}`);
  },
  campaign: (slug: string) =>
    requestJson<{ campaign: ApiCampaign }>(`/api/campaigns/${slug}`),
  generate: (form: FormData) =>
    requestJson<{
      id: string;
      status: string;
      outputUrl: string;
      watermarkLevel: string;
      quotaRemaining: number;
    }>("/api/generate", { method: "POST", body: form })
};
