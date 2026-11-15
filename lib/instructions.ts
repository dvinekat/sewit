import { createPublicClient } from "@/lib/supabase/public";

/**
 * Инструкция пошива из БД (T-45, FR-9.1).
 *
 * Читается публичным клиентом: RLS `instructions_select_published_or_admin`
 * отдаёт текст только к опубликованной выкройке. Если строки нет, страница
 * покажет базовый порядок пошива — так инструкция доступна у любой модели.
 */
export interface PatternInstruction {
  contentMd: string;
  videoUrl: string | null;
}

interface InstructionRow {
  content_md: string;
  video_url: string | null;
}

export async function getPatternInstruction(patternId: string): Promise<PatternInstruction | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("instructions")
      .select("content_md, video_url")
      .eq("pattern_id", patternId)
      .maybeSingle<InstructionRow>();

    if (error) {
      console.warn(`[инструкция] не удалось прочитать текст: ${error.message}`);
      return null;
    }

    if (!data) return null;

    return { contentMd: data.content_md, videoUrl: data.video_url ?? null };
  } catch (error) {
    console.warn("[инструкция] Supabase недоступен", error);
    return null;
  }
}
