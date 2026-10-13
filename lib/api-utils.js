import { NextResponse } from "next/server";

export function badRequest(message, details) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function conflict(message) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Never select password_hash / pin_code back to the client.
export const USER_SAFE_SELECT = {
  id: true,
  hotel_id: true,
  branch_id: true,
  role_id: true,
  full_name: true,
  email: true,
  phone: true,
  username: true,
  is_active: true,
  hired_at: true,
  created_at: true,
  updated_at: true,
  roles: { select: { id: true, name: true, scope: true } },
  branches: {
    select: {
      id: true,
      name: true,
      hotels: { select: { id: true, name: true } },
    },
  },
};

export function shapeUser(u) {
  return {
    ...u,
    role_name: u.roles?.name,
    hotel_name: u.branches?.hotels?.name || null,
    branch_name: u.branches?.name || null,
  };
}
