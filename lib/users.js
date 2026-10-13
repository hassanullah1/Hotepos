// lib/users.js
// Frontend helper for managing users — thin wrappers around /api/users
// so pages don't repeat fetch/error-handling boilerplate.
import { fetchWithAuth } from "@/lib/fetchWithAuth";

async function parseOrThrow(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function listUsers({ q = "", branch_id = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (branch_id) params.set("branch_id", branch_id);
  const res = await fetchWithAuth(`/api/users?${params.toString()}`);
  if (res.status === 401) throw new AuthError();
  const data = await parseOrThrow(res);
  return data.users;
}

export async function getUser(id) {
  const res = await fetchWithAuth(`/api/users/${id}`);
  if (res.status === 401) throw new AuthError();
  const data = await parseOrThrow(res);
  return data.user;
}

export async function createUser(payload) {
  const res = await fetchWithAuth(`/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new AuthError();
  const data = await parseOrThrow(res);
  return data.user;
}

export async function updateUser(id, payload) {
  const res = await fetchWithAuth(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new AuthError();
  const data = await parseOrThrow(res);
  return data.user;
}

// Soft-delete: the API deactivates rather than hard-deletes, since users
// are referenced by orders/payments/shifts and need to keep their history.
export async function deactivateUser(id) {
  const res = await fetchWithAuth(`/api/users/${id}`, { method: "DELETE" });
  if (res.status === 401) throw new AuthError();
  return parseOrThrow(res);
}

// Reuses the existing roles endpoint to populate role pickers.
export async function listAssignableRoles() {
  const res = await fetchWithAuth(`/api/roles`);
  if (res.status === 401) throw new AuthError();
  const data = await parseOrThrow(res);
  return data.roles;
}

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthError";
  }
}
