import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { concepts, generations, groups, members, users } from "../../db/schema.js";
import { createTestD1DatabaseClient, type TestDatabaseClient } from "../../db/test-d1.js";
import { cleanupStaleGenerations } from "./stale.js";

describe("cleanupStaleGenerations", () => {
  let client: TestDatabaseClient;

  beforeEach(async () => {
    client = await createTestD1DatabaseClient();
    await client.db
      .insert(groups)
      .values({
        id: "group_newjeans",
        slug: "newjeans",
        name: "NewJeans",
        themeColor: "#A8C8E5",
        popularityRank: 1
      })
      .run();
    await client.db
      .insert(members)
      .values({
        id: "member_minji",
        groupId: "group_newjeans",
        slug: "minji",
        name: "Minji",
        silhouetteImage: "/placeholders/silhouette_1.png",
        todoLicensedAsset: true
      })
      .run();
    await client.db
      .insert(concepts)
      .values({
        id: "concept_polaroid",
        slug: "polaroid",
        name: "Polaroid",
        format: "selca",
        promptTemplate: "prompt",
        styleTokens: "[]",
        sampleOutputUrl: "/samples/polaroid-selca.png",
        premium: false
      })
      .run();
    await client.db
      .insert(users)
      .values({
        id: "user_1",
        email: "fan@example.com",
        handle: "fan",
        plan: "free",
        dailyQuotaUsed: 2,
        dailyQuotaResetAt: 2_000,
        createdAt: 1_000
      })
      .run();
  });

  afterEach(async () => {
    client.close();
    await client.dispose();
  });

  test("fails stale running and queued generations and refunds active user quota", async () => {
    await client.db
      .insert(generations)
      .values([
        {
          id: "old_running",
          userId: "user_1",
          conceptId: "concept_polaroid",
          memberId: "member_minji",
          format: "selca",
          status: "running",
          watermarkLevel: "visible",
          isPublic: true,
          createdAt: 900
        },
        {
          id: "old_queued_guest",
          userId: null,
          conceptId: "concept_polaroid",
          memberId: "member_minji",
          format: "selca",
          status: "queued",
          watermarkLevel: "visible",
          isPublic: true,
          createdAt: 800
        },
        {
          id: "recent_running",
          userId: "user_1",
          conceptId: "concept_polaroid",
          memberId: "member_minji",
          format: "selca",
          status: "running",
          watermarkLevel: "visible",
          isPublic: true,
          createdAt: 1_500
        },
        {
          id: "succeeded",
          userId: "user_1",
          conceptId: "concept_polaroid",
          memberId: "member_minji",
          format: "selca",
          status: "succeeded",
          watermarkLevel: "visible",
          isPublic: true,
          createdAt: 800
        }
      ])
      .run();

    const result = await cleanupStaleGenerations(client, {
      nowUnix: 1_800,
      staleAfterSeconds: 600
    });

    expect(result).toMatchObject({
      cutoffUnix: 1_200,
      staleGenerations: 2,
      refundedCredits: 1,
      refundedUsers: 1
    });

    const rows = await client.d1.getAll<{ id: string; status: string; errorMessage: string | null }>(
      "SELECT id, status, error_message AS errorMessage FROM generations ORDER BY id",
      []
    );
    expect(rows).toEqual([
      {
        id: "old_queued_guest",
        status: "failed",
        errorMessage: "Generation timed out before completion"
      },
      {
        id: "old_running",
        status: "failed",
        errorMessage: "Generation timed out before completion"
      },
      { id: "recent_running", status: "running", errorMessage: null },
      { id: "succeeded", status: "succeeded", errorMessage: null }
    ]);

    const quota = await client.d1.get<{ dailyQuotaUsed: number }>(
      "SELECT daily_quota_used AS dailyQuotaUsed FROM users WHERE id = ?",
      ["user_1"]
    );
    expect(quota?.dailyQuotaUsed).toBe(1);
  });
});
