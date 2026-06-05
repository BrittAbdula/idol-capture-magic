import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Check,
  Download,
  ImagePlus,
  Loader2,
  LogIn,
  Lock,
  RefreshCw,
  Share2,
  Sparkles,
  Upload,
  Wand2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import {
  api,
  getGoogleAuthUrl,
  isApiError,
  type ApiConcept,
  type ApiGenerationStatus
} from "@/api/client";
import { UpgradeDialog } from "@/components/billing/UpgradeDialog";
import { Button } from "@/components/ui/button";
import { ImageFrame } from "@/components/media/ImageFrame";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useQuota } from "@/hooks/useQuota";
import { getMemberSilhouetteImage } from "@/data/memberSilhouettes";
import { trackEvent } from "@/lib/analytics";
import { shouldPromptForGoogleSignIn } from "@/lib/authPrompt";
import { openGoogleSignInTab } from "@/lib/authWindow";
import { ratioFromFormat } from "@/lib/imageRatios";
import { useGenerationFlowStore } from "@/stores/generationFlow";

type GenerationFormat = "selca" | "photocard" | "strip";

interface GenerationFlowProps {
  format: GenerationFormat;
  memberId?: string | null;
  conceptId?: string | null;
  preferredConceptSlug?: string | null;
  landingProofItems?: string[];
}

const FORMAT_LABEL: Record<GenerationFormat, string> = {
  selca: "selca",
  photocard: "photocard",
  strip: "photo strip"
};
const GENERATION_POLL_INTERVAL_MS = 3_000;
const GENERATION_MAX_POLLS = 80;

