import { describe, expect, it } from "vitest";

import { parseInstructionMarkdown, stripInlineMarkdown } from "@/lib/instructions-format";

describe("разметка инструкции", () => {
  it("разбирает заголовки, абзацы и списки", () => {
    const blocks = parseInstructionMarkdown(
      "## Раскрой\n\nСложите ткань вдвое.\n\n- Деталь спинки\n- Деталь полочки\n\n> Проверьте направление долевой.",
    );

    expect(blocks).toEqual([
      { kind: "heading", text: "Раскрой" },
      { kind: "paragraph", text: "Сложите ткань вдвое." },
      { kind: "list", items: ["Деталь спинки", "Деталь полочки"] },
      { kind: "note", text: "Проверьте направление долевой." },
    ]);
  });

  it("склеивает соседние строки в один абзац", () => {
    const blocks = parseInstructionMarkdown("Первая строка\nвторая строка\n\nНовый абзац");

    expect(blocks).toEqual([
      { kind: "paragraph", text: "Первая строка вторая строка" },
      { kind: "paragraph", text: "Новый абзац" },
    ]);
  });

  it("поддерживает несколько списков подряд и CRLF", () => {
    const blocks = parseInstructionMarkdown("- один\r\n- два\r\n\r\n## Итог");

    expect(blocks).toEqual([
      { kind: "list", items: ["один", "два"] },
      { kind: "heading", text: "Итог" },
    ]);
  });

  it("снимает простое выделение", () => {
    expect(stripInlineMarkdown("**Важно**: не тяните `ткань`")).toBe("Важно: не тяните ткань");
    expect(stripInlineMarkdown("*курсив*")).toBe("курсив");
    expect(parseInstructionMarkdown("- **Стачайте** шов")[0]).toEqual({
      kind: "list",
      items: ["Стачайте шов"],
    });
  });

  it("возвращает пустой список для пустого текста", () => {
    expect(parseInstructionMarkdown("")).toEqual([]);
    expect(parseInstructionMarkdown("\n\n   \n")).toEqual([]);
  });
});
