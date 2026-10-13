// lib/safeJson.js

// Safely parse a fetch Response body as JSON without throwing
// "Unexpected end of JSON input" when the server returns an empty
// or non-JSON body (crashed route, redirect, blank 500, etc).
export async function safeJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: "Invalid server response" };
  }
}
