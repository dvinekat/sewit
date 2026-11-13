"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

type FavoriteState = "checking" | "anonymous" | "off" | "on";

/**
 * Кнопка «В избранное» (T-16, FR-6.4).
 *
 * Состояние меняется сразу (optimistic UI), а запрос уходит в Supabase следом;
 * при ошибке возвращаем прежнее значение и показываем текст. Гостю кнопка
 * предлагает войти и возвращает на эту же выкройку.
 */
export function FavoriteButton({
  patternId,
  patternSlug,
}: {
  patternId: string;
  patternSlug: string;
}) {
  const [state, setState] = useState<FavoriteState>(() =>
    hasSupabaseEnv() ? "checking" : "anonymous",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!hasSupabaseEnv()) return;

    let active = true;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setState("anonymous");
        return;
      }

      const { data, error: readError } = await supabase
        .from("favorites")
        .select("pattern_id")
        .eq("user_id", user.id)
        .eq("pattern_id", patternId)
        .maybeSingle();

      if (!active) return;

      setState(readError ? "off" : data ? "on" : "off");
    })();

    return () => {
      active = false;
    };
  }, [patternId]);

  async function toggle() {
    if (pending || state === "checking") return;

    if (state === "anonymous") {
      router.push(`/login?next=${encodeURIComponent(`/patterns/${patternSlug}`)}`);
      return;
    }

    const previous = state;
    const next = state === "on" ? "off" : "on";

    setState(next);
    setPending(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setState("anonymous");
      setPending(false);
      return;
    }

    const { error: writeError } =
      next === "on"
        ? await supabase
            .from("favorites")
            .upsert(
              { user_id: user.id, pattern_id: patternId },
              { onConflict: "user_id,pattern_id" },
            )
        : await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("pattern_id", patternId);

    if (writeError) {
      setState(previous);
      setError("Не удалось обновить избранное. Попробуйте ещё раз.");
    }

    setPending(false);
  }

  const active = state === "on";

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggle}
        disabled={pending}
        aria-pressed={active}
        aria-busy={pending}
        className={cn("w-full gap-2", active && "border-primary/40 bg-primary/5 text-primary")}
      >
        <Heart aria-hidden="true" className={cn("size-4", active && "fill-current")} />
        {state === "checking" ? "Проверяем избранное…" : active ? "В избранном" : "В избранное"}
      </Button>

      {state === "anonymous" ? (
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Войдите, чтобы сохранить выкройку.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
