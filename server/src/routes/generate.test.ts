import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createApp } from "../app.js";
import { createLucia } from "../auth/lucia.js";
import { concepts, generations, groups, members, users } from "../db/schema.js";
import { createTestD1DatabaseClient, type TestDatabaseClient } from "../db/test-d1.js";
import type {
  GenerationProvider,
  GenerationRequest,
  GenerationResult
} from "../services/generation/provider.js";
import { createLocalStorageService } from "../services/storage.js";

class StubGenerationProvider implements GenerationProvider {
  name = "stub";
  lastRequest: GenerationRequest | null = null;

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    this.lastRequest = request;
    const image = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 4,
        background: "#ffc0cb"
      }
    })
      .png()
      .toBuffer();

    return {
      image,
      contentType: "image/png",
      costUsd: 0,
      providerJobId: "stub-job"
    };
  }

  estimateCost(_request: GenerationRequest): number {
    return 0;
  }
}

describe("generation routes", () => {
  let tempDir: string;
  let client: TestDatabaseClient;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "idolbooth-generation-"));
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
        id: "member_haerin",
        groupId: "group_newjeans",
        slug: "haerin",
        name: "Haerin",
        birthday: "05-15",
        silhouetteImage: "/placeholders/silhouette_1.png",
        todoLicensedAsset: true
      })
      .run();

    await client.db
      .insert(concepts)
      .values({
        id: "concept_polaroid",
        slug: "polaroid-selca",
        name: "Polaroid Selca",
        format: "selca",
        category: "polaroid",
        promptTemplate:
          "A polaroid with the user and an anonymized stylized companion, soft film grain.",
        styleTokens: JSON.stringify(["polaroid", "film grain"]),
        sampleOutputUrl: "/samples/polaroid-selca.png",
        premium: false
      })
      .run();
  });

  afterEach(async () => {
    client.close();
    await client.dispose();
    await rm(tempDir, { recursive: true, force: true });
  });

  test("creates a succeeded watermarked generation with a stub provider", async () => {
    const storageDir = path.join(tempDir, "storage");
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      generationProvider: new StubGenerationProvider(),
      storage: createLocalStorageService({ rootDir: storageDir })
    });
    const inputImage = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: "#ffffff"
      }
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set("conceptId", "concept_polaroid");
    form.set("memberId", "member_haerin");
    form.set("photo", new File([inputImage], "fan.png", { type: "image/png" }));

    const response = await app.request("/api/generate", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.10"
      },
      body: form
    });
    const json = (await response.json()) as {
      status: string;
      watermarkLevel: string;
      quotaRemaining: number;
      outputUrl: string;
    };

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      status: "succeeded",
      watermarkLevel: "visible",
      quotaRemaining: 0
    });
    expect(json.outputUrl).toMatch(/^\/storage\//);

    const outputPath = path.join(storageDir, json.outputUrl.replace("/storage/", ""));
    const metadata = await sharp(outputPath).metadata();
    expect(metadata.width).toBe(256);
    expect(metadata.height).toBe(256);
  });

  test("passes up to two uploaded photos to the generation provider", async () => {
    const storageDir = path.join(tempDir, "storage");
    const provider = new StubGenerationProvider();
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      generationProvider: provider,
      storage: createLocalStorageService({ rootDir: storageDir })
    });
    const firstImage = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: "#ffffff"
      }
    })
      .png()
      .toBuffer();
    const secondImage = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: "#101010"
      }
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set("conceptId", "concept_polaroid");
    form.set("memberId", "member_haerin");
    form.append("photo", new File([firstImage], "fan.png", { type: "image/png" }));
    form.append("photo", new File([secondImage], "friend.png", { type: "image/png" }));

    const response = await app.request("/api/generate", {
      method: "POST",
      body: form
    });

    expect(response.status).toBe(200);
    expect(provider.lastRequest?.inputImages).toHaveLength(2);
    expect(provider.lastRequest?.inputImages[0]?.mimeType).toBe("image/png");
    expect(provider.lastRequest?.inputImages[1]?.mimeType).toBe("image/png");
  });

  test("rejects more than two uploaded photos", async () => {
    const storageDir = path.join(tempDir, "storage");
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      generationProvider: new StubGenerationProvider(),
      storage: createLocalStorageService({ rootDir: storageDir })
    });
    const inputImage = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: "#ffffff"
      }
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set("conceptId", "concept_polaroid");
    form.set("memberId", "member_haerin");
    form.append("photo", new File([inputImage], "one.png", { type: "image/png" }));
    form.append("photo", new File([inputImage], "two.png", { type: "image/png" }));
    form.append("photo", new File([inputImage], "three.png", { type: "image/png" }));

    const response = await app.request("/api/generate", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.11"
      },
      body: form
    });
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toBe("too_many_photos");
  });

  test("lists the authenticated user's generation history with credit details", async () => {
    await client.db
      .insert(users)
      .values([
        {
          id: "user_123",
          email: "fan@example.com",
          handle: "fan",
          locale: "en",
          plan: "free",
          dailyQuotaUsed: 0,
          dailyQuotaResetAt: 1_800_000_000,
          createdAt: 1_700_000_000
        },
        {
          id: "user_456",
          email: "other@example.com",
          handle: "other",
          locale: "en",
          plan: "free",
          dailyQuotaUsed: 0,
          dailyQuotaResetAt: 1_800_000_000,
          createdAt: 1_700_000_000
        }
      ])
      .run();
    await client.db
      .insert(generations)
      .values([
        {
          id: "generation_new",
          userId: "user_123",
          conceptId: "concept_polaroid",
          memberId: "member_haerin",
          format: "selca",
          status: "succeeded",
          outputImageRef: "outputs/new.png",
          cost: 0.04,
          watermarkLevel: "visible",
          isPublic: true,
          createdAt: 1_700_000_200
        },
        {
          id: "generation_old",
          userId: "user_123",
          conceptId: "concept_polaroid",
          memberId: "member_haerin",
          format: "selca",
          status: "failed",
          errorMessage: "provider failed",
          cost: 0,
          watermarkLevel: "visible",
          isPublic: false,
          createdAt: 1_700_000_100
        },
        {
          id: "generation_other",
          userId: "user_456",
          conceptId: "concept_polaroid",
          memberId: "member_haerin",
          format: "selca",
          status: "succeeded",
          outputImageRef: "outputs/other.png",
          cost: 0.04,
          watermarkLevel: "visible",
          isPublic: false,
          createdAt: 1_700_000_300
        }
      ])
      .run();

    const auth = createLucia(client, false);
    const session = await auth.createSession("user_123", {});
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      auth,
      generationProvider: new StubGenerationProvider(),
      storage: createLocalStorageService({ rootDir: path.join(tempDir, "storage") })
    });

    const response = await app.request("/api/generations", {
      headers: {
        Cookie: auth.createSessionCookie(session.id).serialize()
      }
    });

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      items: Array<{
        id: string;
        conceptName: string;
        memberName: string;
        outputUrl: string | null;
        creditsUsed: number;
        costUsd: number | null;
      }>;
    };

    expect(json.items.map((item) => item.id)).toEqual(["generation_new", "generation_old"]);
    expect(json.items[0]).toMatchObject({
      conceptName: "Polaroid Selca",
      memberName: "Haerin",
      outputUrl: "/storage/outputs/new.png",
      creditsUsed: 1,
      costUsd: 0.04
    });
    expect(json.items[1]?.creditsUsed).toBe(1);
  });
});
