import { randomUUID } from "node:crypto";

import OpenAI from "openai";
import { toFile } from "openai/uploads";

import type { GenerationProvider, GenerationRequest, GenerationResult } from "./provider.js";

interface ImagePayload {
  b64_json?: string;
  url?: string;
}

export class OpenAIImageProvider implements GenerationProvider {
  name = "openai";
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey, timeout: 60_000 });
  }

  estimateCost(_req: GenerationRequest): number {
    return 0.04;
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const inputImages = req.inputImages.length
      ? req.inputImages
      : [{ image: req.inputImage, mimeType: req.inputMimeType }];
    const prompt = [
      req.conceptPrompt,
      `Style tokens: ${req.styleTokens.join(", ")}`,
      inputImages.length > 1
        ? "Use both uploaded photos as person references and compose the people together in one natural scene."
        : "Use the uploaded user image as the fan reference.",
      inputImages.length > 1
        ? "Base the people only on the uploaded references; do not invent or impersonate unprovided real idol faces."
        : "Use only an anonymized stylized companion silhouette; do not generate real idol faces.",
      "The result must remain clearly AI-generated and safe for fans."
    ].join("\n");

    let payload: ImagePayload | undefined;
    try {
      const imageFiles = await Promise.all(
        inputImages.map((input, index) =>
          toFile(input.image, `input-${index + 1}.png`, { type: input.mimeType })
        )
      );
      const response = await this.client.images.edit({
        model: "gpt-image-1",
        image: (imageFiles.length === 1 ? imageFiles[0] : imageFiles) as never,
        prompt,
        size: req.size as never,
        n: 1
      });
      payload = response.data?.[0] as ImagePayload | undefined;
    } catch (error) {
      if (!isRecoverableImageEditError(error)) {
        throw error;
      }

      const response = await this.client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: req.size as never,
        n: 1
      });
      payload = response.data?.[0] as ImagePayload | undefined;
    }

    return {
      image: await imagePayloadToBuffer(payload),
      contentType: "image/png",
      costUsd: this.estimateCost(req),
      providerJobId: randomUUID()
    };
  }
}

function isRecoverableImageEditError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /image|edit|unsupported|invalid/i.test(error.message);
}

async function imagePayloadToBuffer(payload: ImagePayload | undefined): Promise<Buffer> {
  if (!payload) {
    throw new Error("OpenAI did not return image data");
  }

  if (payload.b64_json) {
    return Buffer.from(payload.b64_json, "base64");
  }

  if (payload.url) {
    const response = await fetch(payload.url);
    if (!response.ok) {
      throw new Error("Failed to download OpenAI image output");
    }
    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("OpenAI image response did not include b64_json or url");
}
