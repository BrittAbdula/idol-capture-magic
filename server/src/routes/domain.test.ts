import { readFile } from "node:fs/promises";

import { beforeEach, describe, expect, test } from "vitest";

import { createApp } from "../app.js";
import { createLucia } from "../auth/lucia.js";
import { createDatabaseClient, type DatabaseClient } from "../db/client.js";
import { binderItems, concepts, generations, groups, members, users } from "../db/schema.js";

describe("domain APIs", () => {
  let client: DatabaseClient;

  beforeEach(async () => {
    client = createDatabaseClient(":memory:");
    client.sqlite.exec(await readFile(new URL("../db/migrations/0000_dizzy_karnak.sql", import.meta.url), "utf8"));
    client.db.insert(groups).values({
      id: "group_newjeans",
      slug: "newjeans",
      name: "NewJeans",
      agency: "ADOR",
      debutDate: "2022-07-22",
      themeColor: "#A8C8E5",
      coverImage: "/placeholders/group_newjeans.png",
      popularityRank: 1
    }).run();
    client.db.insert(members).values({
      id: "member_haerin",
      groupId: "group_newjeans",
      slug: "haerin",
      name: "Haerin",
      position: "Vocalist",
      birthday: "05-15",
      silhouetteImage: "/placeholders/silhouette_1.png",
      todoLicensedAsset: true,
      facts: JSON.stringify({ position: "Vocalist" })
    }).run();
    client.db.insert(concepts).values({
      id: "concept_polaroid",
      slug: "polaroid-selca",
      name: "Polaroid Selca",
      format: "selca",
      category: "polaroid",
      promptTemplate: "A safe anonymized stylized companion prompt.",
      styleTokens: JSON.stringify(["polaroid"]),
      sampleOutputUrl: "/samples/polaroid-selca.png",
      premium: false
    }).run();
    client.db.insert(users).values({
      id: "user_123",
      email: "fan@example.com",
      handle: "fan",
      locale: "en",
      plan: "free",
      dailyQuotaUsed: 0,
      dailyQuotaResetAt: 1_800_000_000,
      createdAt: 1_700_000_000
    }).run();
    client.db.insert(generations).values({
      id: "generation_123",
      userId: "user_123",
      conceptId: "concept_polaroid",
      memberId: "member_haerin",
      format: "selca",
      status: "succeeded",
      outputImageRef: "outputs/generation_123.png",
      watermarkLevel: "visible",
      isPublic: true,
      createdAt: 1_700_000_001
    }).run();
  });

  test("returns public group, member, concept, and share JSON", async () => {
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client });

    const groupsResponse = await app.request("/api/groups");
    const groupsJson = (await groupsResponse.json()) as Array<{ slug: string }>;
    expect(groupsJson[0]?.slug).toBe("newjeans");

    const memberResponse = await app.request("/api/members/newjeans/haerin");
    const memberJson = (await memberResponse.json()) as { member: { slug: string } };
    expect(memberJson.member.slug).toBe("haerin");

    const conceptsResponse = await app.request("/api/concepts?format=selca");
    const conceptsJson = (await conceptsResponse.json()) as Array<{ slug: string }>;
    expect(conceptsJson[0]?.slug).toBe("polaroid-selca");

    const shareResponse = await app.request("/api/share/generation_123");
    const shareJson = (await shareResponse.json()) as { generation: { outputUrl: string } };
    expect(shareJson.generation.outputUrl).toBe("/storage/outputs/generation_123.png");
  });

  test("supports authenticated binder CRUD", async () => {
    const auth = createLucia(client, false);
    const session = await auth.createSession("user_123", {});
    const app = createApp({ publicAppOrigin: "http://localhost:8080", client, auth });
    const cookie = auth.createSessionCookie(session.id).serialize();

    const createResponse = await app.request("/api/binder/items", {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ generationId: "generation_123", customCaption: "My bias card" })
    });
    expect(createResponse.status).toBe(200);
    const created = (await createResponse.json()) as { item: { id: string } };

    const listResponse = await app.request("/api/binder/items", {
      headers: { Cookie: cookie }
    });
    const list = (await listResponse.json()) as { items: Array<{ customCaption: string }> };
    expect(list.items[0]?.customCaption).toBe("My bias card");

    const publicResponse = await app.request("/api/binder/public/fan");
    const publicBinder = (await publicResponse.json()) as { items: Array<{ generationId: string }> };
    expect(publicBinder.items[0]?.generationId).toBe("generation_123");

    const deleteResponse = await app.request(`/api/binder/items/${created.item.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie }
    });
    expect(deleteResponse.status).toBe(200);

    expect(client.db.select().from(binderItems).all()).toHaveLength(0);
  });
});
