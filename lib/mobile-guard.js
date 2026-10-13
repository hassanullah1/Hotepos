// Marks routes under /api/mobileapp as mobile-app-only. The mobile client
// (mobile/api/client.ts) sends a fixed header on every request; the web
// admin/waiter dashboards never do. This keeps the two frontends' APIs
// cleanly separated so a change on one side can't silently break the other.
//
// Note: this is a *convention*, not a security boundary on its own — any
// client could set this header by hand. Real access control still comes
// from the JWT, checked separately via getAuthUser() on every route below.
// Its job is only to keep "mobile" and "web" traffic from colliding, not
// to authenticate anyone.
const MOBILE_HEADER = "x-mobile-app";
const MOBILE_HEADER_VALUE = "waiter-app";

export function isMobileClient(request) {
  return request.headers.get(MOBILE_HEADER) === MOBILE_HEADER_VALUE;
}
