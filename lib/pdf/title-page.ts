import fs from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

import type { MeasurementsSnapshot } from "@/lib/orders/measurements-snapshot";

/**
 * Титульный лист PDF (T-36, FR-4.4).
 *
 * Берёт выданный файл лекал и вставляет первой страницей лист с заказом,
 * размером, параметрами, мерками и датой покупки. Шрифт Noto Sans (OFL)
 * лежит в `assets/fonts` и включается в трассировку серверного route.
 */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;

const COLORS = {
  ink: rgb(0.13, 0.11, 0.1),
  muted: rgb(0.42, 0.38, 0.35),
  primary: rgb(0.66, 0.27, 0.12),
  soft: rgb(0.95, 0.91, 0.87),
  line: rgb(0.78, 0.73, 0.68),
};

export interface TitlePageInfo {
  patternTitle: string;
  sizeLabel: string;
  variantLabel: string;
  orderNumber: string;
  purchasedAt: string;
  measurements: MeasurementsSnapshot | null;
}

async function loadFonts(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  const fontDir = path.join(process.cwd(), "assets", "fonts");
  const regular = await fs.readFile(path.join(fontDir, "NotoSans-Regular.ttf"));
  const bold = await fs.readFile(path.join(fontDir, "NotoSans-Bold.ttf"));

  return {
    regular: await pdf.embedFont(regular, { subset: true }),
    bold: await pdf.embedFont(bold, { subset: true }),
  };
}

function wrap(
  text: string,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  size: number,
  maxWidth: number,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

export async function createPersonalizedPdf(
  source: Uint8Array | ArrayBuffer,
  info: TitlePageInfo,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(source);
  const fonts = await loadFonts(pdf);
  const page = pdf.insertPage(0, [PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - 76,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 24,
    color: COLORS.soft,
  });
  page.drawText("SEWIT · ЛЕКАЛА PDF A4", {
    x: MARGIN + 10,
    y: PAGE_HEIGHT - 68,
    size: 9,
    font: fonts.bold,
    color: COLORS.primary,
  });
  page.drawText("Титульный лист заказа", {
    x: PAGE_WIDTH - MARGIN - 140,
    y: PAGE_HEIGHT - 68,
    size: 8,
    font: fonts.regular,
    color: COLORS.muted,
  });

  let y = PAGE_HEIGHT - 128;
  page.drawText("SewIt", { x: MARGIN, y, size: 15, font: fonts.bold, color: COLORS.primary });
  y -= 34;

  for (const line of wrap(info.patternTitle, fonts.bold, 26, PAGE_WIDTH - MARGIN * 2)) {
    page.drawText(line, { x: MARGIN, y, size: 26, font: fonts.bold, color: COLORS.ink });
    y -= 32;
  }

  y -= 4;
  page.drawText(`Размер ${info.sizeLabel}`, {
    x: MARGIN,
    y,
    size: 20,
    font: fonts.bold,
    color: COLORS.primary,
  });
  y -= 22;
  page.drawText(`Вариант: ${info.variantLabel}`, {
    x: MARGIN,
    y,
    size: 10,
    font: fonts.regular,
    color: COLORS.muted,
  });
  y -= 16;
  page.drawText(
    `Заказ ${info.orderNumber} · ${new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(info.purchasedAt))}`,
    { x: MARGIN, y, size: 10, font: fonts.regular, color: COLORS.muted },
  );

  y -= 34;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.7,
    color: COLORS.line,
  });
  y -= 28;

  page.drawText("Ваши мерки", {
    x: MARGIN,
    y,
    size: 12,
    font: fonts.bold,
    color: COLORS.ink,
  });
  y -= 24;

  if (info.measurements) {
    const { bust, waist, hips, height, recommended_size, warnings } = info.measurements;
    const cells = [
      ["ОГ", `${bust} см`],
      ["ОТ", `${waist} см`],
      ["ОБ", `${hips} см`],
      ["Рост", `${height} см`],
    ];

    cells.forEach(([label, value], index) => {
      const x = MARGIN + index * 125;
      page.drawRectangle({
        x,
        y: y - 30,
        width: 118,
        height: 44,
        color: index % 2 === 0 ? COLORS.soft : rgb(0.99, 0.98, 0.96),
        borderColor: COLORS.line,
        borderWidth: 0.5,
      });
      page.drawText(label, {
        x: x + 8,
        y: y - 4,
        size: 7.5,
        font: fonts.regular,
        color: COLORS.muted,
      });
      page.drawText(value, { x: x + 8, y: y - 23, size: 13, font: fonts.bold, color: COLORS.ink });
    });

    y -= 62;
    page.drawText(`Рекомендованный размер: ${recommended_size}`, {
      x: MARGIN,
      y,
      size: 10,
      font: fonts.bold,
      color: COLORS.primary,
    });
    y -= 20;

    if (warnings.length > 0) {
      for (const warning of warnings) {
        page.drawText(`• ${warning.title}`, {
          x: MARGIN,
          y,
          size: 9,
          font: fonts.bold,
          color: COLORS.ink,
        });
        y -= 14;
        for (const line of wrap(
          warning.message,
          fonts.regular,
          8.5,
          PAGE_WIDTH - MARGIN * 2 - 12,
        )) {
          page.drawText(line, {
            x: MARGIN + 12,
            y,
            size: 8.5,
            font: fonts.regular,
            color: COLORS.muted,
          });
          y -= 12;
        }
        y -= 4;
      }
    } else {
      page.drawText("Явных предупреждений по посадке нет.", {
        x: MARGIN,
        y,
        size: 9,
        font: fonts.regular,
        color: COLORS.muted,
      });
      y -= 18;
    }
  } else {
    for (const line of wrap(
      "Мерки не сохранялись в профиле. Размер выбран вручную — проверьте таблицу размеров в карточке выкройки.",
      fonts.regular,
      9,
      PAGE_WIDTH - MARGIN * 2,
    )) {
      page.drawText(line, { x: MARGIN, y, size: 9, font: fonts.regular, color: COLORS.muted });
      y -= 13;
    }
  }

  page.drawRectangle({
    x: MARGIN,
    y: 82,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 58,
    color: COLORS.soft,
    borderColor: COLORS.line,
    borderWidth: 0.5,
  });
  page.drawText("Печать без масштабирования", {
    x: MARGIN + 12,
    y: 118,
    size: 10,
    font: fonts.bold,
    color: COLORS.primary,
  });
  let noteY = 104;
  for (const line of wrap(
    "Печатайте на A4 при 100% и проверьте квадрат 10 × 10 см на странице с тестовым квадратом. Демонстрационный PDF: контуры условные, деньги за заказ не списывались.",
    fonts.regular,
    8,
    PAGE_WIDTH - MARGIN * 2 - 24,
  )) {
    page.drawText(line, {
      x: MARGIN + 12,
      y: noteY,
      size: 8,
      font: fonts.regular,
      color: COLORS.muted,
    });
    noteY -= 10;
  }

  page.drawText(
    `Скачано: ${new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date())}`,
    {
      x: MARGIN,
      y: 36,
      size: 8,
      font: fonts.regular,
      color: COLORS.muted,
    },
  );

  return pdf.save();
}
