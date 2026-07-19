import { enumToSlug, DETAIL_RELATION } from "./vehicleTypeMap";

function getTypeDetail(vehicle) {
  const relation = DETAIL_RELATION[vehicle.type];
  return relation ? vehicle[relation] : null;
}

export function getCapacityValue(vehicle) {
  const detail = getTypeDetail(vehicle);
  if (!detail) return 0;
  switch (vehicle.type) {
    case "TAXI":
      return detail.seats ?? 0;
    case "DUMP_TRUCK":
      return detail.payloadWeight ?? detail.bedCapacity ?? 0;
    case "TANKER":
      return detail.tankCapacity ?? 0;
    case "EXCAVATOR":
      return detail.bucketCapacity ?? 0;
    case "BODY_TRUCK":
      return detail.maxPayload ?? 0;
    default:
      return 0;
  }
}

// Lightweight card/list shape — only ever carries the FIRST image.
export function serializeVehicleListItem(vehicle) {
  const detail = getTypeDetail(vehicle);
  return {
    id: vehicle.id,
    type: enumToSlug(vehicle.type),
    name: [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Vehicle",
    image: vehicle.images?.[0] ?? null,
    ac: detail?.ac ?? null,
    transmission: vehicle.transmission,
    fuel: vehicle.fuelType,
    pricePerDay: vehicle.pricePerDay,
    capacityValue: getCapacityValue(vehicle),
    // owner intentionally not included — do not add it here
  };
}

// Detail shape — still only the first image; the rest are fetched on demand
// via /api/vehicles/[id]/images, never bundled into this payload.
export function serializeVehicleDetail(vehicle) {
  const detail = getTypeDetail(vehicle);
  return {
    id: vehicle.id,
    type: enumToSlug(vehicle.type),
    name: [vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Vehicle",
    year: vehicle.year,
    description: vehicle.description,
    image: vehicle.images?.[0] ?? null,
    imageCount: vehicle.imageCount ?? vehicle.images?.length ?? 0,
    ac: detail?.ac ?? null,
    transmission: vehicle.transmission,
    fuel: vehicle.fuelType,
    pricePerDay: vehicle.pricePerDay,
    pricePerHour: vehicle.pricePerHour,
    specs: buildSpecs(vehicle.type, detail),
    // owner intentionally not included — do not add it here
  };
}

function buildSpecs(type, detail) {
  if (!detail) return [];
  switch (type) {
    case "TAXI":
      return [
        { label: "Seats", value: detail.seats },
        { label: "Luggage", value: detail.luggageCapacity },
        { label: "License class", value: detail.licenseClass },
        { label: "Color", value: detail.color },
      ];
    case "DUMP_TRUCK":
      return [
        { label: "Bed type", value: detail.bedType },
        { label: "Bed capacity", value: detail.bedCapacity ? `${detail.bedCapacity} ${detail.capacityUnit ?? ""}` : null },
        { label: "Payload weight", value: detail.payloadWeight },
        { label: "Axles", value: detail.axleCount },
        { label: "Dump angle", value: detail.dumpAngle },
        { label: "GVWR", value: detail.gvwr },
      ];
    case "TANKER":
      return [
        { label: "Tank capacity", value: detail.tankCapacity ? `${detail.tankCapacity} ${detail.capacityUnit ?? ""}` : null },
        { label: "Material", value: detail.tankMaterial },
        { label: "Compartments", value: detail.compartments },
        { label: "Insulated", value: detail.insulated ? "Yes" : "No" },
        { label: "Pump type", value: detail.pumpType },
        { label: "Liquid type", value: detail.liquidType },
      ];
    case "EXCAVATOR":
      return [
        { label: "Boom length", value: detail.boomLength },
        { label: "Bucket capacity", value: detail.bucketCapacity },
        { label: "Digging depth", value: detail.diggingDepth },
        { label: "Operating weight", value: detail.operatingWeight },
        { label: "Track type", value: detail.trackType },
        { label: "Engine HP", value: detail.engineHP },
      ];
    case "BODY_TRUCK":
      return [
        { label: "Body type", value: detail.bodyType },
        { label: "Cargo (L×W×H)", value: `${detail.cargoLength ?? "-"} × ${detail.cargoWidth ?? "-"} × ${detail.cargoHeight ?? "-"}` },
        { label: "Max payload", value: detail.maxPayload },
        { label: "Liftgate", value: detail.hasLiftgate ? "Yes" : "No" },
        { label: "Refrigerated", value: detail.refrigerated ? "Yes" : "No" },
      ];
    default:
      return [];
  }
}
