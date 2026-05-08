export type ImageFrameRatio = "square" | "portrait" | "landscape" | "wide" | "avatar" | "auto";

export type GenerationFormat = "selca" | "photocard" | "strip" | "fancall";

export function ratioFromFormat(format: GenerationFormat | string | null | undefined): ImageFrameRatio {
  switch (format) {
    case "photocard":
    case "strip":
      return "portrait";
    case "fancall":
      return "landscape";
    case "selca":
    default:
      return "square";
  }
}

export function ratioFromImagePath(path: string | null | undefined): ImageFrameRatio {
  const value = path?.toLowerCase() ?? "";

  if (value.includes("fancall") || value.includes("-call-")) {
    return "landscape";
  }
  if (value.includes("photocard") || value.includes("-pc-") || value.includes("strip")) {
    return "portrait";
  }
  return "square";
}
