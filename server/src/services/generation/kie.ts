import { randomUUID } from "node:crypto";

import type {
  AsyncGenerationProvider,
  GenerationPollResult,
  GenerationRequest,
  GenerationResult,
  GenerationStartResult
} from "./provider.js";

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

export interface KieImageProviderOptions {
  apiKey: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 3_000;
const DEFAULT_TIMEOUT_MS = 55_000;

export class KieImageProvider implements AsyncGenerationProvider {
  name = "kie-gpt-image-2";
  private readonly pollIntervalMs: number;
  private readonly timeoutMs: number;

  constructor(private readonly options: KieImageProviderOptions) {
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  estimateCost(_req: GenerationRequest): number {
    return 0.04;
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const task = await this.start(req);
    const result = await this.pollUntilSucceeded(task.providerJobId);

    return {
      image: result.image,
      contentType: result.contentType,
      costUsd: result.costUsd,
      providerJobId: task.providerJobId
    };
  }

  async start(req: GenerationRequest): Promise<GenerationStartResult> {
    const inputImages = req.inputImages.length
      ? req.inputImages
      : [{ image: req.inputImage, mimeType: req.inputMimeType }];
    const inputUrls = await Promise.all(
      inputImages.map((input) => this.uploadImage(input.image, input.mimeType))
    );
    const prompt = [
      req.conceptPrompt,
      `Style tokens: ${req.styleTokens.join(", ")}`,
      inputImages.length > 1
        ? "Use both uploaded photos as person references and compose the people together in one natural scene."
        : "Use the uploaded image as the fan reference.",
      inputImages.length > 1
        ? "Base the people only on the uploaded references; do not invent or impersonate unprovided real idol faces."
        : "Use only an anonymized stylized companion silhouette; do not generate real idol faces.",
      "The result must remain clearly AI-generated and safe for fans."
    ].join("\n");
    const taskId = await this.createTask({
      prompt,
      inputUrls,
      aspectRatio: sizeToAspectRatio(req.size)
    });

    return {
      providerJobId: taskId,
      costUsd: this.estimateCost(req)
    };
  }

  async poll(providerJobId: string): Promise<GenerationPollResult> {
    const response = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(providerJobId)}`,
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
      return {
        status: "failed",
        errorMessage: `Kie task failed: ${json.data.failMsg ?? "unknown failure"}`
      };
    }

    if (json.data?.state === "success") {
      const resultUrl = parseKieResultUrl(json.data.resultJson);
      if (!resultUrl) {
        return {
          status: "failed",
          errorMessage: "Kie task result did not include a result URL"
        };
      }

      return {
        status: "succeeded",
        image: await downloadBuffer(resultUrl),
        contentType: "image/png",
        costUsd: this.estimateCostForJob()
      };
    }

    return { status: "running" };
  }

  private async pollUntilSucceeded(
    providerJobId: string
  ): Promise<Extract<GenerationPollResult, { status: "succeeded" }>> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < this.timeoutMs) {
      await delay(this.pollIntervalMs);
      const result = await this.poll(providerJobId);
      if (result.status === "failed") {
        throw new Error(result.errorMessage);
      }
      if (result.status === "succeeded") {
        return result;
      }
    }

    throw new Error(`Kie task timed out: ${providerJobId}`);
  }

  private estimateCostForJob(): number {
    return 0.04;
  }

  private async uploadImage(buffer: Buffer, contentType: string): Promise<string> {
    const extension = mimeExtension(contentType);
    const response = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        base64Data: `data:${contentType};base64,${buffer.toString("base64")}`,
        uploadPath: "idolbooth/references",
        fileName: `${randomUUID()}.${extension}`
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

}

export function parseKieResultUrl(resultJson: string | undefined): string | null {
  if (!resultJson) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(resultJson);
  } catch {
    return null;
  }

  if (Array.isArray(parsed)) {
    return firstString(parsed);
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const result = parsed as Record<string, unknown>;
  return (
    firstString(result.resultUrls) ??
    firstString(result.result_urls) ??
    firstString(result.urls) ??
    null
  );
}

function firstString(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return (
    value.find((item): item is string => typeof item === "string" && item.trim().length > 0) ?? null
  );
}

function mimeExtension(mimeType: string): "png" | "jpg" | "webp" {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }
  if (mimeType === "image/webp") {
    return "webp";
  }
  return "png";
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
