import { readFile } from "node:fs/promises";

import { generateIdFromEntropySize } from "lucia";

import { loadDotEnv } from "../../config/env.js";
import { createD1DatabaseClient, type DatabaseClient } from "../client.js";
import { binderItems, campaigns, concepts, generations, groups, members } from "../schema.js";

interface GroupSeed {
  slug: string;
  name: string;
  agency: string;
  debutDate: string;
  themeColor: string;
  popularityRank: number;
}

interface MemberSeedGroup {
  groupSlug: string;
  members: Array<{
    slug: string;
    name: string;
    position: string;
    birthday: string;
  }>;
}

interface ConceptSeed {
  slug: string;
  name: string;
  format: "selca" | "photocard" | "strip" | "fancall";
  category: string;
  promptTemplate: string;
  styleTokens: string[];
  sampleOutputUrl: string;
  premium: boolean;
}

interface CampaignSeed {
  slug: string;
  groupSlug: string;
  title: string;
  releaseDate: string;
  status: "upcoming" | "active" | "archived";
  conceptKeywords: string[];
  conceptPalette: string[];
  description: string;
}

async function readJson<T>(fileName: string): Promise<T> {
  return JSON.parse(await readFile(new URL(fileName, import.meta.url), "utf8")) as T;
}

function id(prefix: string): string {
  return `${prefix}_${generateIdFromEntropySize(12)}`;
}

async function main() {
  loadDotEnv();
  const client = createSeedDatabaseClient();

  const groupSeeds = await readJson<GroupSeed[]>("./groups.json");
  const memberSeeds = await readJson<MemberSeedGroup[]>("./members.json");
  const conceptSeeds = await readJson<ConceptSeed[]>("./concepts.json");
  const campaignSeeds = await readJson<CampaignSeed[]>("./campaigns.json");

  await client.db.delete(binderItems).run();
  await client.db.delete(generations).run();
  await client.db.delete(campaigns).run();
  await client.db.delete(concepts).run();
  await client.db.delete(members).run();
  await client.db.delete(groups).run();

  const groupIds = new Map<string, string>();
  for (const group of groupSeeds) {
    const groupId = id("group");
    groupIds.set(group.slug, groupId);
    await client.db
      .insert(groups)
      .values({
        id: groupId,
        slug: group.slug,
        name: group.name,
        agency: group.agency,
        debutDate: group.debutDate,
        themeColor: group.themeColor,
        coverImage: `/placeholders/group_${group.slug}.png`,
        popularityRank: group.popularityRank
      })
      .run();
  }

  let silhouetteIndex = 0;
  for (const memberGroup of memberSeeds) {
    const groupId = groupIds.get(memberGroup.groupSlug);
    if (!groupId) {
      throw new Error(`Unknown group slug in members seed: ${memberGroup.groupSlug}`);
    }

    for (const member of memberGroup.members) {
      silhouetteIndex += 1;
      const silhouetteNumber = ((silhouetteIndex - 1) % 6) + 1;
      await client.db
        .insert(members)
        .values({
          id: id("member"),
          groupId,
          slug: member.slug,
          name: member.name,
          position: member.position,
          birthday: member.birthday,
          silhouetteImage: `/placeholders/silhouette_${silhouetteNumber}.png`,
          todoLicensedAsset: true,
          facts: JSON.stringify({
            position: member.position,
            groupRole: member.position
          })
        })
        .run();
    }
  }

  for (const concept of conceptSeeds) {
    await client.db
      .insert(concepts)
      .values({
        id: id("concept"),
        slug: concept.slug,
        name: concept.name,
        format: concept.format,
        category: concept.category,
        promptTemplate: concept.promptTemplate,
        styleTokens: JSON.stringify(concept.styleTokens),
        sampleOutputUrl: concept.sampleOutputUrl,
        premium: concept.premium
      })
      .run();
  }

  for (const campaign of campaignSeeds) {
    const groupId = groupIds.get(campaign.groupSlug);
    if (!groupId) {
      throw new Error(`Unknown group slug in campaigns seed: ${campaign.groupSlug}`);
    }

    await client.db
      .insert(campaigns)
      .values({
        id: id("campaign"),
        slug: campaign.slug,
        groupId,
        title: campaign.title,
        releaseDate: campaign.releaseDate,
        status: campaign.status,
        conceptKeywords: JSON.stringify(campaign.conceptKeywords),
        conceptPalette: JSON.stringify(campaign.conceptPalette),
        heroImage: `/placeholders/group_${campaign.groupSlug}.png`,
        description: campaign.description
      })
      .run();
  }

  client.close();
  console.log(
    `Seeded ${groupSeeds.length} groups, ${memberSeeds.reduce((sum, group) => sum + group.members.length, 0)} members, ${conceptSeeds.length} concepts, ${campaignSeeds.length} campaigns.`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

function createSeedDatabaseClient(): DatabaseClient {
  return createD1DatabaseClient({
    accountId: requiredEnv("CLOUDFLARE_ACCOUNT_ID"),
    databaseId: requiredEnv("D1_DATABASE_ID"),
    apiToken: requiredEnv("CLOUDFLARE_API_TOKEN")
  });
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for D1 seed operations`);
  }
  return value;
}
