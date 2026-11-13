import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Иллюстративные обложки до появления фотографий: линейные силуэты на градиенте.
 * Когда у выкройки появится `cover_url`, компонент начнёт показывать `next/image`,
 * а иллюстрация останется фолбэком для карточек без фото.
 */

type ArtProps = { className?: string; style?: CSSProperties };

function Art({ children, className, style }: ArtProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 300" fill="none" aria-hidden="true" className={className} style={style}>
      <g stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

function DressShirtArt(props: ArtProps) {
  return (
    <Art {...props}>
      <path d="M96 54 L70 64 L42 124 L60 138 L78 110 L78 168 L66 272 L174 272 L162 168 L162 110 L180 138 L198 124 L170 64 L144 54 C140 68 100 68 96 54 Z" />
      <path d="M96 54 C104 64 136 64 144 54" />
      <path d="M120 66 V268" strokeDasharray="5 6" opacity="0.55" />
      <path d="M78 168 H162" strokeDasharray="5 6" opacity="0.55" />
      <path d="M66 272 C100 264 140 264 174 272" opacity="0.5" />
      <rect x="86" y="184" width="24" height="28" rx="2" />
      <rect x="130" y="184" width="24" height="28" rx="2" />
      <circle cx="120" cy="96" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="120" cy="126" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="120" cy="156" r="2.4" fill="currentColor" stroke="none" />
    </Art>
  );
}

function SkirtArt(props: ArtProps) {
  return (
    <Art {...props}>
      <path d="M78 60 H162 L186 262 H54 Z" />
      <rect x="78" y="50" width="84" height="16" rx="2" />
      <path d="M120 66 V262" strokeDasharray="5 6" opacity="0.55" />
      <path d="M120 262 V206" />
      <path d="M96 66 L88 262" strokeDasharray="5 6" opacity="0.4" />
      <path d="M54 262 C88 270 152 270 186 262" opacity="0.5" />
      <circle cx="152" cy="58" r="2.2" fill="currentColor" stroke="none" />
    </Art>
  );
}

function TopArt(props: ArtProps) {
  return (
    <Art {...props}>
      <path d="M96 96 C96 86 106 80 120 80 C134 80 144 86 144 96 L150 200 H90 Z" />
      <path d="M96 96 C82 78 62 80 54 96 C46 112 56 126 72 126 L94 118" />
      <path d="M144 96 C158 78 178 80 186 96 C194 112 184 126 168 126 L146 118" />
      <path d="M96 96 C90 102 90 112 94 118" strokeDasharray="4 5" opacity="0.5" />
      <path d="M144 96 C150 102 150 112 146 118" strokeDasharray="4 5" opacity="0.5" />
      <path d="M56 106 C62 114 70 118 78 117" opacity="0.7" />
      <path d="M184 106 C178 114 170 118 162 117" opacity="0.7" />
      <path d="M104 86 C112 100 128 100 136 86" />
      <path d="M90 200 H150" strokeDasharray="5 6" opacity="0.55" />
      <path d="M86 204 C100 210 140 210 154 204" opacity="0.5" />
    </Art>
  );
}

function TrousersArt(props: ArtProps) {
  return (
    <Art {...props}>
      <path d="M92 66 H148 L158 158 L180 262 H124 L120 166 L116 262 H60 L82 158 Z" />
      <rect x="92" y="56" width="56" height="16" rx="2" />
      <path d="M120 72 V166" strokeDasharray="5 6" opacity="0.55" />
      <path d="M100 90 C104 110 104 130 102 150" strokeDasharray="5 6" opacity="0.35" />
      <path d="M140 90 C136 110 136 130 138 150" strokeDasharray="5 6" opacity="0.35" />
      <path d="M60 262 C74 268 100 268 116 262" opacity="0.5" />
      <path d="M124 262 C140 268 166 268 180 262" opacity="0.5" />
    </Art>
  );
}

function HoodieArt(props: ArtProps) {
  return (
    <Art {...props}>
      <path d="M78 92 C78 76 94 66 120 66 C146 66 162 76 162 92 L172 214 H68 Z" />
      <path d="M96 82 C92 38 148 38 144 82" />
      <path d="M106 82 C106 56 134 56 134 82" />
      <path d="M78 96 C64 116 54 134 48 148 C46 156 54 162 62 158 L88 132" />
      <path d="M162 96 C176 116 186 134 192 148 C194 156 186 162 178 158 L152 132" />
      <path d="M48 148 C54 154 60 157 68 155" opacity="0.7" />
      <path d="M192 148 C186 154 180 157 172 155" opacity="0.7" />
      <rect x="96" y="158" width="48" height="36" rx="7" />
      <path d="M112 80 V106 M128 80 V106" />
      <path d="M68 214 H172" strokeDasharray="5 6" opacity="0.55" />
      <path d="M68 218 C100 226 140 226 172 218" opacity="0.5" />
    </Art>
  );
}

function SlipArt(props: ArtProps) {
  return (
    <Art {...props}>
      <path d="M104 112 C104 100 112 94 120 94 C128 94 136 100 136 112 L158 150 L170 262 H70 L82 150 Z" />
      <path d="M104 112 L120 142 L136 112" />
      <path d="M104 112 L96 66" />
      <path d="M136 112 L144 66" />
      <path d="M82 150 C100 158 140 158 158 150" strokeDasharray="5 6" opacity="0.55" />
      <path d="M70 262 C100 270 140 270 170 262" opacity="0.5" />
      <path d="M90 166 C104 196 96 232 82 258" strokeDasharray="5 6" opacity="0.3" />
      <path d="M150 166 C136 196 144 232 158 258" strokeDasharray="5 6" opacity="0.3" />
    </Art>
  );
}

type ArtDefinition = {
  gradient: string;
  color: string;
  Silhouette: (props: ArtProps) => ReactNode;
};

const ART: Record<string, ArtDefinition> = {
  "dress-shirt": {
    gradient: "linear-gradient(145deg, #f7ece1 0%, #ecd3bd 55%, #e0bda2 100%)",
    color: "#8a4a2b",
    Silhouette: DressShirtArt,
  },
  "skirt-slit": {
    gradient: "linear-gradient(145deg, #eff1e8 0%, #dbe2cf 55%, #c4cfb6 100%)",
    color: "#4f5f48",
    Silhouette: SkirtArt,
  },
  "trousers-palazzo": {
    gradient: "linear-gradient(145deg, #f1ede7 0%, #ded6cb 55%, #c9beb0 100%)",
    color: "#5b5147",
    Silhouette: TrousersArt,
  },
  "top-puff": {
    gradient: "linear-gradient(145deg, #fbeef0 0%, #f0d6da 55%, #e3c0c7 100%)",
    color: "#8c4a56",
    Silhouette: TopArt,
  },
  "hoodie-oversize": {
    gradient: "linear-gradient(145deg, #eef1f3 0%, #dbe2e7 55%, #c3cdd4 100%)",
    color: "#46545f",
    Silhouette: HoodieArt,
  },
  "slip-dress": {
    gradient: "linear-gradient(145deg, #f4eef7 0%, #e6daee 55%, #d5c4e2 100%)",
    color: "#66527a",
    Silhouette: SlipArt,
  },
};

const FALLBACK = ART["dress-shirt"];

function getArt(slug: string): ArtDefinition {
  return ART[slug] ?? FALLBACK;
}

export function PatternSilhouette({ slug, className }: { slug: string; className?: string }) {
  const art = getArt(slug);
  const { Silhouette } = art;

  return <Silhouette className={className} style={{ color: art.color }} />;
}

export function PatternCover({ slug, className }: { slug: string; className?: string }) {
  const art = getArt(slug);

  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{ backgroundImage: art.gradient }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 22% 18%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 52%)",
        }}
      />
      <PatternSilhouette
        slug={slug}
        className="relative h-[86%] w-auto drop-shadow-[0_12px_22px_rgba(80,50,30,0.14)]"
      />
    </div>
  );
}
