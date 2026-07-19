// Central place describing how each VehicleType maps to its Prisma
// one-to-one subtype relation. Add a new vehicle type by adding one
// entry here + a matching model in schema.prisma — the API and the
// admin form both read from this map, nothing else needs to change.

export const VEHICLE_TYPES = [
  "DUMP_TRUCK",
  "TANKER",
  "EXCAVATOR",
  "TAXI",
  "BODY_TRUCK",
];

export const SUBTYPE_CONFIG = {
  DUMP_TRUCK: {
    relation: "dumpTruck",
    fields: {
      bedType: "string",
      bedCapacity: "float",
      capacityUnit: "string",
      payloadWeight: "float",
      axleCount: "int",
      dumpAngle: "float",
      gvwr: "float",
    },
  },
  TANKER: {
    relation: "tanker",
    fields: {
      tankCapacity: "float",
      capacityUnit: "string",
      tankMaterial: "string",
      compartments: "int",
      insulated: "boolean",
      pumpType: "string",
      liquidType: "string",
    },
  },
  EXCAVATOR: {
    relation: "excavator",
    fields: {
      boomLength: "float",
      bucketCapacity: "float",
      diggingDepth: "float",
      operatingWeight: "float",
      trackType: "string",
      engineHP: "float",
    },
  },
  TAXI: {
    relation: "taxi",
    fields: {
      seats: "int",
      luggageCapacity: "int",
      hasMeter: "boolean",
      licenseClass: "string",
      ac: "boolean",
      color: "string",
    },
  },
  BODY_TRUCK: {
    relation: "bodyTruck",
    fields: {
      bodyType: "string",
      cargoLength: "float",
      cargoWidth: "float",
      cargoHeight: "float",
      maxPayload: "float",
      hasLiftgate: "boolean",
      refrigerated: "boolean",
    },
  },
};

const ALL_RELATIONS = Object.values(SUBTYPE_CONFIG).map((c) => c.relation);

// Coerce raw form values (always strings/booleans from JSON) into the
// right JS type for Prisma, dropping empty values so optional fields
// stay null instead of becoming NaN / "".
function coerceSubtypeData(type, raw = {}) {
  const config = SUBTYPE_CONFIG[type];
  if (!config) return {};
  const data = {};
  for (const [key, kind] of Object.entries(config.fields)) {
    const value = raw[key];
    if (value === undefined || value === null || value === "") continue;
    if (kind === "float") data[key] = parseFloat(value);
    else if (kind === "int") data[key] = parseInt(value, 10);
    else if (kind === "boolean") data[key] = Boolean(value);
    else data[key] = String(value);
  }
  return data;
}

// Builds the Prisma `include` object that pulls in whichever subtype
// relation is present for a vehicle.
export function vehicleInclude() {
  return {
    province: true,
    dumpTruck: true,
    tanker: true,
    excavator: true,
    taxi: true,
    bodyTruck: true,
  };
}

// Builds the nested `create` payload for POST /api/vehicles.
export function buildSubtypeCreate(type, raw) {
  const config = SUBTYPE_CONFIG[type];
  if (!config) return {};
  return { [config.relation]: { create: coerceSubtypeData(type, raw) } };
}

// Builds the nested write for PUT /api/vehicles/[id]: makes sure only
// the subtype matching the (possibly new) type exists, deleting any
// stale subtype rows left over from a previous type.
export function buildSubtypeUpdate(type, raw, existingRelations) {
  const config = SUBTYPE_CONFIG[type];
  const nested = {};

  for (const relation of ALL_RELATIONS) {
    const isTarget = config && config.relation === relation;
    const existed = Boolean(existingRelations[relation]);
    if (isTarget) {
      const data = coerceSubtypeData(type, raw);
      nested[relation] = existed ? { update: data } : { create: data };
    } else if (existed) {
      nested[relation] = { delete: true };
    }
  }
  return nested;
}

// Flattens whichever subtype relation is populated on a fetched
// vehicle into a single `details` object for the frontend.
export function flattenVehicle(vehicle) {
  const config = SUBTYPE_CONFIG[vehicle.type];
  const details = (config && vehicle[config.relation]) || null;
  const { dumpTruck, tanker, excavator, taxi, bodyTruck, ...base } = vehicle;
  return { ...base, details };
}
