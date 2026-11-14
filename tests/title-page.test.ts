import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";

import type { MeasurementsSnapshot } from "@/lib/orders/measurements-snapshot";
import { createPersonalizedPdf } from "@/lib/pdf/title-page";

async function sourcePdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("Pattern sheet", { x: 40, y: 800, size: 12, font });
  pdf.setTitle("SewIt — исходное лекало");

  return pdf.save();
}

const measurements: MeasurementsSnapshot = {
  bust: 96,
  waist: 78,
  hips: 104,
  height: 166,
  recommended_size: "48",
  alternatives: ["50", "46"],
  warnings: [],
  captured_at: "2026-11-14T00:00:00.000Z",
};

describe("титульный лист PDF", () => {
  it("вставляет первую страницу и сохраняет метаданные исходника", async () => {
    const result = await createPersonalizedPdf(await sourcePdf(), {
      patternTitle: "Платье-рубашка",
      sizeLabel: "48",
      variantLabel: "Midi · Короткий",
      orderNumber: "SW-20261114-0001",
      purchasedAt: "2026-11-14T00:00:00.000Z",
      measurements: null,
    });

    const pdf = await PDFDocument.load(result);

    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getTitle()).toBe("SewIt — исходное лекало");
    expect(result.byteLength).toBeGreaterThan(1000);
  });

  it("рисует мерки и рекомендацию, когда снапшот есть", async () => {
    const result = await createPersonalizedPdf(await sourcePdf(), {
      patternTitle: "Платье-рубашка",
      sizeLabel: "48",
      variantLabel: "Midi · Короткий",
      orderNumber: "SW-20261114-0001",
      purchasedAt: "2026-11-14T00:00:00.000Z",
      measurements,
    });

    expect(result.byteLength).toBeGreaterThan(5000);
  });
});
