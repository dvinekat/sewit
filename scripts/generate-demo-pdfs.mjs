import fs from "node:fs";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

/**
 * Демо-лекала для SewIt (T-C01, T-35).
 *
 * Генерирует A4 PDF для каждой выкройки и размера, кладёт их в приватный бакет
 * `patterns` и обновляет pattern_files. Контуры условные: файл нужен, чтобы
 * проверить печать, тестовую страницу масштаба и выдачу по entitlement.
 */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const CM = 28.3465;

const COLORS = {
  ink: rgb(0.13, 0.11, 0.1),
  muted: rgb(0.42, 0.38, 0.35),
  primary: rgb(0.66, 0.27, 0.12),
  line: rgb(0.78, 0.73, 0.68),
  soft: rgb(0.95, 0.91, 0.87),
  paper: rgb(1, 0.99, 0.97),
};

const LEVELS = {
  1: "Низкая",
  2: "Ниже среднего",
  3: "Средняя",
  4: "Выше среднего",
  5: "Высокая",
};

const fontRegular = fs.readFileSync(path.join("assets", "fonts", "NotoSans-Regular.ttf"));
const fontBold = fs.readFileSync(path.join("assets", "fonts", "NotoSans-Bold.ttf"));

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function wrap(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
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

function drawParagraph(page, text, options) {
  const { x, y, size, font, color, maxWidth, lineHeight = size * 1.45 } = options;
  let cursor = y;

  for (const line of wrap(text, font, size, maxWidth)) {
    page.drawText(line, { x, y: cursor, size, font, color });
    cursor -= lineHeight;
  }

  return cursor;
}

function formatMeters(value) {
  return String(value).replace(".", ",");
}

function drawFooter(page, fonts, slug, size, pageNumber) {
  page.drawLine({
    start: { x: MARGIN, y: 52 },
    end: { x: PAGE_WIDTH - MARGIN, y: 52 },
    thickness: 0.6,
    color: COLORS.line,
  });
  page.drawText(`SewIt · ${slug} · размер ${size}`, {
    x: MARGIN,
    y: 36,
    size: 8,
    font: fonts.regular,
    color: COLORS.muted,
  });
  page.drawText(`${pageNumber} / 4`, {
    x: PAGE_WIDTH - MARGIN - 24,
    y: 36,
    size: 8,
    font: fonts.regular,
    color: COLORS.muted,
  });
}

function drawHeader(page, fonts, label) {
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - 72,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 22,
    color: COLORS.soft,
  });
  page.drawText("SEWIT · ЛЕКАЛА PDF A4", {
    x: MARGIN + 10,
    y: PAGE_HEIGHT - 65,
    size: 8.5,
    font: fonts.bold,
    color: COLORS.primary,
  });
  page.drawText(label, {
    x: PAGE_WIDTH - MARGIN - 10,
    y: PAGE_HEIGHT - 65,
    size: 8,
    font: fonts.regular,
    color: COLORS.muted,
  });
}

