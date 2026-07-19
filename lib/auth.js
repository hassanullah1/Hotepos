import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "dev-only-fallback-secret-change-me";
const encodedSecret = new TextEncoder().encode(secretKey);

export const AUTH_COOKIE_NAME = "admin_token";
const TOKEN_EXPIRY = "8h";

/**
 * Sign a JWT for an authenticated admin user.
 * payload should contain: { id, email, role }
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(encodedSecret);
}

/**
 * Verify a JWT. Returns the decoded payload, or null if invalid/expired.
 * Safe to call from middleware (edge runtime).
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload;
  } catch {
    return null;
  }
}
