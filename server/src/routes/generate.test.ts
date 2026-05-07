import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { createApp } from "../app.js";
import { createDatabaseClient, type DatabaseClient } from "../db/client.js";
import { concepts, groups, members } from "../db/schema.js";
import type {
  GenerationProvider,
  GenerationRequest,
  GenerationResult
} from "../services/generation/provider.js";
import { createLocalStorageService } from "../services/storage.js";

class StubGenerationProvider implements GenerationProvider {
  name = "stub";

  constructor(private readonly outputDir: string) {}

  async generate(_request: GenerationRequest): Promise<GenerationResult> {
    const imagePath = path.join(this.outputDir, "raw-output.png");
    await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 4,
        background: "#ffc0cb"
      }
    })
      .png()
      .toFile(imagePath);

    return {
      imagePath,
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
  let client: DatabaseClient;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), "idolbooth-generation-"));
    client = createDatabaseClient(":memory:");
    client.sqlite.exec(await readFile(new URL("../db/migrations/0000_dizzy_karnak.sql", import.meta.url), "utf8"));

    client.db.insert(groups).values({
      id: "group_newjeans",
      slug: "newjeans",
      name: "NewJeans",
      themeColor: "#A8C8E5",
      popularityRank: 1
    }).run();

    client.db.insert(members).values({
      id: "member_haerin",
      groupId: "group_newjeans",
      slug: "haerin",
      name: "Haerin",
      birthday: "05-15",
      silhouetteImage: "/placeholders/silhouette_1.png",
      todoLicensedAsset: true
    }).run();

    client.db.insert(concepts).values({
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
    }).run();
  });

  afterEach(async () => {
    client.close();
    await rm(tempDir, { recursive: true, force: true });
  });

  test("creates a succeeded watermarked generation with a stub provider", async () => {
    const storageDir = path.join(tempDir, "storage");
    const app = createApp({
      publicAppOrigin: "http://localhost:8080",
      client,
      generationProvider: new StubGenerationProvider(tempDir),
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
});
