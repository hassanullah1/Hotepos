// lib/fetchBuyer.ts
export function fetchBuyer(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    credentials: "same-origin", // ensures the buyer_token cookie is sent
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
