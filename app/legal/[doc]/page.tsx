import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_DOC_SLUGS, getLegalDocument, legalDocHref } from "@/lib/legal-documents";

/**
 * Правовые страницы (T-44, FR-9.2): политика ПД, оферта и возврат цифрового
 * товара. Один динамический маршрут вместо трёх почти одинаковых файлов.
 */
export function generateStaticParams() {
  return LEGAL_DOC_SLUGS.map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const document = getLegalDocument(doc);

  if (!document) return { title: "Документ не найден", robots: { index: false } };

  return {
    title: document.title,
    description: document.description,
    alternates: { canonical: legalDocHref(document.slug) },
  };
}

export default async function LegalDocPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const document = getLegalDocument(doc);

  if (!document) notFound();

  return <LegalPageShell document={document} />;
}
