import { AppPageShell } from "@/components/app/AppPageShell";

export default function SafetyPage() {
  return (
    <AppPageShell
      title="Safety"
      description="Fan-safe generated images, visible AI watermarks, and no real-person impersonation."
    >
      <div className="prose max-w-3xl">
        <h2>AI generation rules</h2>
        <p>
          IdolBooth generates stylized fan images from concept presets. Prompts avoid real-person
          impersonation, intimate scenarios, explicit content, and unlicensed member photography.
        </p>
        <h2>Watermarking</h2>
        <p>
          Every AI-generated output includes an IdolBooth watermark. Free outputs use a visible
          watermark, Plus uses a smaller watermark, and Pro watermark metadata is stubbed for V2.0.
        </p>
        <h2>Uploads</h2>
        <p>
          Uploaded photos are processed for the requested generation and are not used to train AI
          models by IdolBooth. The API enforces MIME, size, quota, and safety checks.
        </p>
      </div>
    </AppPageShell>
  );
}
