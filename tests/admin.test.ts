import { describe, expect, it } from "vitest";

import { hasOrderFilters, orderDateBounds, parseOrderFilter } from "@/lib/admin/order-filter";
import { summarizeSales } from "@/lib/admin/sales";
import {
  promoCreateSchema,
  promoExpiresAt,
  promoExpiryInput,
  promoUpdateSchema,
} from "@/lib/schemas/admin";
import { parseMeasurementsSnapshot } from "@/lib/orders/measurements-snapshot";

const paid = (id: string, total: number, discount = 0) => ({
  id,
  total,
  discount,
  status: "paid",
  createdAt: "2026-11-15T10:00:00.000Z",
});

const item = (orderId: string, patternId: string, title: string, price: number) => ({
  orderId,
  patternId,
  title,
  price,
});

describe("сводка продаж", () => {
  it("не считает возвраты и отмены", () => {
    const summary = summarizeSales(
      [
        paid("o1", 2000),
        { ...paid("o2", 5000), status: "refunded" },
        { ...paid("o3", 7000), status: "canceled" },
      ],
      [item("o1", "p1", "Платье", 2000), item("o2", "p1", "Платье", 5000)],
    );

    expect(summary.orders).toBe(1);
    expect(summary.revenue).toBe(2000);
    expect(summary.items).toBe(1);
    expect(summary.topPatterns).toHaveLength(1);
    expect(summary.topPatterns[0]).toMatchObject({ units: 1, revenue: 2000 });
  });

  it("считает выручку, скидки и средний чек", () => {
    const summary = summarizeSales(
      [paid("o1", 3000, 500), paid("o2", 2000, 0)],
      [item("o1", "p1", "Платье", 3500), item("o2", "p2", "Юбка", 2000)],
    );

    expect(summary.revenue).toBe(5000);
    expect(summary.discounts).toBe(500);
    expect(summary.averageOrder).toBe(2500);
    expect(summary.items).toBe(2);
  });

  it("строит топ по числу продаж, затем по выручке", () => {
    const summary = summarizeSales(
      [paid("o1", 100), paid("o2", 100), paid("o3", 100)],
      [
        item("o1", "p1", "Платье", 100),
        item("o2", "p1", "Платье", 100),
        item("o1", "p2", "Юбка", 150),
        item("o2", "p2", "Юбка", 150),
        item("o3", "p3", "Брюки", 1000),
        item("o3", "p4", "Топ", 500),
      ],
      // увеличиваем лимит, чтобы проверить порядок, а не обрезку
      10,
    );

    // p2 и p1 проданы по два раза, но у p2 больше выручка — она выше.
    expect(summary.topPatterns.map((pattern) => pattern.patternId)).toEqual([
      "p2",
      "p1",
      "p3",
      "p4",
    ]);
    expect(summary.topPatterns[0]).toMatchObject({ units: 2, revenue: 300 });
  });

  it("ограничивает топ тремя позициями", () => {
    const summary = summarizeSales(
      [paid("o1", 400)],
      [
        item("o1", "p1", "A", 100),
        item("o1", "p2", "B", 100),
        item("o1", "p3", "C", 100),
        item("o1", "p4", "D", 100),
      ],
    );

    expect(summary.topPatterns).toHaveLength(3);
  });

  it("возвращает нули без оплаченных заказов", () => {
    const summary = summarizeSales([], []);
    expect(summary).toMatchObject({ orders: 0, revenue: 0, discounts: 0, averageOrder: 0 });
    expect(summary.topPatterns).toEqual([]);
  });
});

describe("фильтр заказов", () => {
  it("понимает статус, период и номер", () => {
    const filter = parseOrderFilter({
      status: "refunded",
      from: "2026-11-01",
      to: "2026-11-15",
      q: " SW-1 ",
    });
    expect(filter).toEqual({ status: "refunded", from: "2026-11-01", to: "2026-11-15", q: "SW-1" });
    expect(hasOrderFilters(filter)).toBe(true);
  });

  it("игнорирует некорректные статусы и даты", () => {
    const filter = parseOrderFilter({
      status: "hacked",
      from: "2026-02-31",
      to: "not-a-date",
    });

    expect(filter).toEqual({ status: "all", from: null, to: null, q: null });
    expect(hasOrderFilters(filter)).toBe(false);
  });

  it("берёт первое значение массива и обрезает поиск", () => {
    const filter = parseOrderFilter({ status: ["paid", "all"], q: "x".repeat(100) });
    expect(filter.status).toBe("paid");
    expect(filter.q).toHaveLength(40);
  });

  it("превращает даты в границы дня", () => {
    expect(orderDateBounds({ from: "2026-11-01", to: "2026-11-15" })).toEqual({
      fromIso: "2026-11-01T00:00:00.000Z",
      toIso: "2026-11-15T23:59:59.999Z",
    });
    expect(orderDateBounds({ from: null, to: null })).toEqual({ fromIso: null, toIso: null });
  });
});

