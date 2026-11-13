import { createClient } from "@/lib/supabase/server";

/**
 * История заказов покупателя (T-33, FR-6.2).
 *
 * Читается клиентом с cookie: RLS `orders_select_own_or_admin` не отдаст чужой
 * заказ, а `order_items` фильтруется по владельцу заказа.
 */

export interface OrderSummary {
  id: string;
  number: string;
  total: number;
  discount: number;
  status: string;
  createdAt: string;
  itemCount: number;
}

export interface OrderItem {
  id: string;
  title: string;
  sizeLabel: string;
  variantKey: string;
  price: number;
}

export interface OrderDetails {
  id: string;
  number: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  promoCode: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface OrderRow {
  id: string;
  number: string;
  total: number;
  discount: number;
  status: string;
  created_at: string;
  items: { id: string }[] | null;
}

export async function listMyOrders(): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id, number, total, discount, status, created_at, items:order_items(id)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as OrderRow[]).map((row) => ({
    id: row.id,
    number: row.number,
    total: row.total,
    discount: row.discount,
    status: row.status,
    createdAt: row.created_at,
    itemCount: row.items?.length ?? 0,
  }));
}

export async function getMyOrder(id: string): Promise<OrderDetails | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, number, subtotal, discount, total, status, promo_code, created_at")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      number: string;
      subtotal: number;
      discount: number;
      total: number;
      status: string;
      promo_code: string | null;
      created_at: string;
    }>();

  if (error || !order) return null;

  const { data: itemRows } = await supabase
    .from("order_items")
    .select("id, title, size_label, variant_key, price")
    .eq("order_id", id);

  return {
    id: order.id,
    number: order.number,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    status: order.status,
    promoCode: order.promo_code,
    createdAt: order.created_at,
    items: (itemRows ?? []).map((item) => ({
      id: item.id as string,
      title: item.title as string,
      sizeLabel: item.size_label as string,
      variantKey: item.variant_key as string,
      price: item.price as number,
    })),
  };
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  canceled: "Отменён",
  refunded: "Возврат",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
