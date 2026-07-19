// Keep this the ONLY place slug <-> enum conversion happens.
// Slugs match the links already used on the homepage (/taxi, /truck, /dump-truck, /tanker, /loader).
export const TYPE_MAP = {
  taxi: "TAXI",
  loader: "EXCAVATOR",
  tanker: "TANKER",
  truck: "BODY_TRUCK",
  "dump-truck": "DUMP_TRUCK",
};

export const REVERSE_TYPE_MAP = Object.fromEntries(
  Object.entries(TYPE_MAP).map(([slug, enumVal]) => [enumVal, slug]),
);

export function slugToEnum(slug) {
  return TYPE_MAP[slug] || null;
}

export function enumToSlug(enumVal) {
  return REVERSE_TYPE_MAP[enumVal] || null;
}

// Which related table holds type-specific fields (incl. capacity + ac)
export const DETAIL_RELATION = {
  TAXI: "taxi",
  DUMP_TRUCK: "dumpTruck",
  TANKER: "tanker",
  EXCAVATOR: "excavator",
  BODY_TRUCK: "bodyTruck",
};

// Which field on that related table represents "capacity" for filtering
export const CAPACITY_FIELD = {
  TAXI: "seats",
  DUMP_TRUCK: "payloadWeight",
  TANKER: "tankCapacity",
  EXCAVATOR: "bucketCapacity",
  BODY_TRUCK: "maxPayload",
};

// Only Taxi has an `ac` column in the schema — DumpTruck/Tanker/Excavator/
// BodyTruck don't, so the AC filter and the `ac` select only apply here.
export const AC_CAPABLE_TYPES = new Set(["TAXI"]);
