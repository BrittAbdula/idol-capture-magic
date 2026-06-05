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

export interface GenerationStartResult {
  providerJobId: string;
  costUsd: number;
}

export type GenerationPollResult =
  | { status: "queued" | "running" }
  | { status: "failed"; errorMessage: string }
  | {
      status: "succeeded";
      image: Buffer;
      contentType: string;
      costUsd: number;
    };

export interface GenerationProvider {
  name: string;
  generate(req: GenerationRequest): Promise<GenerationResult>;
  estimateCost(req: GenerationRequest): number;
}

export interface AsyncGenerationProvider extends GenerationProvider {
  start(req: GenerationRequest): Promise<GenerationStartResult>;
  poll(providerJobId: string): Promise<GenerationPollResult>;
}

export function isAsyncGenerationProvider(
  provider: GenerationProvider
): provider is AsyncGenerationProvider {
  const candidate = provider as Partial<AsyncGenerationProvider>;
  return typeof candidate.start === "function" && typeof candidate.poll === "function";
}
