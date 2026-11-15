"use client";

import { Rotate3d } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * 3D-просмотр выкройки (T-43, FR-10.1/FR-10.2).
 *
 * `<model-viewer>` — веб-компонент на three.js, почти мегабайт кода. Поэтому он
 * грузится отдельным чанком только после нажатия: первая отрисовка карточки не
 * платит за 3D, а выкройки без `.glb` вообще не показывают этот блок.
 *
 * Если модель не загрузилась (404, битый файл, нет WebGL), блок не ломает
 * страницу: показываем обложку и текст ошибки, карточка выше остаётся.
 */

type ViewerStatus = "idle" | "loading" | "ready" | "error";

const MODEL_VIEWER_TAG = "model-viewer";

export function Pattern3dViewer({
  modelUrl,
  posterUrl,
  title,
}: {
  /** Публичный URL `.glb` из бакета `models`; допускается путь вида `/models/x.glb`. */
  modelUrl: string;
  /** Обложка для фолбэка: то же фото, что и в галерее. */
  posterUrl?: string | null;
  title: string;
}) {
  const [status, setStatus] = useState<ViewerStatus>("idle");
  const holderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status !== "loading") return;

    let disposed = false;

    const fail = () => {
      if (disposed) return;
      holderRef.current?.replaceChildren();
      setStatus("error");
    };

    void (async () => {
      try {
        // Побочный эффект модуля — регистрация кастомного элемента.
        await import("@google/model-viewer");
      } catch {
        fail();
        return;
      }

      const holder = holderRef.current;

      if (disposed || !holder) return;

      const viewer = document.createElement(MODEL_VIEWER_TAG);

      viewer.className = "block size-full";
      viewer.setAttribute("src", modelUrl);
      viewer.setAttribute("alt", `${title}: интерактивная 3D-модель изделия`);
      viewer.setAttribute("camera-controls", "");
      viewer.setAttribute("auto-rotate", "");
      viewer.setAttribute("auto-rotate-delay", "900");
      viewer.setAttribute("rotation-per-second", "14deg");
      viewer.setAttribute("interaction-prompt", "auto");
      viewer.setAttribute("touch-action", "pan-y");
      viewer.setAttribute("shadow-intensity", "0.7");
      viewer.setAttribute("exposure", "1.05");
      viewer.setAttribute("loading", "eager");

      if (posterUrl) viewer.setAttribute("poster", posterUrl);

      viewer.addEventListener(
        "load",
        () => {
          if (!disposed) setStatus("ready");
        },
        { once: true },
      );
      viewer.addEventListener("error", fail, { once: true });

      holder.replaceChildren(viewer);
    })();

    return () => {
      disposed = true;
    };
  }, [modelUrl, posterUrl, status, title]);

  if (status === "idle") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            <Rotate3d aria-hidden="true" className="size-4 text-primary" />
            3D-просмотр
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Модель загрузится по нажатию: её можно вращать, приближать и рассматривать со всех
            сторон.
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => setStatus("loading")}>
          Открыть 3D
        </Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-4 rounded-2xl border border-line bg-card p-5">
        <div className="overflow-hidden rounded-xl border border-line">
          {posterUrl ? (
            <div className="relative aspect-[4/3] w-full bg-secondary">
              <Image
                src={posterUrl}
                alt={`${title} — фото готового изделия`}
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary px-6 text-center text-sm text-muted-foreground">
              3D-модель не загрузилась — фото изделия осталось выше.
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p role="alert" className="text-xs leading-relaxed text-destructive">
            3D-модель не загрузилась. Возможно, файл ещё не загружен или браузер не
            поддерживает WebGL.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => setStatus("loading")}>
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-line bg-card p-3">
      <div
        ref={holderRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-secondary"
      />

      <p
        className="mt-2 text-center text-xs leading-relaxed text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        {status === "loading"
          ? "Загружаем 3D-модель…"
          : "Потяните модель, чтобы повернуть, и приблизьте колесом мыши."}
      </p>
    </div>
  );
}