export function GenerationFlow({
  format,
  memberId,
  conceptId,
  preferredConceptSlug,
  landingProofItems = []
}: GenerationFlowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadGuidanceTrackedRef = useRef(false);
  const generationPollTokenRef = useRef(0);
  const [step, setStep] = useState<1 | 2 | 3>(conceptId ? 2 : 1);
  const [manualConceptId, setManualConceptId] = useState<string | null>(null);
  const [preferredConceptId, setPreferredConceptId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeSurface, setUpgradeSurface] = useState<string | null>(null);
  const [isWaitingForSignIn, setIsWaitingForSignIn] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [localQuotaRemaining, setLocalQuotaRemaining] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const auth = useAuth();
  const {
    isAuthenticated,
    isFetching: isAuthFetching,
    isLoading: isAuthLoading,
    refetch: refetchAuth
  } = auth;
  const quota = useQuota();
  const {
    photo,
    photos,
    resultUrl,
    setPhotos,
    setResultUrl,
    setConceptId,
    setFormat,
    setMemberId,
    conceptId: storedConceptId
  } = useGenerationFlowStore();
  const selectedConceptId = manualConceptId ?? conceptId ?? storedConceptId ?? preferredConceptId;
  const selectedPhotos = useMemo(
    () => (photos.length ? photos : photo ? [photo] : []),
    [photo, photos]
  );

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
  const selectedMemberSilhouette = getMemberSilhouetteImage(
    "newjeans",
    selectedMember?.slug,
    selectedMember?.silhouetteImage
  );
  const resolvedMemberId = memberId || selectedMember?.id || "";

  const selectedConcept = useMemo(
    () => concepts.data?.find((item) => item.id === selectedConceptId),
    [concepts.data, selectedConceptId]
  );
  const quotaRemaining = localQuotaRemaining ?? quota.remaining;
  const quotaExhausted = quotaRemaining <= 0;

  useEffect(() => {
    setManualConceptId(null);
    setPreferredConceptId(null);
    setFormat(format);
    setMemberId(memberId ?? null);
    if (conceptId) {
      setConceptId(conceptId);
    }
  }, [conceptId, format, memberId, setConceptId, setFormat, setMemberId]);

  useEffect(() => {
    if (conceptId || manualConceptId || storedConceptId || preferredConceptId) {
      return;
    }

    const preferredConcept = concepts.data?.find((item) => item.slug === preferredConceptSlug);
    if (!preferredConcept) {
      return;
    }

    setPreferredConceptId(preferredConcept.id);
    setStep(2);
    trackEvent("concept_auto_select", {
      format,
      concept_id: preferredConcept.id,
      concept_slug: preferredConcept.slug,
      source: "search_landing"
    });
  }, [
    concepts.data,
    conceptId,
    format,
    manualConceptId,
    preferredConceptId,
    preferredConceptSlug,
    storedConceptId
  ]);

  useEffect(() => {
    if (!selectedPhotos.length) {
      setPreviewUrls([]);
      return;
    }
    const nextUrls = selectedPhotos.map((item) => URL.createObjectURL(item));
    setPreviewUrls(nextUrls);
    return () => nextUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [selectedPhotos]);

  useEffect(() => {
    if (!showSignInDialog || !isWaitingForSignIn || isAuthenticated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refetchAuth();
    }, 2_000);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refetchAuth, showSignInDialog, isWaitingForSignIn]);

  useEffect(() => {
    if (!showSignInDialog || !isAuthenticated) {
      return;
    }

    setIsWaitingForSignIn(false);
    setShowSignInDialog(false);
    toast.success("Signed in. Your concept and uploaded photos are still ready.");
  }, [isAuthenticated, showSignInDialog]);

  useEffect(() => {
    if (isAuthenticated) {
      setLocalQuotaRemaining(null);
    }
  }, [isAuthenticated, quota.remaining, quota.resetAt]);

  useEffect(() => {
    if (!showUpgradeDialog) {
      return;
    }

    trackEvent("upgrade_view", {
      surface: "generation_flow",
      trigger_surface: upgradeSurface,
      format,
      plan: quota.plan,
      quota_remaining: quotaRemaining,
      result_ready: Boolean(resultUrl)
    });
  }, [format, quota.plan, quotaRemaining, resultUrl, showUpgradeDialog, upgradeSurface]);

  useEffect(() => {
    if (step !== 2 || selectedPhotos.length || uploadGuidanceTrackedRef.current) {
      return;
    }

    uploadGuidanceTrackedRef.current = true;
    trackEvent("upload_guidance_view", {
      format,
      plan: quota.plan,
      signed_in: isAuthenticated,
      concept_selected: Boolean(selectedConceptId)
    });
  }, [format, isAuthenticated, quota.plan, selectedConceptId, selectedPhotos.length, step]);

  function choosePhotos(fileList: FileList | File[] | null | undefined) {
    const incomingFiles = Array.from(fileList ?? []);
    if (!incomingFiles.length) {
      return;
    }
    const validPhotos = incomingFiles.filter((file) => file.type.startsWith("image/"));
    if (validPhotos.length !== incomingFiles.length) {
      toast.error("Upload an image file.");
      return;
    }
    const availableSlots = Math.max(0, 2 - selectedPhotos.length);
    if (!availableSlots) {
      toast.info("You can upload up to 2 photos.");
      return;
    }
    const nextPhotos = [...selectedPhotos, ...validPhotos.slice(0, availableSlots)];
    if (validPhotos.length > availableSlots) {
      toast.info("Only the first 2 photos were added.");
    }
    setPhotos(nextPhotos);
    trackEvent("photo_upload", {
      format,
      photo_count: nextPhotos.length,
      added_count: Math.min(validPhotos.length, availableSlots)
    });
  }

  function removePhoto(index: number) {
    setPhotos(selectedPhotos.filter((_, photoIndex) => photoIndex !== index));
  }

  function chooseConcept(nextConceptId: string) {
    const nextConcept = concepts.data?.find((item) => item.id === nextConceptId);
    setManualConceptId(nextConceptId);
    setConceptId(nextConceptId);
    setStep(2);
    trackEvent("concept_select", {
      format,
      concept_id: nextConceptId,
      concept_premium: Boolean(nextConcept?.premium)
    });
  }

  function openUpgrade(surface: string) {
    setUpgradeSurface(surface);
    trackEvent("upgrade_click", {
      surface,
      format,
      plan: quota.plan,
      quota_remaining: quotaRemaining,
      result_ready: Boolean(resultUrl)
    });
    setShowUpgradeDialog(true);
  }

  async function checkSignIn() {
    const result = await refetchAuth();
    if (!result.data?.user) {
      toast.info("Still waiting for Google sign-in to finish.");
    }
  }

  function startGoogleSignIn() {
    const opened = openGoogleSignInTab(getGoogleAuthUrl());
    if (!opened) {
      toast.error("Popup blocked. Allow popups and try again.");
      return;
    }

    setIsWaitingForSignIn(true);
  }

  async function generate(mode: "new" | "variation" = "new") {
    if (!selectedPhotos.length || !selectedConceptId || !resolvedMemberId) {
      toast.error("Choose a concept and photo first.");
      return;
    }
    if (quotaExhausted) {
      openUpgrade("quota_exhausted_pre_generate");
      return;
    }
    if (isAuthLoading) {
      toast.info("Checking your session. Try again in a moment.");
      return;
    }

    setIsGenerating(true);
    setResultUrl(null);
    setStep(3);
    const pollToken = generationPollTokenRef.current + 1;
    generationPollTokenRef.current = pollToken;
    trackEvent("generate_start", {
      format,
      mode,
      plan: quota.plan,
      signed_in: isAuthenticated,
      photo_count: selectedPhotos.length,
      concept_premium: Boolean(selectedConcept?.premium)
    });
    try {
      const form = new FormData();
      selectedPhotos.forEach((selectedPhoto) => {
        form.append("photo", selectedPhoto);
      });
      form.set("conceptId", selectedConceptId);
      form.set("memberId", resolvedMemberId);
      form.set("makePublic", "true");
      const result = await api.generate(form);
      setGenerationId(result.id);
      setLocalQuotaRemaining(result.quotaRemaining);
      const finalResult =
        result.status === "queued" || result.status === "running"
          ? await waitForGenerationResult(result.id, pollToken)
          : result;
      if (finalResult.status === "failed") {
        throw new Error(finalResult.errorMessage || "Generation failed.");
      }
      if (!finalResult.outputUrl) {
        throw new Error("Generation finished without an output image.");
      }

      setResultUrl(finalResult.outputUrl);
      trackEvent("generate_success", {
        format,
        mode,
        plan: quota.plan,
        signed_in: isAuthenticated,
        watermark_level: result.watermarkLevel,
        quota_remaining: result.quotaRemaining
      });
      if (isAuthenticated) {
        void refetchAuth();
      }
      toast.success(mode === "variation" ? "Variation complete." : "Generation complete.");
    } catch (error) {
      trackEvent("generate_error", {
        format,
        mode,
        plan: quota.plan,
        signed_in: isAuthenticated,
        error_code: isApiError(error) ? error.code : "unknown"
      });
      if (isApiError(error) && error.code === "quota_exhausted") {
        setLocalQuotaRemaining(0);
        openUpgrade("quota_exhausted_error");
        toast.info("Daily credits reached. Upgrade to continue generating today.");
      } else if (shouldPromptForGoogleSignIn(error, isAuthenticated)) {
        trackEvent("sign_in_prompt", {
          surface: "generate_error",
          format,
          plan: quota.plan
        });
        setShowSignInDialog(true);
        setIsWaitingForSignIn(false);
        toast.info("Sign in with Google to continue generating.");
      } else {
        toast.error(error instanceof Error ? error.message : "Generation failed.");
      }
      if (isAuthenticated) {
        void refetchAuth();
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function waitForGenerationResult(
    id: string,
    pollToken: number
  ): Promise<ApiGenerationStatus> {
    toast.info("Generation started. Keeping this page open while the result finishes.");

    for (let attempt = 0; attempt < GENERATION_MAX_POLLS; attempt += 1) {
      await delay(GENERATION_POLL_INTERVAL_MS);
      if (generationPollTokenRef.current !== pollToken) {
        throw new Error("Generation was replaced by a newer request.");
      }

      const status = await api.generationStatus(id);
      if (status.status === "succeeded" || status.status === "failed") {
        return status;
      }
    }

    throw new Error("Generation is still running. Check your dashboard shortly.");
  }

  async function saveToBinder() {
    if (!generationId) {
      return;
    }
    try {
      await api.saveBinderItem(generationId, selectedConcept?.name);
      trackEvent("result_action", {
        action: "save_to_binder",
        format,
        plan: quota.plan,
        signed_in: isAuthenticated
      });
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
    trackEvent("result_action", {
      action: "share",
      format,
      plan: quota.plan,
      signed_in: isAuthenticated
    });
    toast.success("Share link copied.");
  }

  async function downloadResult() {
    if (!resultUrl) {
      return;
    }
    trackEvent("result_action", {
      action: "download",
      format,
      plan: quota.plan,
      signed_in: isAuthenticated
    });

    setIsDownloading(true);
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `idolbooth-${format}-${generationId ?? "result"}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      toast.success("Downloaded watermarked result.");
    } catch {
      trackEvent("result_action", {
        action: "download_fallback",
        format,
        plan: quota.plan,
        signed_in: isAuthenticated
      });
      window.open(resultUrl, "_blank", "noopener,noreferrer");
      toast.info(
        "Opened the image in a new tab. Save it from there if direct download is blocked."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        sourceSurface={upgradeSurface}
      />
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to generate</DialogTitle>
            <DialogDescription>
              Google sign-in opens in a new tab. Keep this tab open so your selected concept and
              uploaded photos stay ready.
            </DialogDescription>
          </DialogHeader>
          <div className="border border-idol-gold/30 bg-idol-gold/10 p-4 text-sm text-gray-700">
            {isWaitingForSignIn
              ? "Waiting for sign-in to finish. When Google redirects back, return to this tab."
              : "Free accounts include 3 daily generations. Guest requests are limited and may be blocked before the AI provider accepts the job."}
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={checkSignIn}>
              {isAuthFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}I finished
              signing in
            </Button>
            <Button className="w-full sm:w-auto" onClick={startGoogleSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              Open Google sign-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-black/10 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <div className="border-b border-black/10 pb-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">Member</p>
            <div className="mt-3 flex items-center gap-3">
              <ImageFrame
                src={selectedMemberSilhouette}
                alt={
                  selectedMember
                    ? `${selectedMember.name} silhouette`
                    : "Selected member silhouette"
                }
                ratio="square"
                tone="cool"
                className="h-12 w-12 shadow-none"
                imgClassName="p-1"
              />
              <div>
                <p className="font-semibold">{selectedMember?.name ?? "Selected member"}</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex min-h-11 items-center text-sm text-idol-gold"
                >
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
              type="button"
              onClick={() => setStep(value as 1 | 2 | 3)}
              aria-current={step === value ? "step" : undefined}
              className={`flex min-h-14 w-full items-center gap-3 border-b border-black/10 py-4 text-left ${
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
            {quotaRemaining}/{quota.total} credits left today on {quota.plan}.
          </p>
        </aside>

        <section>
          {landingProofItems.length > 0 && (
            <div className="mb-6 grid gap-2 sm:grid-cols-3">
              {landingProofItems.map((item) => (
                <div key={item} className="flex items-center gap-2 border border-black/10 p-3">
                  <Check className="h-4 w-4 shrink-0 text-idol-gold" />
                  <span className="text-sm font-medium text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div id="concepts">
              <div>
                <p className="text-sm uppercase tracking-wide text-idol-gold">
                  {FORMAT_LABEL[format]}
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Choose Concept</h2>
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
                    onClick={() => chooseConcept(concept.id)}
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
                  choosePhotos(event.dataTransfer.files);
                }}
              >
                {previewUrls.length ? (
                  <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                    {previewUrls.map((previewUrl, index) => (
                      <div key={previewUrl} className="relative">
                        <ImageFrame
                          src={previewUrl}
                          alt={`Upload preview ${index + 1}`}
                          ratio="square"
                          tone="transparent"
                          className="bg-white shadow-none"
                        />
                        <button
                          type="button"
                          aria-label={`Remove photo ${index + 1}`}
                          onClick={() => removePhoto(index)}
                          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center bg-black/70 text-white transition hover:bg-black"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <ImagePlus className="h-12 w-12 text-idol-gold" />
                    <div className="mt-5 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
                      <div className="border border-black/10 bg-white p-3">
                        <Check className="h-4 w-4 text-idol-gold" />
                        <p className="mt-2 text-sm font-medium">Use any selfie or screenshot.</p>
                      </div>
                      <div className="border border-black/10 bg-white p-3">
                        <Lock className="h-4 w-4 text-idol-gold" />
                        <p className="mt-2 text-sm font-medium">Only used for this generation.</p>
                      </div>
                      <div className="border border-black/10 bg-white p-3">
                        <Sparkles className="h-4 w-4 text-idol-gold" />
                        <p className="mt-2 text-sm font-medium">
                          Free output keeps a visible watermark.
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <p className="mt-4 font-medium">
                  {selectedPhotos.length
                    ? `${selectedPhotos.length}/2 photos selected`
                    : "Drag up to 2 photos here"}
                </p>
                <p className="mt-2 max-w-md text-sm text-gray-500">
                  PNG, JPG, or WebP. Upload two people to compose them naturally together.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedPhotos.length >= 2}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={selectedPhotos.length >= 2}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Use webcam
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(event) => {
                    choosePhotos(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
                <input
                  ref={cameraInputRef}
                  className="hidden"
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(event) => {
                    choosePhotos(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Photo is processed only to generate your output. We do not train AI on it.{" "}
                <Link
                  to="/legal/safety"
                  className="inline-flex min-h-11 items-center align-middle text-idol-gold"
                >
                  Safety policy
                </Link>
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => generate()}
                  disabled={
                    !selectedPhotos.length || !selectedConceptId || isGenerating || isAuthLoading
                  }
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate ({quotaRemaining}/{quota.total} credits left today)
                </Button>
                {quotaExhausted && (
                  <Button variant="outline" onClick={() => openUpgrade("photo_step_quota")}>
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold">Result</h2>
              <div className="mt-6 flex min-h-[420px] items-center justify-center bg-gray-50 p-6">
                {isGenerating && <KpopComposingAnimation />}
                {!isGenerating && resultUrl && (
                  <img
                    src={resultUrl}
                    alt="Generated IdolBooth result"
                    className="max-h-[70vh] object-contain"
                  />
                )}
                {!isGenerating && !resultUrl && (
                  <p className="text-gray-500">Your output appears here.</p>
                )}
              </div>
              {resultUrl && (
                <>
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
                    <Button variant="outline" onClick={downloadResult} disabled={isDownloading}>
                      {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {isDownloading ? "Preparing..." : "Download"}
                    </Button>
                    <Button variant="outline" onClick={shareResult}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  {(quota.plan === "guest" || quota.plan === "free") && (
                    <div className="mt-5 border border-idol-gold/30 bg-idol-gold/10 p-5">
                      <div className="flex items-center gap-2 font-semibold">
                        <Sparkles className="h-4 w-4 text-idol-gold" />
                        Keep this result without the free limits
                      </div>
                      <p className="mt-2 max-w-2xl text-sm text-gray-700">
                        Plus reduces the watermark and unlocks 30 daily generations. Pro adds
                        watermark-free output, HD export, and print tools.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button onClick={() => openUpgrade("result_watermark")}>
                          Remove watermark
                        </Button>
                        <Button variant="outline" onClick={() => openUpgrade("result_hd_download")}>
                          <Download className="mr-2 h-4 w-4" />
                          HD download
                        </Button>
                        <Button variant="outline" onClick={() => openUpgrade("result_value")}>
                          View plans
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {quotaExhausted && !isGenerating && (
                <div className="mt-5 border border-black/10 p-5">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="h-4 w-4" />
                    Daily credits reached
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Plus unlocks 30 daily generations and smaller watermarks.
                  </p>
                  <Button className="mt-4" onClick={() => openUpgrade("result_quota")}>
                    View plans
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function KpopComposingAnimation() {
  const bars = ["h-8", "h-14", "h-10", "h-16", "h-11", "h-14", "h-9"];
  const barDelays = ["0ms", "120ms", "240ms", "80ms", "180ms", "300ms", "60ms"];

  return (
    <div className="w-full max-w-md text-center" role="status" aria-live="polite">
      <div className="relative mx-auto aspect-[4/5] w-56 overflow-hidden border border-black/10 bg-black text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,215,0,0.38),transparent_25%),linear-gradient(145deg,rgba(236,72,153,0.38),rgba(15,23,42,0.96)_48%,rgba(34,211,238,0.34))]" />
        <div className="absolute -left-10 top-0 h-full w-20 origin-top rotate-12 animate-pulse bg-gradient-to-b from-pink-300/60 via-pink-400/10 to-transparent blur-sm" />
        <div
          className="absolute -right-10 top-0 h-full w-20 origin-top -rotate-12 animate-pulse bg-gradient-to-b from-cyan-200/60 via-cyan-300/10 to-transparent blur-sm"
          style={{ animationDelay: "260ms" }}
        />
        <div className="absolute inset-4 border border-white/25" />
        <div className="absolute left-1/2 top-[34%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-pulse border border-white/30 bg-white/10 backdrop-blur-sm">
          <Sparkles className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-idol-gold" />
          <div className="absolute inset-2 animate-spin border border-pink-300/50 border-t-transparent" />
        </div>
        <Sparkles className="absolute left-8 top-14 h-4 w-4 animate-bounce text-pink-200" />
        <Sparkles
          className="absolute right-9 top-24 h-4 w-4 animate-bounce text-cyan-200"
          style={{ animationDelay: "180ms" }}
        />
        <Sparkles
          className="absolute bottom-20 left-11 h-3.5 w-3.5 animate-bounce text-idol-gold"
          style={{ animationDelay: "320ms" }}
        />
        <div className="absolute inset-x-7 bottom-12 flex items-end justify-center gap-1.5">
          {bars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={`${height} w-2 animate-pulse bg-gradient-to-t from-idol-gold via-pink-400 to-cyan-200`}
              style={{ animationDelay: barDelays[index], animationDuration: "880ms" }}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 font-medium">
        <Sparkles className="h-4 w-4 animate-pulse text-idol-gold" />
        <span>Composing... usually under a minute</span>
      </div>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
      type="button"
      onClick={onClick}
      className={`group overflow-hidden border text-left transition ${
        selected ? "border-idol-gold" : "border-black/10 hover:border-black/30"
      }`}
    >
      <ImageFrame
        src={concept.sampleOutputUrl}
        alt={`Sample output for ${concept.name}`}
        ratio={ratioFromFormat(concept.format)}
        interactive
        className="rounded-none border-0 shadow-none"
      />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">{concept.name}</span>
          {concept.premium && <span className="text-xs text-idol-gold">Plus</span>}
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
          {concept.category ?? "daily"}
        </p>
      </div>
    </button>
  );
}
