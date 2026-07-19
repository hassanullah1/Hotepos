import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { vehicleInclude, flattenVehicle } from "@/lib/vehicleSubtypes";

const STATUS_COLORS = {
  AVAILABLE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  RENTED:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  MAINTENANCE:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  OUT_OF_SERVICE:
    "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const ORDER_STATUS_COLORS = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  ACTIVE:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  COMPLETED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

const HIDDEN_DETAIL_KEYS = new Set([
  "id",
  "vehicleId",
  "createdAt",
  "updatedAt",
]);

function formatDetailValue(val) {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (val instanceof Date) return formatDate(val);
  if (typeof val === "object") return "—"; // shouldn't normally happen, but never render raw objects
  return String(val);
}

export default async function VehicleDetailPage({ params }) {
  const { id } = await params;

  const vehicleRaw = await prisma.vehicle.findUnique({
    where: { id },
    include: vehicleInclude(),
  });
  if (!vehicleRaw) notFound();
  const vehicle = flattenVehicle(vehicleRaw);

  const orders = await prisma.order.findMany({
    where: { vehicleId: id },
    include: { client: true, createdBy: { select: { id: true, name: true } } },
    orderBy: { startDate: "desc" },
  });

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F1E30]";
  const labelClass = "text-xs uppercase tracking-wide text-slate-400";
  const valueClass = "text-sm font-medium";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") ||
              vehicle.type}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {vehicle.plateNumber || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/vehicles/${vehicle.id}`}
            className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-white hover:bg-[#16324f] dark:bg-[#2F6690]"
          >
            Edit
          </Link>
          <Link
            href="/admin/vehicles"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-white/10"
          >
            Back
          </Link>
        </div>
      </div>

      {vehicle.images?.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {vehicle.images.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-32 w-32 rounded-lg border border-slate-200 object-cover dark:border-white/10"
            />
          ))}
        </div>
      )}

      <div className={cardClass}>
        <h2 className="mb-4 text-base font-semibold">Vehicle info</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <div className={labelClass}>Type</div>
            <div className={valueClass}>{vehicle.type}</div>
          </div>
          <div>
            <div className={labelClass}>Status</div>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[vehicle.status] || ""}`}
            >
              {vehicle.status}
            </span>
          </div>
          <div>
            <div className={labelClass}>Year</div>
            <div className={valueClass}>{vehicle.year || "—"}</div>
          </div>
          <div>
            <div className={labelClass}>VIN</div>
            <div className={valueClass}>{vehicle.vin || "—"}</div>
          </div>
          <div>
            <div className={labelClass}>Fuel type</div>
            <div className={valueClass}>{vehicle.fuelType || "—"}</div>
          </div>
          <div>
            <div className={labelClass}>Transmission</div>
            <div className={valueClass}>{vehicle.transmission || "—"}</div>
          </div>
          <div>
            <div className={labelClass}>Price / day</div>
            <div className={valueClass}>
              {vehicle.pricePerDay != null ? vehicle.pricePerDay : "—"}
            </div>
          </div>
          <div>
            <div className={labelClass}>Price / hour</div>
            <div className={valueClass}>
              {vehicle.pricePerHour != null ? vehicle.pricePerHour : "—"}
            </div>
          </div>
          <div>
            <div className={labelClass}>Province</div>
            <div className={valueClass}>{vehicle.province?.name || "—"}</div>
          </div>
        </div>
        {vehicle.description && (
          <div className="mt-4">
            <div className={labelClass}>Description</div>
            <p className="mt-1 text-sm">{vehicle.description}</p>
          </div>
        )}
      </div>

      {vehicle.details && Object.keys(vehicle.details).length > 0 && (
        <div className={cardClass}>
          <h2 className="mb-4 text-base font-semibold">Type details</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Object.entries(vehicle.details)
              .filter(([key]) => !HIDDEN_DETAIL_KEYS.has(key))
              .map(([key, val]) => (
                <div key={key}>
                  <div className={labelClass}>{key}</div>
                  <div className={valueClass}>{formatDetailValue(val)}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className={cardClass}>
        <h2 className="mb-4 text-base font-semibold">Owner</h2>
        {vehicle.owner ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className={labelClass}>Name</div>
              <div className={valueClass}>{vehicle.owner.name}</div>
            </div>
            <div>
              <div className={labelClass}>Phone</div>
              <div className={valueClass}>{vehicle.owner.phone || "—"}</div>
            </div>
            <div>
              <div className={labelClass}>Tazkira number</div>
              <div className={valueClass}>
                {vehicle.owner.tazkiraNumber || "—"}
              </div>
            </div>
            <div>
              <div className={labelClass}>Address</div>
              <div className={valueClass}>{vehicle.owner.address || "—"}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No owner assigned.</p>
        )}
      </div>

      <div className={cardClass}>
        <h2 className="mb-4 text-base font-semibold">
          Orders ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-400">
            No rental orders for this vehicle yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Start</th>
                  <th className="py-2 pr-4 font-medium">End</th>
                  <th className="py-2 pr-4 font-medium">Total price</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Created by</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-slate-100 dark:border-white/5"
                  >
                    <td className="py-2 pr-4">{o.client?.name || "—"}</td>
                    <td className="py-2 pr-4">{formatDate(o.startDate)}</td>
                    <td className="py-2 pr-4">{formatDate(o.endDate)}</td>
                    <td className="py-2 pr-4">
                      {o.totalPrice != null ? o.totalPrice : "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status] || ""}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{o.createdBy?.name || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
