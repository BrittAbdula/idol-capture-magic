import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Lock,
  RefreshCw,
  Share2,
  Sparkles,
  Upload,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import { api, type ApiConcept } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useQuota } from "@/hooks/useQuota";
import { useGenerationFlowStore } from "@/stores/generationFlow";

type GenerationFormat = "selca" | "photocard" | "strip";

interface GenerationFlowProps {
  format: GenerationFormat;
  memberId?: string | null;
  conceptId?: string | null;
}

const FORMAT_LABEL: Record<GenerationFormat, string> = {
  selca: "selca",
  photocard: "photocard",
  strip: "photo strip"
};

export function GenerationFlow({ format, memberId, conceptId }: GenerationFlowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(conceptId ? 2 : 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const quota = useQuota();
  const {
    photo,
    resultUrl,
    setPhoto,
    setResultUrl,
    setConceptId,
    setFormat,
    setMemberId,
    conceptId: storedConceptId
  } = useGenerationFlowStore();
  const selectedConceptId = conceptId ?? storedConceptId;

  const concepts = useQuery({
    queryKey: ["concepts", format],
    queryFn: () => api.concepts({ format })
  });
  const defaultGroup = useQuery({
    queryKey: ["group", "newjeans"],
    queryFn: () => api.group("newjeans")
  });
  const selectedMember = useMemo(
    () =>
      memberId
        ? defaultGroup.data?.members.find((item) => item.id === memberId)
        : defaultGroup.data?.members[0],
    [defaultGroup.data?.members, memberId]
  );
  const resolvedMemberId = memberId || selectedMember?.id || "";

  const selectedConcept = useMemo(
    () => concepts.data?.find((item) => item.id === selectedConceptId),
    [concepts.data, selectedConceptId]
  );
  const quotaExhausted = quota.remaining <= 0;

  useEffect(() => {
    setFormat(format);
    setMemberId(memberId ?? null);
    if (conceptId) {
      setConceptId(conceptId);
    }
  }, [conceptId, format, memberId, setConceptId, setFormat, setMemberId]);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return;
    }
    const nextUrl = URL.createObjectURL(photo);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [photo]);

  function choosePhoto(file: File | null | undefined) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Upload an image file.");
      return;
    }
    setPhoto(file);
  }

  async function generate(mode: "new" | "variation" = "new") {
    if (!photo || !selectedConceptId || !resolvedMemberId) {
      toast.error("Choose a concept and photo first.");
      return;
    }
    if (quotaExhausted) {
      toast.info("Daily quota reached. Upgrade to continue generating today.");
      return;
    }

    setIsGenerating(true);
    setResultUrl(null);
    setStep(3);
    try {
      const form = new FormData();
      form.set("photo", photo);
      form.set("conceptId", selectedConceptId);
      form.set("memberId", resolvedMemberId);
      form.set("makePublic", "true");
      const result = await api.generate(form);
      setResultUrl(result.outputUrl);
      setGenerationId(result.id);
      toast.success(mode === "variation" ? "Variation complete." : "Generation complete.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveToBinder() {
    if (!generationId) {
      return;
    }
    try {
      await api.saveBinderItem(generationId, selectedConcept?.name);
      toast.success("Saved to Binder.");
    } catch {
      toast.info("Binder save is available after sign-in.");
    }
  }

  async function shareResult() {
    if (!generationId) {
      return;
    }
    const shareUrl = `${window.location.origin}/share/${generationId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-black/10 pr-0 lg:pr-6">
        <div className="border-b border-black/10 pb-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Member</p>
          <div className="mt-3 flex items-center gap-3">
            <img
              src={selectedMember?.silhouetteImage ?? "/placeholders/silhouette_1.png"}
              alt=""
              className="h-12 w-12 object-cover"
            />
            <div>
              <p className="font-semibold">{selectedMember?.name ?? "Selected member"}</p>
              <button onClick={() => setStep(1)} className="text-sm text-idol-gold">
                Change concept
              </button>
            </div>
          </div>
        </div>

        {[
          ["Concept", 1],
          ["Photo", 2],
          ["Result", 3]
        ].map(([label, value]) => (
          <button
            key={label}
            onClick={() => setStep(value as 1 | 2 | 3)}
            className={`flex w-full items-center gap-3 border-b border-black/10 py-4 text-left ${
              step === value ? "text-black" : "text-gray-500"
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center border border-current text-xs">
              {value}
            </span>
            <span className="font-medium">{label}</span>
          </button>
        ))}
        <p className="mt-6 text-sm text-gray-600">
          {quota.remaining}/{quota.total} generations left today on {quota.plan}.
        </p>
      </aside>

      <section>
        {step === 1 && (
          <div id="concepts">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-idol-gold">{FORMAT_LABEL[format]}</p>
                <h2 className="mt-1 text-2xl font-semibold">Choose Concept</h2>
              </div>
              <Button disabled={!selectedConceptId} onClick={() => setStep(2)}>
                Continue
                <Wand2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {concepts.isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-square animate-pulse bg-gray-100" />
                ))}
              {concepts.data?.map((concept) => (
                <ConceptButton
                  key={concept.id}
                  concept={concept}
                  selected={concept.id === selectedConceptId}
                  onClick={() => setConceptId(concept.id)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-semibold">Provide Photo</h2>
            <div
              className="mt-6 flex min-h-[300px] flex-col items-center justify-center border border-dashed border-black/30 bg-gray-50 p-6 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                choosePhoto(event.dataTransfer.files[0]);
              }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Upload preview" className="h-40 w-40 object-cover" />
              ) : (
                <ImagePlus className="h-12 w-12 text-idol-gold" />
              )}
              <p className="mt-4 font-medium">{photo ? photo.name : "Drag a photo here"}</p>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                PNG, JPG, or WebP. Face checks are handled by the server for V2.0.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
                <Button variant="outline" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />
                  Use webcam
                </Button>
              </div>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => choosePhoto(event.target.files?.[0])}
              />
              <input
                ref={cameraInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                capture="user"
                onChange={(event) => choosePhoto(event.target.files?.[0])}
              />
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Photo is processed only to generate your output. We do not train AI on it.{" "}
              <Link to="/legal/safety" className="text-idol-gold">
                Safety policy
              </Link>
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => generate()} disabled={!photo || !selectedConceptId || isGenerating || quotaExhausted}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate ({quota.remaining}/{quota.total} left today)
              </Button>
              {quotaExhausted && (
                <Link to="/pricing" className="idol-button-outline-square inline-flex items-center">
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-semibold">Result</h2>
            <div className="mt-6 flex min-h-[420px] items-center justify-center bg-gray-50 p-6">
              {isGenerating && (
                <div className="w-full max-w-md text-center">
                  <div className="mx-auto aspect-[4/5] w-56 animate-pulse bg-idol-gold/20" />
                  <p className="mt-5 font-medium">Composing... about 12s</p>
                </div>
              )}
              {!isGenerating && resultUrl && (
                <img src={resultUrl} alt="Generated IdolBooth result" className="max-h-[70vh] object-contain" />
              )}
              {!isGenerating && !resultUrl && <p className="text-gray-500">Your output appears here.</p>}
            </div>
            {resultUrl && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={saveToBinder}>
                  <Check className="mr-2 h-4 w-4" />
                  Save to Binder
                </Button>
                <Button variant="outline" onClick={() => generate()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
                <Button variant="outline" onClick={() => generate("variation")}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Try variation
                </Button>
                <Button variant="outline" onClick={shareResult}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            )}
            {quotaExhausted && !isGenerating && (
              <div className="mt-5 border border-black/10 p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4" />
                  Daily quota reached
                </div>
                <p className="mt-2 text-sm text-gray-600">Plus unlocks 30 daily generations and smaller watermarks.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ConceptButton({
  concept,
  selected,
  onClick
}: {
  concept: ApiConcept;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group overflow-hidden border text-left transition ${
        selected ? "border-idol-gold" : "border-black/10 hover:border-black/30"
      }`}
    >
      <img src={concept.sampleOutputUrl} alt="" className="aspect-square w-full object-cover" />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{concept.name}</span>
          {concept.premium && <span className="text-xs text-idol-gold">Plus</span>}
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{concept.category ?? "daily"}</p>
      </div>
    </button>
  );
}
