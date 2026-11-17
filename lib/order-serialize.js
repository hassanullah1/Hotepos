// Shared order fetch shape + serializer.
// Imported by:
//   - app/api/mobileapp/orders/route.js            (GET list, POST create)
//   - app/api/mobileapp/orders/[id]/route.js       (PATCH add items / qty / status)
//   - app/api/mobileapp/orders/[id]/actions/route.js (POST cancel/reject/paid/close)

export const ORDER_INCLUDE = {
  table_sessions: {
    select: {
      id: true,
      status: true,
      dining_tables: { select: { table_number: true } },
    },
  },
  users: { select: { id: true, full_name: true } },
  buyers: { select: { id: true, full_name: true, phone: true } },
  order_items: {
    include: {
      menu_items: { select: { id: true, name: true, image_url: true } },
    },
    orderBy: { created_at: "asc" },
  },
};

export function serializeOrder(o) {
  if (!o) return null;
  const isOnline = o.source === "customer" || o.source === "qr";

  return {
    id: o.id,
    order_number: o.order_number,
    order_type: o.order_type,
    status: o.status,
    payment_status: o.payment_status ?? "unpaid",
    source: o.source ?? "pos",
    is_online: isOnline,

    table_session_id: o.table_session_id,
    table_number: o.table_sessions?.dining_tables?.table_number ?? null,

    waiter_id: o.waiter_id ?? null,
    waiter_name: o.users?.full_name ?? null,

    customer_name: o.buyers?.full_name ?? null,
    customer_phone: o.buyers?.phone ?? null,

    subtotal: String(o.subtotal ?? "0"),
    discount_amount: String(o.discount_amount ?? "0"),
    tax_amount: String(o.tax_amount ?? "0"),
    service_charge: String(o.service_charge ?? "0"),
    total_amount: String(o.total_amount ?? "0"),

    notes: o.notes,
    created_at: o.created_at,
    paid_at: o.paid_at ?? null,

    items: (o.order_items ?? []).map((it) => ({
      id: it.id,
      menu_item_id: it.menu_item_id,
      name: it.menu_items?.name ?? "",
      image_url: it.menu_items?.image_url ?? null,
      quantity: it.quantity,
      unit_price: String(it.unit_price),
      line_total: String(it.line_total),
      notes: it.notes,
      status: it.status,
    })),
  };
}