function drawCover(page, fonts, pattern, size) {
  drawHeader(page, fonts, "Титульный лист");

  let y = PAGE_HEIGHT - 120;
  page.drawText("SewIt", {
    x: MARGIN,
    y,
    size: 15,
    font: fonts.bold,
    color: COLORS.primary,
  });
  y -= 34;

  for (const line of wrap(pattern.title, fonts.bold, 28, PAGE_WIDTH - MARGIN * 2)) {
    page.drawText(line, { x: MARGIN, y, size: 28, font: fonts.bold, color: COLORS.ink });
    y -= 34;
  }

  y -= 4;
  page.drawText(
    `${pattern.category_title} · уровень ${LEVELS[pattern.level] ?? pattern.level} · ${pattern.sewing_hours} ч`,
    { x: MARGIN, y, size: 10, font: fonts.regular, color: COLORS.muted },
  );

  y -= 34;
  page.drawText(`Размер ${size.label}`, {
    x: MARGIN,
    y,
    size: 22,
    font: fonts.bold,
    color: COLORS.primary,
  });
  y -= 24;
  page.drawText(
    `Рост ${size.height_min}–${size.height_max} см · ткань ${formatMeters(size.fabric_consumption_m)} м при ширине 140–145 см`,
    { x: MARGIN, y, size: 10, font: fonts.regular, color: COLORS.muted },
  );

  const tableX = MARGIN;
  const tableY = y - 44;
  const colWidth = (PAGE_WIDTH - MARGIN * 2) / 3;
  const rows = [
    ["Обхват груди (ОГ)", `${size.bust} см`],
    ["Обхват талии (ОТ)", `${size.waist} см`],
    ["Обхват бёдер (ОБ)", `${size.hips} см`],
    ["Рост", `${size.height_min}–${size.height_max} см`],
    ["Расход ткани", `${formatMeters(size.fabric_consumption_m)} м`],
    ["Формат печати", "A4, без масштабирования"],
  ];

  rows.forEach(([label, value], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = tableX + col * colWidth;
    const cellY = tableY - row * 48;

    page.drawRectangle({
      x,
      y: cellY - 38,
      width: colWidth - 6,
      height: 42,
      color: index % 2 === 0 ? COLORS.soft : COLORS.paper,
      borderColor: COLORS.line,
      borderWidth: 0.5,
    });
    page.drawText(label, {
      x: x + 8,
      y: cellY - 14,
      size: 7.5,
      font: fonts.regular,
      color: COLORS.muted,
    });
    page.drawText(value, {
      x: x + 8,
      y: cellY - 30,
      size: 11,
      font: fonts.bold,
      color: COLORS.ink,
    });
  });

  let cursor = tableY - 2 * 48 - 46;
  page.drawText("Материалы", {
    x: MARGIN,
    y: cursor,
    size: 10,
    font: fonts.bold,
    color: COLORS.ink,
  });
  cursor -= 18;

  for (const material of pattern.materials ?? []) {
    page.drawText(`• ${material}`, {
      x: MARGIN,
      y: cursor,
      size: 9,
      font: fonts.regular,
      color: COLORS.muted,
    });
    cursor -= 14;
  }

  cursor -= 8;
  cursor = drawParagraph(page, `Припуски: ${pattern.allowances}`, {
    x: MARGIN,
    y: cursor,
    size: 9,
    font: fonts.regular,
    color: COLORS.muted,
    maxWidth: PAGE_WIDTH - MARGIN * 2,
    lineHeight: 13,
  });

  page.drawRectangle({
    x: MARGIN,
    y: 78,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 50,
    color: COLORS.soft,
    borderColor: COLORS.line,
    borderWidth: 0.6,
  });
  page.drawText("Демонстрационное лекало SewIt", {
    x: MARGIN + 12,
    y: 108,
    size: 10,
    font: fonts.bold,
    color: COLORS.primary,
  });
  page.drawText("Контуры условные: файл показывает печать, масштаб и выдачу PDF в демо.", {
    x: MARGIN + 12,
    y: 92,
    size: 8,
    font: fonts.regular,
    color: COLORS.muted,
  });

  drawFooter(page, fonts, pattern.slug, size.label, 1);
}

function drawScalePage(page, fonts, pattern, size) {
  drawHeader(page, fonts, "Контроль печати");

  page.drawText("Проверка масштаба", {
    x: MARGIN,
    y: PAGE_HEIGHT - 120,
    size: 20,
    font: fonts.bold,
    color: COLORS.ink,
  });
  drawParagraph(
    page,
    "Печатайте на A4 без масштабирования (100%, «Реальный размер»). Квадрат ниже должен получиться 10 × 10 см с точностью до 2 мм.",
    {
      x: MARGIN,
      y: PAGE_HEIGHT - 146,
      size: 9,
      font: fonts.regular,
      color: COLORS.muted,
      maxWidth: PAGE_WIDTH - MARGIN * 2,
      lineHeight: 13,
    },
  );

  const squareSize = 10 * CM;
  const x = (PAGE_WIDTH - squareSize) / 2;
  const y = PAGE_HEIGHT - 260 - squareSize;

  page.drawRectangle({
    x,
    y,
    width: squareSize,
    height: squareSize,
    borderColor: COLORS.primary,
    borderWidth: 1.2,
  });
  page.drawText("10 см", {
    x: x + squareSize / 2 - 18,
    y: y - 16,
    size: 9,
    font: fonts.bold,
    color: COLORS.primary,
  });
  page.drawText("10 см", {
    x: x - 38,
    y: y + squareSize / 2 - 3,
    size: 9,
    font: fonts.bold,
    color: COLORS.primary,
  });

  page.drawText("Если квадрат меньше или больше — проверьте настройки принтера.", {
    x: MARGIN,
    y: y - 46,
    size: 9,
    font: fonts.regular,
    color: COLORS.muted,
  });

  drawFooter(page, fonts, pattern.slug, size.label, 2);
}