describe("схема промокода", () => {
  const valid = {
    code: " sew10 ",
    percent: "10",
    maxUses: "100",
    expiresAt: "",
    active: "on",
  };

  it("нормализует код и пустой срок", () => {
    const parsed = promoCreateSchema.parse(valid);
    expect(parsed.code).toBe("SEW10");
    expect(parsed.percent).toBe(10);
    expect(parsed.maxUses).toBe(100);
    expect(parsed.expiresAt).toBeNull();
    expect(parsed.active).toBe(true);
  });

  it("выключает промокод без галочки", () => {
    const parsed = promoCreateSchema.parse({ ...valid, active: undefined });
    expect(parsed.active).toBe(false);
  });

  it("не принимает кириллицу и слишком короткий код", () => {
    expect(promoCreateSchema.safeParse({ ...valid, code: "СКИДКА" }).success).toBe(false);
    expect(promoCreateSchema.safeParse({ ...valid, code: "AB" }).success).toBe(false);
  });

  it("держит границы процента и лимита", () => {
    expect(promoCreateSchema.safeParse({ ...valid, percent: "0" }).success).toBe(false);
    expect(promoCreateSchema.safeParse({ ...valid, percent: "101" }).success).toBe(false);
    expect(promoCreateSchema.safeParse({ ...valid, maxUses: "0" }).success).toBe(false);
    expect(promoCreateSchema.safeParse({ ...valid, maxUses: "10.5" }).success).toBe(false);
  });

  it("проверяет дату окончания", () => {
    expect(promoCreateSchema.safeParse({ ...valid, expiresAt: "2026-12-31" }).success).toBe(true);
    expect(promoCreateSchema.safeParse({ ...valid, expiresAt: "31.12.2026" }).success).toBe(false);
    expect(promoCreateSchema.safeParse({ ...valid, expiresAt: "2026-02-31" }).success).toBe(false);
  });

  it("для обновления требует uuid", () => {
    const parsed = promoUpdateSchema.safeParse({
      ...valid,
      id: "a0000000-0000-4000-8000-000000000001",
    });
    expect(parsed.success).toBe(true);
    expect(promoUpdateSchema.safeParse({ ...valid, id: "not-uuid" }).success).toBe(false);
  });

  it("переводит дату в ISO и обратно", () => {
    expect(promoExpiresAt("2026-12-31")).toBe("2026-12-31T23:59:59.000Z");
    expect(promoExpiresAt(null)).toBeNull();
    expect(promoExpiryInput("2026-12-31T23:59:59.000Z")).toBe("2026-12-31");
    expect(promoExpiryInput(null)).toBe("");
  });
});

describe("снапшот мерок в заказе", () => {
  it("читает корректный jsonb и отбрасывает мусор в warnings", () => {
    const snapshot = parseMeasurementsSnapshot({
      bust: "88",
      waist: 70,
      hips: 96,
      height: 168,
      recommended_size: "M",
      alternatives: ["S", 42, "L"],
      warnings: [
        { code: "height", title: "Рост", message: "Выше сетки" },
        "мусор",
        { title: "", message: "" },
      ],
      captured_at: "2026-11-15T10:00:00.000Z",
    });

    expect(snapshot).toMatchObject({
      bust: 88,
      waist: 70,
      hips: 96,
      height: 168,
      recommended_size: "M",
      alternatives: ["S", "L"],
    });
    expect(snapshot?.warnings).toEqual([{ code: "height", title: "Рост", message: "Выше сетки" }]);
  });

  it("возвращает null, если мерок нет", () => {
    expect(parseMeasurementsSnapshot(null)).toBeNull();
    expect(parseMeasurementsSnapshot({ bust: 88 })).toBeNull();
    expect(parseMeasurementsSnapshot("строка")).toBeNull();
  });
});
