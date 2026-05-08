export interface GenerationInputImage {
  image: Buffer;
  mimeType: string;
}

export interface GenerationRequest {
  conceptPrompt: string;
  styleTokens: string[];
  inputImage: Buffer;
  inputMimeType: string;
  inputImages: GenerationInputImage[];
  outputFormat: "png" | "webp";
  size: "1024x1024" | "1024x1536" | "1536x1024";
}

export interface GenerationResult {
  image: Buffer;
  contentType: string;
  costUsd: number;
  providerJobId: string;
}

export interface GenerationProvider {
  name: string;
  generate(req: GenerationRequest): Promise<GenerationResult>;
  estimateCost(req: GenerationRequest): number;
}