function drawPatternPage(page, fonts, pattern, size) {
  drawHeader(page, fonts, "Лист лекал");

  page.drawText("Лист лекал", {
    x: MARGIN,
    y: PAGE_HEIGHT - 110,
    size: 18,
    font: fonts.bold,
    color: COLORS.ink,
  });

  const areaX = MARGIN;
  const areaY = 100;
  const areaWidth = PAGE_WIDTH - MARGIN * 2;
  const areaHeight = PAGE_HEIGHT - 180;

  page.drawRectangle({
    x: areaX,
    y: areaY,
    width: areaWidth,
    height: areaHeight,
    borderColor: COLORS.line,
    borderWidth: 0.7,
  });

  for (let gx = areaX + CM; gx < areaX + areaWidth; gx += CM) {
    page.drawLine({
      start: { x: gx, y: areaY },
      end: { x: gx, y: areaY + areaHeight },
      thickness: 0.3,
      color: rgb(0.9, 0.87, 0.84),
    });
  }
  for (let gy = areaY + CM; gy < areaY + areaHeight; gy += CM) {
    page.drawLine({
      start: { x: areaX, y: gy },
      end: { x: areaX + areaWidth, y: gy },
      thickness: 0.3,
      color: rgb(0.9, 0.87, 0.84),
    });
  }

  const cx = areaX + areaWidth / 2;
  const top = areaY + areaHeight - 50;
  const isTrousers = pattern.category_slug === "trousers";
  const isSkirt = pattern.category_slug === "skirts";

  page.drawLine({
    start: { x: cx, y: areaY + 40 },
    end: { x: cx, y: areaY + areaHeight - 20 },
    thickness: 0.8,
    color: COLORS.primary,
    dashArray: [6, 5],
  });

  if (isSkirt) {
    page.drawLine({
      start: { x: cx - 90, y: top },
      end: { x: cx - 110, y: areaY + 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 90, y: top },
      end: { x: cx + 110, y: areaY + 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 110, y: areaY + 70 },
      end: { x: cx + 110, y: areaY + 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 90, y: top },
      end: { x: cx + 90, y: top },
      thickness: 2,
      color: COLORS.ink,
    });
  } else if (isTrousers) {
    page.drawLine({
      start: { x: cx - 95, y: top },
      end: { x: cx - 105, y: areaY + 65 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 20, y: top },
      end: { x: cx - 20, y: areaY + 150 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 20, y: top },
      end: { x: cx + 20, y: areaY + 150 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 95, y: top },
      end: { x: cx + 105, y: areaY + 65 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 105, y: areaY + 65 },
      end: { x: cx - 20, y: areaY + 65 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 20, y: areaY + 65 },
      end: { x: cx + 105, y: areaY + 65 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 20, y: top },
      end: { x: cx - 20, y: areaY + 150 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 20, y: top },
      end: { x: cx + 20, y: areaY + 150 },
      thickness: 1.4,
      color: COLORS.ink,
    });
  } else {
    page.drawLine({
      start: { x: cx - 80, y: top },
      end: { x: cx - 120, y: top - 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 80, y: top },
      end: { x: cx + 120, y: top - 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 120, y: top - 70 },
      end: { x: cx - 70, y: top - 120 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 120, y: top - 70 },
      end: { x: cx + 70, y: top - 120 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 70, y: top - 120 },
      end: { x: cx - 95, y: areaY + 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx + 70, y: top - 120 },
      end: { x: cx + 95, y: areaY + 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
    page.drawLine({
      start: { x: cx - 95, y: areaY + 70 },
      end: { x: cx + 95, y: areaY + 70 },
      thickness: 1.4,
      color: COLORS.ink,
    });
  }

  page.drawText("Сгиб ткани", {
    x: cx + 6,
    y: areaY + areaHeight - 40,
    size: 7,
    font: fonts.regular,
    color: COLORS.primary,
  });
  page.drawText("Долевая нить", {
    x: cx + 6,
    y: areaY + 120,
    size: 7,
    font: fonts.regular,
    color: COLORS.muted,
  });
  page.drawText(`Припуски уже включены · размер ${size.label}`, {
    x: areaX + 10,
    y: areaY + 12,
    size: 7.5,
    font: fonts.regular,
    color: COLORS.muted,
  });

  drawFooter(page, fonts, pattern.slug, size.label, 3);
}

function drawInstructionPage(page, fonts, pattern, size) {
  drawHeader(page, fonts, "Инструкция");

  page.drawText("Как сшить", {
    x: MARGIN,
    y: PAGE_HEIGHT - 118,
    size: 20,
    font: fonts.bold,
    color: COLORS.ink,
  });

  const steps = [
    [
      "1. Подготовка",
      "Постирайте и отутюжьте ткань. Сложите по долевой, разложите детали с учётом направления рисунка.",
    ],
    [
      "2. Раскрой",
      `Вырежьте детали размера ${size.label}, оставляя припуски по разметке: ${pattern.allowances}`,
    ],
    [
      "3. Пошив",
      "Сметайте плечевые и боковые швы, примерьте. Стачайте, обработайте срезы, втачайте рукава или пояс.",
    ],
    [
      "4. Финиш",
      "Подшейте низ, отпарьте швы. Проверьте посадку и при необходимости скорректируйте длину.",
    ],
  ];

  let y = PAGE_HEIGHT - 160;
  for (const [title, body] of steps) {
    page.drawText(title, {
      x: MARGIN,
      y,
      size: 12,
      font: fonts.bold,
      color: COLORS.primary,
    });
    y -= 18;
    y = drawParagraph(page, body, {
      x: MARGIN,
      y,
      size: 9,
      font: fonts.regular,
      color: COLORS.muted,
      maxWidth: PAGE_WIDTH - MARGIN * 2,
      lineHeight: 14,
    });
    y -= 18;
  }

  page.drawRectangle({
    x: MARGIN,
    y: 100,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 74,
    color: COLORS.soft,
    borderColor: COLORS.line,
    borderWidth: 0.5,
  });
  drawParagraph(
    page,
    "Расход ткани указан при ширине 140–145 см. Перед раскроем проверьте тестовый квадрат на второй странице: он должен быть ровно 10 × 10 см.",
    {
      x: MARGIN + 12,
      y: 150,
      size: 8.5,
      font: fonts.regular,
      color: COLORS.muted,
      maxWidth: PAGE_WIDTH - MARGIN * 2 - 24,
      lineHeight: 12,
    },
  );

  drawFooter(page, fonts, pattern.slug, size.label, 4);
}

async function buildPdf(pattern, size) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const regular = await pdf.embedFont(fontRegular, { subset: true });
  const bold = await pdf.embedFont(fontBold, { subset: true });
  const fonts = { regular, bold };

  pdf.setTitle(`SewIt — ${pattern.title}, размер ${size.label}`);
  pdf.setAuthor("SewIt");
  pdf.setSubject(`Демонстрационное лекало ${pattern.slug}, размер ${size.label}`);
  pdf.setCreator("SewIt demo generator");

  for (const draw of [drawCover, drawScalePage, drawPatternPage, drawInstructionPage]) {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    draw(page, fonts, pattern, size);
  }

  return Buffer.from(await pdf.save());
}

async function main() {
  const supabase = client();
  const { data: patterns, error } = await supabase
    .from("patterns")
    .select(
      "id, slug, title, description, level, sewing_hours, fabric_note, materials, allowances, category:categories!inner(slug, title), sizes:pattern_sizes(id, label, bust, waist, hips, height_min, height_max, fabric_consumption_m)",
    )
    .order("created_at");

  if (error) throw new Error(error.message);

  const bucket = await supabase.storage.getBucket("patterns");
  if (bucket.error) {
    const created = await supabase.storage.createBucket("patterns", {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (created.error) throw new Error(created.error.message);
  }

  let uploaded = 0;
  let rows = 0;

  for (const pattern of patterns ?? []) {
    const category = Array.isArray(pattern.category) ? pattern.category[0] : pattern.category;
    const shaped = {
      ...pattern,
      category_slug: category.slug,
      category_title: category.title,
      sizes: [...pattern.sizes].sort((a, b) => Number(a.label) - Number(b.label)),
    };

    for (const size of shaped.sizes) {
      const bytes = await buildPdf(shaped, size);
      const storagePath = `patterns/${pattern.slug}/${size.label}/base.pdf`;

      const upload = await supabase.storage
        .from("patterns")
        .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });

      if (upload.error) throw new Error(`${storagePath}: ${upload.error.message}`);
      uploaded += 1;

      const upsert = await supabase.from("pattern_files").upsert(
        {
          pattern_id: pattern.id,
          size_id: size.id,
          variant_key: "none",
          format: "pdf_a4",
          storage_path: storagePath,
          pages: 4,
        },
        { onConflict: "pattern_id,size_id,variant_key,format" },
      );

      if (upsert.error) throw new Error(`${storagePath} db: ${upsert.error.message}`);
      rows += 1;

      console.log(`ok ${storagePath} (${Math.round(bytes.length / 1024)} КБ)`);
    }
  }

  console.log(`\nГотово: ${uploaded} PDF, ${rows} строк pattern_files`);
}

await main();
