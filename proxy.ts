import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 переименовал middleware в proxy: файл и экспортируемая функция
 * называются `proxy` (https://nextjs.org/docs/messages/middleware-to-proxy).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Не гоняем проверку сессии через статику и файлы public/.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|og.png|.*\\.(?:svg|png|jpg|jpeg|webp|glb|pdf)$).*)",
  ],
};
