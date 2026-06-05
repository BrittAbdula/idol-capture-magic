import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ImageFrameRatio } from "@/lib/imageRatios";

type ImageFit = "contain" | "cover";
type ImageTone = "paper" | "warm" | "cool" | "dark" | "transparent";

interface ImageFrameProps {
  src: string | null | undefined;
  alt?: string;
  ratio?: ImageFrameRatio;
  fit?: ImageFit;
  tone?: ImageTone;
  interactive?: boolean;
  className?: string;
  imgClassName?: string;
  fallbackSrc?: string;
  children?: ReactNode;
}

const ratioClasses: Record<ImageFrameRatio, string> = {
  square: "aspect-square",
  portrait: "aspect-[2/3]",
  landscape: "aspect-[3/2]",
  wide: "aspect-video",
  avatar: "aspect-square",
  auto: ""
};

const toneClasses: Record<ImageTone, string> = {
  paper: "bg-[#f7f3eb]",
  warm: "bg-[#fff7df]",
  cool: "bg-[#eef6ff]",
  dark: "bg-gray-950",
  transparent: "bg-transparent"
};

export function ImageFrame({
  src,
  alt = "",
  ratio = "square",
  fit = "contain",
  tone = "paper",
  interactive = false,
  className,
  imgClassName,
  fallbackSrc,
  children
}: ImageFrameProps) {
  const isAuto = ratio === "auto";
  const isContain = fit === "contain";
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={interactive && !shouldReduceMotion ? { y: -2 } : undefined}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-md border border-black/10 shadow-[0_14px_40px_rgba(15,23,42,0.06)]",
        toneClasses[tone],
        ratioClasses[ratio],
        interactive &&
          "transition-shadow duration-300 hover:shadow-[0_18px_54px_rgba(15,23,42,0.12)]",
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            if (fallbackSrc && !event.currentTarget.dataset.fallbackApplied) {
              event.currentTarget.dataset.fallbackApplied = "true";
              event.currentTarget.src = fallbackSrc;
            }
          }}
          className={cn(
            isAuto ? "h-auto w-full" : "h-full w-full",
            fit === "cover" ? "object-cover" : "object-contain",
            isContain && !isAuto && (ratio === "avatar" ? "p-1.5" : "p-3"),
            "transition duration-500",
            interactive && !shouldReduceMotion && "group-hover:scale-[1.015]",
            imgClassName
          )}
        />
      ) : (
        <div
          className={cn(
            "flex h-full min-h-32 w-full items-center justify-center text-sm text-gray-400",
            isAuto && "py-12"
          )}
        >
          Image unavailable
        </div>
      )}
      {children}
    </motion.div>
  );
}
