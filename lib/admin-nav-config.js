// Shared by AdminSidebar and the dashboard quick-actions grid,
// so links/roles never drift out of sync between the two.
export const NAV_ITEMS = [
  {
    href: "/admin",
    key: "dashboard",
    roles: ["super_admin", "hotel_owner", "STAFF"],
    icon: "home",
  },
  {
    href: "/admin/hotels",
    key: "Hotels",
    roles: ["super_admin", "ADMIN", "STAFF"],
    icon: "building",
  },
  {
    href: "/admin/plans",
    key: "Plans",
    roles: ["super_admin", "ADMIN", "STAFF"],
    icon: "tag",
  },
  { href: "/admin/users", key: "users", roles: ["super_admin"], icon: "users" },
  {
    href: "/admin/owners/staff",
    key: "ownerStaff",
    roles: ["super_admin", "hotel_owner"],
    icon: "userGroup",
  },
  {
    href: "/admin/owners/menu",
    key: "ownerMenu",
    roles: ["super_admin", "hotel_owner"],
    icon: "menu",
  },
  {
    href: "/admin/owners",
    key: "owners",
    roles: ["super_admin"],
    icon: "crown",
  },
  // Add more links here — give each a translations.js "nav" key,
  // restrict with `roles`, and pick an `icon` from ICONS in QuickActionsGrid.
];

export function filterNavByRole(items, role) {
  console.log(role);
  return items
    .filter((item) => item.roles.includes(role))
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter((c) => c.roles.includes(role)),
          }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);
}
