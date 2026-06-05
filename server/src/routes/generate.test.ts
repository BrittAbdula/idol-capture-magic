import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createApp } from "../app.js";
import { createLucia } from "../auth/lucia.js";
import { concepts, generations, groups, members, users } from "../db/schema.js";
import { createTestD1DatabaseClient, type TestDatabaseClient } from "../db/test-d1.js";
import type {
  GenerationPollResult,
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

class FailingGenerationProvider implements GenerationProvider {
  name = "failing";

  async generate(_request: GenerationRequest): Promise<GenerationResult> {
    throw new Error("provider failed");
  }

  estimateCost(_request: GenerationRequest): number {
    return 0;
  }
}

class AsyncGenerationProviderStub implements GenerationProvider {
  name = "async-stub";
  lastRequest: GenerationRequest | null = null;
  pollResult: GenerationPollResult = { status: "running" };
  pollCalls: string[] = [];
  syncGenerateCalled = false;

  async generate(_request: GenerationRequest): Promise<GenerationResult> {
    this.syncGenerateCalled = true;
    throw new Error("sync generate should not be called");
  }

  async start(request: GenerationRequest): Promise<{ providerJobId: string; costUsd: number }> {
    this.lastRequest = request;
    return { providerJobId: "async-job-1", costUsd: 0.04 };
  }

  async poll(providerJobId: string): Promise<GenerationPollResult> {
    this.pollCalls.push(providerJobId);
    return this.pollResult;
  }

  estimateCost(_request: GenerationRequest): number {
    return 0.04;
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

  test("starts an async provider generation and returns a running job", async () => {
    const storageDir = path.join(tempDir, "storage");
    const provider = new AsyncGenerationProviderStub();
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      generationProvider: provider,
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
        "x-forwarded-for": "203.0.113.12"
      },
      body: form
    });
    const json = (await response.json()) as {
      id: string;
      status: string;
      outputUrl: string | null;
      watermarkLevel: string;
      quotaRemaining: number;
    };

    expect(response.status).toBe(202);
    expect(json).toMatchObject({
      status: "running",
      outputUrl: null,
      watermarkLevel: "visible",
      quotaRemaining: 0
    });
    expect(provider.lastRequest?.inputImages).toHaveLength(1);
    expect(provider.syncGenerateCalled).toBe(false);

    const generation = await client.d1.get<{ status: string; providerJobId: string | null }>(
      "SELECT status, provider_job_id AS providerJobId FROM generations WHERE id = ?",
      [json.id]
    );
    expect(generation).toMatchObject({
      status: "running",
      providerJobId: "async-job-1"
    });
  });

  test("finalizes an async generation when status is polled after provider success", async () => {
    const storageDir = path.join(tempDir, "storage");
    const provider = new AsyncGenerationProviderStub();
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      generationProvider: provider,
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
    const createResponse = await app.request("/api/generate", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.13"
      },
      body: form
    });
    const created = (await createResponse.json()) as { id: string };
    provider.pollResult = {
      status: "succeeded",
      image: await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: "#ffc0cb"
        }
      })
        .png()
        .toBuffer(),
      contentType: "image/png",
      costUsd: 0.04
    };

    const statusResponse = await app.request(`/api/generations/${created.id}`);
    const status = (await statusResponse.json()) as {
      status: string;
      outputUrl: string | null;
      errorMessage: string | null;
    };

    expect(statusResponse.status).toBe(200);
    expect(status).toMatchObject({
      status: "succeeded",
      errorMessage: null
    });
    expect(status.outputUrl).toMatch(/^\/storage\//);
    expect(provider.pollCalls).toEqual(["async-job-1"]);

    const generation = await client.db
      .select()
      .from(generations)
      .where(eq(generations.id, created.id))
      .get();
    expect(generation).toMatchObject({
      status: "succeeded",
      providerJobId: "async-job-1",
      cost: 0.04
    });
    expect(generation?.outputImageRef).toBeTruthy();
  });

  test("refunds an authenticated user's quota when async provider polling fails", async () => {
    await client.db
      .insert(users)
      .values({
        id: "user_async_fail",
        email: "async-fan@example.com",
        handle: "async-fan",
        locale: "en",
        plan: "free",
        dailyQuotaUsed: 0,
        dailyQuotaResetAt: 1_800_000_000,
        createdAt: 1_700_000_000
      })
      .run();
    const auth = createLucia(client, false);
    const session = await auth.createSession("user_async_fail", {});
    const storageDir = path.join(tempDir, "storage");
    const provider = new AsyncGenerationProviderStub();
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      auth,
      generationProvider: provider,
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
    const createResponse = await app.request("/api/generate", {
      method: "POST",
      headers: {
        Cookie: auth.createSessionCookie(session.id).serialize()
      },
      body: form
    });
    const created = (await createResponse.json()) as { id: string };
    provider.pollResult = {
      status: "failed",
      errorMessage: "Kie task failed: provider overloaded"
    };

    const statusResponse = await app.request(`/api/generations/${created.id}`);
    const status = (await statusResponse.json()) as {
      status: string;
      outputUrl: string | null;
      errorMessage: string | null;
    };

    expect(statusResponse.status).toBe(200);
    expect(status).toMatchObject({
      status: "failed",
      outputUrl: null,
      errorMessage: "Kie task failed: provider overloaded"
    });

    const user = await client.db
      .select()
      .from(users)
      .where(eq(users.id, "user_async_fail"))
      .get();
    expect(user?.dailyQuotaUsed).toBe(0);
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

    const generation = await client.db.select().from(generations).get();
    const refs = JSON.parse(generation?.inputImageRefs ?? "[]") as string[];
    expect(refs).toHaveLength(2);
    expect(generation?.inputImageRef).toBe(refs[0]);
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

  test("refunds the user's daily credit when generation fails", async () => {
    await client.db
      .insert(users)
      .values({
        id: "user_123",
        email: "fan@example.com",
        handle: "fan",
        locale: "en",
        plan: "free",
        dailyQuotaUsed: 0,
        dailyQuotaResetAt: 1_800_000_000,
        createdAt: 1_700_000_000
      })
      .run();
    const storageDir = path.join(tempDir, "storage");
    const auth = createLucia(client, false);
    const session = await auth.createSession("user_123", {});
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      auth,
      generationProvider: new FailingGenerationProvider(),
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
        Cookie: auth.createSessionCookie(session.id).serialize()
      },
      body: form
    });

    expect(response.status).toBe(422);
    const user = await client.db.select().from(users).where(eq(users.id, "user_123")).get();
    expect(user?.dailyQuotaUsed).toBe(0);
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
