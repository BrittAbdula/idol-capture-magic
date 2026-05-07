export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface ApiGroup {
  id: string;
  slug: string;
  name: string;
  nameKo: string | null;
  nameJa: string | null;
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
  campaignId?: string | null;
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
  campaigns: (params?: { status?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", String(params.limit));
    return requestJson<ApiCampaign[]>(`/api/campaigns${query.size ? `?${query}` : ""}`);
  },
  publicShare: (generationId: string) =>
    requestJson<{
      generation: {
        id: string;
        status: string;
        format: string;
        outputUrl: string | null;
        watermarkLevel: string;
        createdAt: number;
      };
    }>(`/api/share/${generationId}`),
  publicBinder: (handle: string) =>
    requestJson<{
      handle: string;
      items: Array<{
        id: string;
        generationId: string;
        customCaption: string | null;
        outputUrl: string | null;
      }>;
    }>(`/api/binder/public/${handle}`),
  binderItems: () =>
    requestJson<{
      items: Array<{
        id: string;
        generationId: string;
        customCaption: string | null;
        outputUrl: string | null;
      }>;
    }>("/api/binder/items"),
  saveBinderItem: (generationId: string, customCaption?: string) =>
    requestJson<{ item: { id: string } }>("/api/binder/items", {
      method: "POST",
      body: JSON.stringify({ generationId, customCaption })
    }),
  deleteBinderItem: (id: string) =>
    requestJson<{ ok: true }>(`/api/binder/items/${id}`, { method: "DELETE" }),
  billingCheckout: (plan: "plus" | "pro") =>
    requestJson<{ id: string; url: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan })
    }),
  generate: (form: FormData) =>
    requestJson<{
      id: string;
      status: string;
      outputUrl: string;
      watermarkLevel: string;
      quotaRemaining: number;
    }>("/api/generate", { method: "POST", body: form })
};
