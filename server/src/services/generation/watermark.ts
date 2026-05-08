import { PNG } from "pngjs";

export type WatermarkLevel = "visible" | "small" | "invisible";

type BitmapFont = Record<string, string[]>;

const WATERMARK_TEXT = "idolbooth.com";
const FONT: BitmapFont = {
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  b: ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  c: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  d: ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  h: ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  i: ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  l: ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  m: ["00000", "11010", "10101", "10101", "10101", "10101", "10101"],
  o: ["00000", "01110", "10001", "10001", "10001", "10001", "01110"],
  t: ["00100", "00100", "11111", "00100", "00100", "00101", "00010"]
};

export function watermarkLevelForPlan(
  plan: "free" | "plus" | "pro" | null | undefined
): WatermarkLevel {
  if (plan === "free" || !plan) {
    return "visible";
  }

  return "small";
}

export async function applyWatermark(options: {
  input: Buffer;
  level: WatermarkLevel;
}): Promise<Buffer> {
  if (options.level === "invisible") {
    return options.input;
  }

  try {
    const png = PNG.sync.read(options.input);
    const width = png.width;
    const height = png.height;
    const textPixelWidth = bitmapTextWidth(WATERMARK_TEXT);
    const targetWidth = Math.max(
      96,
      Math.round(width * (options.level === "visible" ? 0.24 : 0.14))
    );
    const scale = Math.max(1, Math.floor(targetWidth / textPixelWidth));
    const textWidth = textPixelWidth * scale;
    const textHeight = 7 * scale;
    const paddingX = Math.max(8, Math.round(scale * 3));
    const paddingY = Math.max(5, Math.round(scale * 2));
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = textHeight + paddingY * 2;
    const margin = Math.max(8, Math.round(width * 0.025));
    const left = Math.max(0, width - boxWidth - margin);
    const top = Math.max(0, height - boxHeight - margin);
    const backgroundAlpha = options.level === "visible" ? 0.42 : 0.3;
    const textAlpha = options.level === "visible" ? 0.86 : 0.62;

    fillRect(png, left, top, boxWidth, boxHeight, [0, 0, 0, Math.round(backgroundAlpha * 255)]);
    drawText(png, WATERMARK_TEXT, left + paddingX, top + paddingY, scale, [
      255,
      255,
      255,
      Math.round(textAlpha * 255)
    ]);

    return PNG.sync.write(png);
  } catch {
    return options.input;
  }
}

function bitmapTextWidth(text: string): number {
  return [...text].reduce((width, char, index) => {
    const glyph = FONT[char];
    return width + (glyph?.[0]?.length ?? 5) + (index === 0 ? 0 : 1);
  }, 0);
}

function drawText(
  png: PNG,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: number[]
): void {
  let cursorX = x;
  for (const char of text) {
    const glyph = FONT[char];
    if (!glyph) {
      cursorX += 6 * scale;
      continue;
    }

    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] !== "1") {
          continue;
        }
        fillRect(png, cursorX + col * scale, y + row * scale, scale, scale, color);
      }
    }

    cursorX += (glyph[0].length + 1) * scale;
  }
}

function fillRect(
  png: PNG,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number[]
): void {
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      blendPixel(png, x + col, y + row, color);
    }
  }
}

function blendPixel(png: PNG, x: number, y: number, color: number[]): void {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    return;
  }

  const idx = (png.width * y + x) << 2;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  png.data[idx] = Math.round(color[0] * alpha + png.data[idx] * inverse);
  png.data[idx + 1] = Math.round(color[1] * alpha + png.data[idx + 1] * inverse);
  png.data[idx + 2] = Math.round(color[2] * alpha + png.data[idx + 2] * inverse);
  png.data[idx + 3] = Math.max(png.data[idx + 3], color[3]);
}
