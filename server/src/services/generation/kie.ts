import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { GenerationProvider, GenerationRequest, GenerationResult } from "./provider.js";

type KieAspectRatio = "1:1" | "2:3" | "3:2" | "auto";

interface KieUploadResponse {
  code: number;
  msg?: string;
  data?: {
    fileUrl?: string;
    downloadUrl?: string;
  };
}

interface KieCreateTaskResponse {
  code: number;
  msg?: string;
  data?: {
    taskId?: string;
  };
}

interface KieTaskResponse {
  code: number;
  msg?: string;
  data?: {
    state?: "waiting" | "queuing" | "generating" | "success" | "fail";
    resultJson?: string;
    failMsg?: string;
  };
}

interface KieResultJson {
  resultUrls?: string[];
}

export interface KieImageProviderOptions {
  apiKey: string;
  outputDir: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export class KieImageProvider implements GenerationProvider {
  name = "kie-gpt-image-2";
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(private readonly options: KieImageProviderOptions) {
    this.pollIntervalMs = options.pollIntervalMs ?? 3_000;
    this.timeoutMs = options.timeoutMs ?? 15 * 60_000;
  }

  estimateCost(_req: GenerationRequest): number {
    return 0.04;
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    await mkdir(this.options.outputDir, { recursive: true });
    const inputUrl = await this.uploadLocalImage(req.inputImagePath);
    const prompt = [
      req.conceptPrompt,
      `Style tokens: ${req.styleTokens.join(", ")}`,
      "Use the uploaded image as the fan reference.",
      "Use only an anonymized stylized companion silhouette; do not generate real idol faces.",
      "The result must remain clearly AI-generated and safe for fans."
    ].join("\n");
    const taskId = await this.createTask({
      prompt,
      inputUrls: [inputUrl],
      aspectRatio: sizeToAspectRatio(req.size)
    });
    const resultUrl = await this.pollResultUrl(taskId);
    const outputPath = path.join(this.options.outputDir, `${randomUUID()}.${req.outputFormat}`);
    await writeFile(outputPath, await downloadBuffer(resultUrl));

    return {
      imagePath: outputPath,
      costUsd: this.estimateCost(req),
      providerJobId: taskId
    };
  }

  private async uploadLocalImage(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    const response = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        base64Data: `data:image/png;base64,${buffer.toString("base64")}`,
        uploadPath: "idolbooth/references",
        fileName: `${randomUUID()}${path.extname(filePath) || ".png"}`
      })
    });
    const json = (await response.json().catch(() => null)) as KieUploadResponse | null;
    if (!response.ok || !json || json.code !== 200) {
      throw new Error(`Kie upload failed: ${json?.msg ?? response.statusText}`);
    }

    const uploadedUrl = json.data?.fileUrl ?? json.data?.downloadUrl;
    if (!uploadedUrl) {
      throw new Error("Kie upload response did not include a file URL");
    }

    return uploadedUrl;
  }

  private async createTask(input: {
    prompt: string;
    inputUrls: string[];
    aspectRatio: KieAspectRatio;
  }): Promise<string> {
    const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-2-image-to-image",
        input: {
          prompt: input.prompt,
          input_urls: input.inputUrls,
          aspect_ratio: input.aspectRatio
        }
      })
    });
    const json = (await response.json().catch(() => null)) as KieCreateTaskResponse | null;
    if (!response.ok || !json || json.code !== 200) {
      throw new Error(`Kie task creation failed: ${json?.msg ?? response.statusText}`);
    }

    const taskId = json.data?.taskId;
    if (!taskId) {
      throw new Error("Kie task creation response did not include taskId");
    }

    return taskId;
  }

  private async pollResultUrl(taskId: string): Promise<string> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.timeoutMs) {
      await delay(this.pollIntervalMs);
      const response = await fetch(
        `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
        {
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`
          }
        }
      );
      const json = (await response.json().catch(() => null)) as KieTaskResponse | null;
      if (!response.ok || !json || json.code !== 200) {
        throw new Error(`Kie task polling failed: ${json?.msg ?? response.statusText}`);
      }

      if (json.data?.state === "fail") {
        throw new Error(`Kie task failed: ${json.data.failMsg ?? "unknown failure"}`);
      }

      if (json.data?.state === "success") {
        const parsed = JSON.parse(json.data.resultJson ?? "{}") as KieResultJson;
        const resultUrl = parsed.resultUrls?.[0];
        if (!resultUrl) {
          throw new Error("Kie task result did not include resultUrls");
        }
        return resultUrl;
      }
    }

    throw new Error(`Kie task timed out: ${taskId}`);
  }
}

function sizeToAspectRatio(size: GenerationRequest["size"]): KieAspectRatio {
  if (size === "1024x1536") {
    return "2:3";
  }
  if (size === "1536x1024") {
    return "3:2";
  }
  return "1:1";
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
