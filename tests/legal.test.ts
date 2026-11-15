import { describe, expect, it } from "vitest";

import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VALUE, hasCookieConsent } from "@/lib/cookie-consent";
import {
  LEGAL_DISCLAIMER,
  LEGAL_DOC_SLUGS,
  LEGAL_DOCUMENTS,
  getLegalDocument,
  legalDocHref,
} from "@/lib/legal-documents";

describe("правовые документы", () => {
  it("описывает три обязательных документа из FR-9.2", () => {
    expect(LEGAL_DOC_SLUGS).toEqual(["privacy", "terms", "refund"]);

    for (const slug of LEGAL_DOC_SLUGS) {
      const document = LEGAL_DOCUMENTS[slug];

      expect(document.slug).toBe(slug);
      expect(document.title.length).toBeGreaterThan(5);
      expect(document.description.length).toBeGreaterThan(10);
      expect(document.sections.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("не оставляет пустых разделов", () => {
    for (const slug of LEGAL_DOC_SLUGS) {
      for (const section of LEGAL_DOCUMENTS[slug].sections) {
        expect(section.title.trim().length).toBeGreaterThan(0);
        expect(section.paragraphs.length).toBeGreaterThan(0);

        for (const paragraph of section.paragraphs) {
          expect(paragraph.trim().length).toBeGreaterThan(20);
        }

        for (const item of section.list ?? []) {
          expect(item.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("содержит дисклеймер об учебном статусе", () => {
    expect(LEGAL_DISCLAIMER).toMatch(/учебн/i);
    expect(LEGAL_DISCLAIMER).toMatch(/демо|тестов/i);
    expect(LEGAL_DISCLAIMER).toMatch(/деньги не списываются/i);
  });

  it("говорит о мерках в политике и о возврате — в правилах возврата", () => {
    const privacy = LEGAL_DOCUMENTS.privacy.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
    ]);
    expect(privacy.join(" ")).toMatch(/мерк/i);

    const refund = LEGAL_DOCUMENTS.refund.title;
    expect(refund).toMatch(/возврат/i);
    expect(LEGAL_DOCUMENTS.terms.title).toMatch(/оферт/i);
  });

  it("находит документ по slug и строит ссылку", () => {
    expect(getLegalDocument("privacy")?.slug).toBe("privacy");
    expect(getLegalDocument("unknown")).toBeNull();
    expect(getLegalDocument("")).toBeNull();
    expect(legalDocHref("refund")).toBe("/legal/refund");
  });
});

describe("согласие на cookie", () => {
  it("считает согласием только сохранённую отметку", () => {
    expect(COOKIE_CONSENT_KEY).toBe("sewit-cookie-consent");
    expect(COOKIE_CONSENT_VALUE).toBe("accepted");
    expect(hasCookieConsent(COOKIE_CONSENT_VALUE)).toBe(true);
  });

  it("показывает баннер без отметки и при мусоре", () => {
    expect(hasCookieConsent(null)).toBe(false);
    expect(hasCookieConsent(undefined)).toBe(false);
    expect(hasCookieConsent("")).toBe(false);
    expect(hasCookieConsent("declined")).toBe(false);
  });
});
