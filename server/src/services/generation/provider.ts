export interface GenerationRequest {
  conceptPrompt: string;
  styleTokens: string[];
  inputImagePath: string;
  memberSilhouettePath: string;
  outputFormat: "png" | "webp";
  size: "1024x1024" | "1024x1536" | "1536x1024";
}

export interface GenerationResult {
  imagePath: string;
  costUsd: number;
  providerJobId: string;
}

export interface GenerationProvider {
  name: string;
  generate(req: GenerationRequest): Promise<GenerationResult>;
  estimateCost(req: GenerationRequest): number;
}
