// HesabPay appends "?data={...}" to our return_url, which already contains
// "?ref=<uuid>". Result: "?ref=<uuid>?data={...}". We only want the UUID.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractRef(raw) {
  if (!raw) return "";
  const match = String(raw).match(UUID_RE);
  return match ? match[0] : "";
}
