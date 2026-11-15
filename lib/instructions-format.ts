/**
 * Мини-разметка инструкций пошива (T-45, FR-9.1).
 *
 * `instructions.content_md` в БД — обычный текст с заголовками «##», списками
 * «- » и цитатами «> ». Полноценный markdown-парсер ради этого не нужен:
 * поддерживаем ровно то, что обещаем администратору, и покрываем тестами.
 */

export type InstructionBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "note"; text: string };

const HEADING = /^#{1,3}\s+/;
const LIST_ITEM = /^[-*]\s+/;
const NOTE = /^>\s?/;

/** Убирает простое выделение **жирным**, *курсивом* и `кодом`. */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export function parseInstructionMarkdown(source: string): InstructionBlock[] {
  const blocks: InstructionBlock[] = [];
  let listItems: string[] = [];
  let afterBlankLine = false;

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ kind: "list", items: listItems });
      listItems = [];
    }
  };

  for (const rawLine of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      afterBlankLine = true;
      continue;
    }

    if (LIST_ITEM.test(line)) {
      listItems.push(stripInlineMarkdown(line.replace(LIST_ITEM, "")));
      afterBlankLine = false;
      continue;
    }

    flushList();

    if (HEADING.test(line)) {
      blocks.push({ kind: "heading", text: stripInlineMarkdown(line.replace(HEADING, "")) });
      afterBlankLine = false;
      continue;
    }

    if (NOTE.test(line)) {
      blocks.push({ kind: "note", text: stripInlineMarkdown(line.replace(NOTE, "")) });
      afterBlankLine = false;
      continue;
    }

    const previous = blocks.at(-1);

    if (previous?.kind === "paragraph" && !afterBlankLine) {
      previous.text = `${previous.text} ${stripInlineMarkdown(line)}`;
    } else {
      blocks.push({ kind: "paragraph", text: stripInlineMarkdown(line) });
    }

    afterBlankLine = false;
  }

  flushList();

  return blocks;
}
