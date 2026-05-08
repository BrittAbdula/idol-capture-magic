import { create } from "zustand";

type GenerationFormat = "selca" | "photocard" | "strip" | "fancall";

interface GenerationFlowState {
  format: GenerationFormat;
  memberId: string | null;
  conceptId: string | null;
  photo: File | null;
  photos: File[];
  resultUrl: string | null;
  setFormat: (format: GenerationFormat) => void;
  setMemberId: (memberId: string | null) => void;
  setConceptId: (conceptId: string | null) => void;
  setPhoto: (photo: File | null) => void;
  setPhotos: (photos: File[]) => void;
  setResultUrl: (resultUrl: string | null) => void;
  reset: () => void;
}

export const useGenerationFlowStore = create<GenerationFlowState>((set) => ({
  format: "selca",
  memberId: null,
  conceptId: null,
  photo: null,
  photos: [],
  resultUrl: null,
  setFormat: (format) => set({ format }),
  setMemberId: (memberId) => set({ memberId }),
  setConceptId: (conceptId) => set({ conceptId }),
  setPhoto: (photo) => set({ photo, photos: photo ? [photo] : [] }),
  setPhotos: (photos) => set({ photos, photo: photos[0] ?? null }),
  setResultUrl: (resultUrl) => set({ resultUrl }),
  reset: () =>
    set({
      memberId: null,
      conceptId: null,
      photo: null,
      photos: [],
      resultUrl: null
    })
}));
