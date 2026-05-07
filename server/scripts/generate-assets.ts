import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import sharp from "sharp";

import groups from "../src/db/seed/groups.json" with { type: "json" };
import concepts from "../src/db/seed/concepts.json" with { type: "json" };

type ImageSize = "1024x1024" | "1024x1536" | "1536x1024" | "512x512" | "512x128" | "256x64";
type KieAspectRatio = "1:1" | "2:3" | "3:2" | "4:1";

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

const apiKey = process.env.KIE_API_KEY;
if (!apiKey) {
  throw new Error("KIE_API_KEY is required to generate Phase 5 assets.");
}

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const frontendPublic = path.join(repoRoot, "idol-capture-magic", "public");
const serverRoot = path.join(repoRoot, "server");
const tempDir = path.join(serverRoot, "storage", "asset-generation");

async function saveGeneratedImage(prompt: string, size: ImageSize, outputPath: string): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  console.log(`Generating ${path.relative(repoRoot, outputPath)} (${size})`);
  const referencePath = await createReferenceImage(size);
  const inputUrl = await uploadImage(referencePath);
  const taskId = await createTask(prompt, inputUrl, aspectRatioForSize(size));
  const resultUrl = await pollTask(taskId);
  const result = await downloadBuffer(resultUrl);
  const { width, height } = dimensionsForSize(size);
  await sharp(result).resize(width, height, { fit: "cover" }).png().toFile(outputPath);
}

async function createReferenceImage(size: ImageSize): Promise<string> {
  await mkdir(tempDir, { recursive: true });
  const { width, height } = dimensionsForSize(size);
  const outputPath = path.join(tempDir, `${randomUUID()}.png`);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#f7d8e8"
    }
  })
    .png()
    .toFile(outputPath);
  return outputPath;
}

async function uploadImage(filePath: string): Promise<string> {
  const data = await sharp(filePath).png().toBuffer();
  const response = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      base64Data: `data:image/png;base64,${data.toString("base64")}`,
      uploadPath: "idolbooth/assets",
      fileName: `${randomUUID()}.png`
    })
  });
  const json = (await response.json().catch(() => null)) as KieUploadResponse | null;
  if (!response.ok || !json || json.code !== 200) {
    throw new Error(`Kie upload failed: ${json?.msg ?? response.statusText}`);
  }

  const url = json.data?.fileUrl ?? json.data?.downloadUrl;
  if (!url) {
    throw new Error("Kie upload response did not include a usable file URL");
  }
  return url;
}

async function createTask(prompt: string, inputUrl: string, aspectRatio: KieAspectRatio): Promise<string> {
  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-image-2-image-to-image",
      input: {
        prompt,
        input_urls: [inputUrl],
        aspect_ratio: aspectRatio
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

async function pollTask(taskId: string): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15 * 60_000) {
    await delay(3_000);
    const response = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
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

async function downloadBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateSilhouettes(): Promise<void> {
  const prompts = [
    "Minimalist vector silhouette portrait of a generic young person with a long-hair K-pop aesthetic, plain pastel pink background, no facial features visible, side profile, flat design",
    "Minimalist vector silhouette portrait of a generic young person with short bob hair, plain pastel blue background, no facial features visible, three-quarter angle, flat design",
    "Minimalist vector silhouette portrait of a generic young person with curly mid-length hair, plain pastel yellow background, no facial features visible, front view shadow only, flat design",
    "Minimalist vector silhouette portrait of a generic young person wearing a beanie, plain pastel green background, no facial features visible, side profile, flat design",
    "Minimalist vector silhouette portrait of a generic young person with straight long hair, plain pastel lavender background, no facial features visible, three-quarter angle, flat design",
    "Minimalist vector silhouette portrait of a generic young person with a ponytail, plain pastel peach background, no facial features visible, front view shadow, flat design"
  ];

  for (const [index, prompt] of prompts.entries()) {
    await saveGeneratedImage(
      prompt,
      "1024x1024",
      path.join(frontendPublic, "placeholders", `silhouette_${index + 1}.png`)
    );
  }
}

async function generateSamples(): Promise<void> {
  for (const concept of concepts) {
    const size =
      concept.format === "fancall" ? "1536x1024" : concept.format === "selca" ? "1024x1024" : "1024x1536";
    const prompt = `${concept.promptTemplate}

Replace any user-image reference language with: two stylized illustrated figures (no real persons), one in K-pop fashion, one in casual fan attire, faces shown as soft abstract gradients without distinct features.

The output must be clearly stylized and non-photorealistic.`;
    await saveGeneratedImage(prompt, size as ImageSize, path.join(frontendPublic, "samples", `${concept.slug}.png`));
  }
}

async function generateGroupCovers(): Promise<void> {
  for (const group of groups) {
    const prompt = `Abstract aesthetic banner for a K-pop fan tool, color palette dominated by ${group.themeColor} and ${complementaryColor(group.themeColor)}, no text, no human figures, modern minimal design with bokeh and light flares`;
    await saveGeneratedImage(
      prompt,
      "1536x1024",
      path.join(frontendPublic, "placeholders", `group_${group.slug}.png`)
    );
  }
}

async function generateUiIllustrations(): Promise<void> {
  await saveGeneratedImage(
    "Minimal flat logo for 'idolbooth' - letter mark 'IB' inside a rounded square, soft pastel pink and white, modern, clean, no text other than letters",
    "512x512",
    path.join(frontendPublic, "brand", "logo.png")
  );
  await saveGeneratedImage(
    "Cute minimal illustration of an empty photo binder with three blank polaroid card slots, pastel pink and cream tones, line-art style with subtle shadow",
    "1024x1024",
    path.join(frontendPublic, "illustrations", "empty-binder.png")
  );
  await saveGeneratedImage(
    "Minimal line-art illustration of a smartphone with a photo upload arrow, pastel blue background, friendly and inviting",
    "1024x1024",
    path.join(frontendPublic, "illustrations", "upload-photo.png")
  );
  await createWatermark(path.join(serverRoot, "assets", "watermark-visible.png"), "idolbooth.com - AI generated", 512, 128);
  await createWatermark(path.join(serverRoot, "assets", "watermark-small.png"), "idolbooth.com", 256, 64);
}

async function createWatermark(outputPath: string, text: string, width: number, height: number): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const fontSize = Math.round(height * 0.34);
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${Math.round(width / 2)}" y="${Math.round(height / 2 + fontSize / 3)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="white">${escapeSvg(text)}</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

function dimensionsForSize(size: ImageSize): { width: number; height: number } {
  const [width, height] = size.split("x").map((value) => Number.parseInt(value, 10));
  return { width, height };
}

function aspectRatioForSize(size: ImageSize): KieAspectRatio {
  if (size === "1024x1536") {
    return "2:3";
  }
  if (size === "1536x1024") {
    return "3:2";
  }
  if (size === "512x128" || size === "256x64") {
    return "4:1";
  }
  return "1:1";
}

function complementaryColor(hex: string): string {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return "#FFFFFF";
  }
  return `#${(0xffffff ^ value).toString(16).padStart(6, "0").toUpperCase()}`;
}

function escapeSvg(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const target = process.argv[2] ?? "all";
  if (target === "silhouettes" || target === "all") {
    await generateSilhouettes();
  }
  if (target === "samples" || target === "all") {
    await generateSamples();
  }
  if (target === "groups" || target === "all") {
    await generateGroupCovers();
  }
  if (target === "ui" || target === "all") {
    await generateUiIllustrations();
  }
  await rm(tempDir, { recursive: true, force: true });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
