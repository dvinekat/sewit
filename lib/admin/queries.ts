import { orderDateBounds, type AdminOrderFilter } from "@/lib/admin/order-filter";
import { summarizeSales, type SalesSummary } from "@/lib/admin/sales";
import { createClient } from "@/lib/supabase/server";

/**
 * Чтение данных админки (T-38, T-41, T-42).
 *
 * Запросы идут клиентом сессии: RLS `is_admin()` открывает администратору чужие
 * заказы, профили и промокоды, а роль проверяет страница/экшен. Для списков
 * с покупателями делается второй запрос в `profiles`, потому что `orders.user_id`
 * ссылается на `auth.users`, а не на профиль — PostgREST не умеет join напрямую.
 */

export interface AdminBuyer {
  email: string | null;
  name: string | null;
}

export interface AdminOrderSummary {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
  createdAt: string;
  itemCount: number;
  /** null — аккаунт покупателя удалён (FR-6.5), заказ остался обезличенным. */
  buyer: AdminBuyer | null;
}

export interface AdminOrderItem {
  id: string;
  title: string;
  sizeLabel: string;
  variantKey: string;
  price: number;
  patternId: string;
}

export interface AdminOrderDetails extends AdminOrderSummary {
  items: AdminOrderItem[];
  measurementsSnapshot: unknown;
}

export interface AdminDashboard {
  published: number;
  drafts: number;
  orders: number;
  revenue: number;
  activePromos: number;
  recent: AdminOrderSummary[];
}

export interface AdminPromo {
  id: string;
  code: string;
  percent: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  /** Срок уже прошёл: считает слой данных, а не рендер. */
  expired: boolean;
}

interface OrderRow {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  promo_code: string | null;
  created_at: string;
  user_id: string | null;
  items: { id: string }[] | null;
}

const ORDERS_SELECT = `
  id, number, status, subtotal, discount, total, promo_code, created_at, user_id,
  items:order_items (id)
`;

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;

  const time = new Date(expiresAt).getTime();
  return Number.isFinite(time) && time < Date.now();
}

async function buyersById(ids: string[]): Promise<Map<string, AdminBuyer>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, email, name").in("id", unique);

  return new Map(
    (data ?? []).map((row) => [
      row.id as string,
      { email: (row.email as string | null) ?? null, name: (row.name as string | null) ?? null },
    ]),
  );
}

function mapOrderRow(row: OrderRow, buyers: Map<string, AdminBuyer>): AdminOrderSummary {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    promoCode: row.promo_code,
    createdAt: row.created_at,
    itemCount: row.items?.length ?? 0,
    buyer: row.user_id ? (buyers.get(row.user_id) ?? null) : null,
  };
}

/** Заказы с фильтром по статусу, периоду и номеру (FR-8.4). */
export async function listAdminOrders(
  filter: AdminOrderFilter,
  limit = 100,
): Promise<AdminOrderSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(ORDERS_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter.status !== "all") query = query.eq("status", filter.status);

  const { fromIso, toIso } = orderDateBounds(filter);
  if (fromIso) query = query.gte("created_at", fromIso);
  if (toIso) query = query.lte("created_at", toIso);
  if (filter.q) query = query.ilike("number", `%${filter.q}%`);

  const { data, error } = await query;

  if (error || !data) {
    console.error("[admin] orders list", error);
    return [];
  }

  const rows = data as unknown as OrderRow[];
  const buyers = await buyersById(rows.flatMap((row) => (row.user_id ? [row.user_id] : [])));

  return rows.map((row) => mapOrderRow(row, buyers));
}

/** Один заказ с составом и снапшотом мерок (карточка заказа, FR-8.4). */
export async function getAdminOrder(id: string): Promise<AdminOrderDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`${ORDERS_SELECT}, measurements_snapshot`)
    .eq("id", id)
    .maybeSingle<OrderRow & { measurements_snapshot: unknown }>();

  if (error || !data) return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("id, title, size_label, variant_key, price, pattern_id")
    .eq("order_id", id);

  const buyers = await buyersById(data.user_id ? [data.user_id] : []);

  return {
    ...mapOrderRow(data, buyers),
    measurementsSnapshot: data.measurements_snapshot,
    items: (items ?? []).map((item) => ({
      id: item.id as string,
      title: item.title as string,
      sizeLabel: item.size_label as string,
      variantKey: item.variant_key as string,
      price: item.price as number,
      patternId: item.pattern_id as string,
    })),
  };
}

/** Счётчики дашборда: каталог, заказы, выручка и последние покупки (T-38). */
export async function getAdminDashboard(): Promise<AdminDashboard> {
  const supabase = await createClient();

  const [published, drafts, orders, paidOrders, promos, recent] = await Promise.all([
    supabase
      .from("patterns")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase.from("patterns").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total").eq("status", "paid"),
    supabase.from("promo_codes").select("id", { count: "exact", head: true }).eq("active", true),
    listAdminOrders({ status: "all", from: null, to: null, q: null }, 5),
  ]);

  const revenue = (paidOrders.data ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);

  return {
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    orders: orders.count ?? 0,
    revenue,
    activePromos: promos.count ?? 0,
    recent,
  };
}

/** Промокоды целиком (FR-8.6): админ видит лимиты и использование. */
export async function listPromoCodes(): Promise<AdminPromo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("id, code, percent, max_uses, used_count, expires_at, active, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[admin] promo list", error);
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    code: row.code as string,
    percent: Number(row.percent),
    maxUses: Number(row.max_uses),
    usedCount: Number(row.used_count),
    expiresAt: (row.expires_at as string | null) ?? null,
    active: Boolean(row.active),
    createdAt: row.created_at as string,
    expired: isExpired(row.expires_at as string | null),
  }));
}

export async function getPromo(id: string): Promise<AdminPromo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("id, code, percent, max_uses, used_count, expires_at, active, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    code: data.code as string,
    percent: Number(data.percent),
    maxUses: Number(data.max_uses),
    usedCount: Number(data.used_count),
    expiresAt: (data.expires_at as string | null) ?? null,
    active: Boolean(data.active),
    createdAt: data.created_at as string,
    expired: isExpired(data.expires_at as string | null),
  };
}

export type SalesRange = "30" | "90" | "all";

const RANGE_DAYS: Record<Exclude<SalesRange, "all">, number> = { "30": 30, "90": 90 };

/** Сводка продаж за период (FR-8.5): только оплаченные заказы. */
export async function getSalesSummary(range: SalesRange): Promise<SalesSummary> {
  const supabase = await createClient();
  let query = supabase.from("orders").select("id, total, discount, status, created_at");

  if (range !== "all") {
    const since = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
    query = query.gte("created_at", since.toISOString());
  }

  const { data: orders, error } = await query;

  if (error || !orders) {
    console.error("[admin] sales orders", error);
    return summarizeSales([], []);
  }

  const paidIds = orders.filter((row) => row.status === "paid").map((row) => row.id as string);
  let items: { order_id: string; pattern_id: string; title: string; price: number }[] = [];

  if (paidIds.length > 0) {
    const { data, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, pattern_id, title, price")
      .in("order_id", paidIds);

    if (itemsError) console.error("[admin] sales items", itemsError);
    items = data ?? [];
  }

  return summarizeSales(
    orders.map((row) => ({
      id: row.id as string,
      total: Number(row.total),
      discount: Number(row.discount),
      status: String(row.status),
      createdAt: String(row.created_at),
    })),
    items.map((row) => ({
      orderId: row.order_id as string,
      patternId: row.pattern_id as string,
      title: row.title as string,
      price: Number(row.price),
    })),
  );
}
