import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import type { DatabaseClient } from "../db/client.js";
import { campaigns, concepts, generations, groups, members } from "../db/schema.js";
import { jsonError } from "../lib/http.js";
import type { StorageService } from "../services/storage.js";

const NullableString = z.string().nullable();

const GroupSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  nameKo: NullableString,
  nameJa: NullableString,
  agency: NullableString,
  debutDate: NullableString,
  themeColor: z.string(),
  coverImage: NullableString,
  popularityRank: z.number()
});

const MemberSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  slug: z.string(),
  name: z.string(),
  nameKo: NullableString,
  nameJa: NullableString,
  position: NullableString,
  birthday: NullableString,
  silhouetteImage: z.string(),
  todoLicensedAsset: z.boolean(),
  facts: NullableString
});

const ConceptSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  format: z.string(),
  category: NullableString,
  campaignId: NullableString,
  promptTemplate: z.string(),
  styleTokens: z.string(),
  sampleOutputUrl: z.string(),
  premium: z.boolean()
});
const ConceptFormatSchema = z.enum(["selca", "photocard", "strip", "fancall"]);

const CampaignSchema = z.object({
  id: z.string(),
  slug: z.string(),
  groupId: z.string(),
  title: z.string(),
  releaseDate: z.string(),
  status: z.string(),
  conceptKeywords: z.string(),
  conceptPalette: z.string(),
  heroImage: NullableString,
  description: NullableString
});

function storageUrl(ref: string | null, storage?: StorageService): string | null {
  if (!ref) {
    return null;
  }
  if (ref.startsWith("/") || /^https?:\/\//i.test(ref)) {
    return ref;
  }
  return storage?.publicUrlFor(ref) ?? `/storage/${ref}`;
}

export function createDomainRoutes(deps: { client: DatabaseClient; storage?: StorageService }): Hono {
  const app = new Hono();

  app.get("/groups", async (c) => {
    const limit = Number(c.req.query("limit") ?? 100);
    const rows = await deps.client.db
      .select()
      .from(groups)
      .orderBy(groups.popularityRank)
      .limit(Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 100)
      .all();
    return c.json(z.array(GroupSchema).parse(rows));
  });

  app.get("/groups/:slug", async (c) => {
    const group = await deps.client.db
      .select()
      .from(groups)
      .where(eq(groups.slug, c.req.param("slug")))
      .get();
    if (!group) {
      return jsonError(c, 404, "group_not_found");
    }

    const groupMembers = await deps.client.db
      .select()
      .from(members)
      .where(eq(members.groupId, group.id))
      .all();
    const groupCampaigns = await deps.client.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.groupId, group.id))
      .all();

    return c.json({
      group: GroupSchema.parse(group),
      members: z.array(MemberSchema).parse(groupMembers),
      campaigns: z.array(CampaignSchema).parse(groupCampaigns)
    });
  });

  app.get("/members/:groupSlug/:memberSlug", async (c) => {
    const group = await deps.client.db
      .select()
      .from(groups)
      .where(eq(groups.slug, c.req.param("groupSlug")))
      .get();
    if (!group) {
      return jsonError(c, 404, "member_not_found");
    }

    const member = await deps.client.db
      .select()
      .from(members)
      .where(and(eq(members.groupId, group.id), eq(members.slug, c.req.param("memberSlug"))))
      .get();
    if (!member) {
      return jsonError(c, 404, "member_not_found");
    }

    return c.json({
      group: GroupSchema.parse(group),
      member: MemberSchema.parse(member)
    });
  });

  app.get("/concepts", async (c) => {
    const formatQuery = c.req.query("format");
    const format = formatQuery ? ConceptFormatSchema.safeParse(formatQuery) : null;
    if (formatQuery && !format?.success) {
      return jsonError(c, 400, "invalid_concept_format");
    }
    const formatValue = format?.success ? format.data : undefined;
    const campaignId = c.req.query("campaignId");
    const where =
      formatValue && campaignId
        ? and(eq(concepts.format, formatValue), eq(concepts.campaignId, campaignId))
        : formatValue
          ? eq(concepts.format, formatValue)
          : campaignId
            ? eq(concepts.campaignId, campaignId)
            : undefined;
    const rows = await deps.client.db.select().from(concepts).where(where).all();

    return c.json(z.array(ConceptSchema).parse(rows));
  });

  app.get("/campaigns", async (c) => {
    const statuses = c.req.query("status")?.split(",").filter(Boolean);
    const limit = Number(c.req.query("limit") ?? 100);
    const rows = await deps.client.db
      .select()
      .from(campaigns)
      .where(
        statuses?.length
          ? inArray(campaigns.status, statuses as Array<"upcoming" | "active" | "archived">)
          : undefined
      )
      .limit(Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 100)
      .all();

    return c.json(z.array(CampaignSchema).parse(rows));
  });

  app.get("/campaigns/:slug", async (c) => {
    const campaign = await deps.client.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.slug, c.req.param("slug")))
      .get();
    if (!campaign) {
      return jsonError(c, 404, "campaign_not_found");
    }

    return c.json({ campaign: CampaignSchema.parse(campaign) });
  });

  app.get("/share/:generationId", async (c) => {
    const generation = await deps.client.db
      .select()
      .from(generations)
      .where(eq(generations.id, c.req.param("generationId")))
      .get();
    if (!generation || !generation.isPublic) {
      return jsonError(c, 404, "generation_not_found");
    }

    return c.json({
      generation: {
        id: generation.id,
        status: generation.status,
        format: generation.format,
        outputUrl: storageUrl(generation.outputImageRef, deps.storage),
        watermarkLevel: generation.watermarkLevel,
        createdAt: generation.createdAt
      }
    });
  });

  return app;
}
