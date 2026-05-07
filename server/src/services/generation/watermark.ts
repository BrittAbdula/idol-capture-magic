import sharp from "sharp";

export type WatermarkLevel = "visible" | "small" | "invisible";

export function watermarkLevelForPlan(plan: "free" | "plus" | "pro" | null | undefined): WatermarkLevel {
  if (plan === "free" || !plan) {
    return "visible";
  }

  return "small";
}

export async function applyWatermark(options: {
  inputPath: string;
  outputPath: string;
  level: WatermarkLevel;
}): Promise<void> {
  const image = sharp(options.inputPath);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const watermarkWidth = Math.max(96, Math.round(width * (options.level === "visible" ? 0.24 : 0.14)));
  const opacity = options.level === "visible" ? 0.8 : 0.55;
  const watermark = await createWatermarkSvg(watermarkWidth, opacity);

  await image
    .composite([
      {
        input: watermark,
        gravity: "southeast",
        left: undefined,
        top: undefined
      }
    ])
    .png()
    .toFile(options.outputPath);
}

async function createWatermarkSvg(width: number, opacity: number): Promise<Buffer> {
  const height = Math.max(32, Math.round(width * 0.25));
  const fontSize = Math.max(14, Math.round(width * 0.085));
  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${Math.round(height / 2)}" fill="black" opacity="${opacity * 0.45}"/>
  <text x="${Math.round(width / 2)}" y="${Math.round(height / 2 + fontSize / 3)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" opacity="${opacity}">idolbooth.com</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
