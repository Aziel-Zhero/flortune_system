export const APP_NAME = "Flortune";

// Use keys for translation
export const NAV_LINKS_KEYS = [
  { href: "/dashboard", labelKey: "dashboard", icon: "LayoutDashboard" },
  { href: "/calendar", labelKey: "calendar", icon: "CalendarDays" },
  { href: "/transactions", labelKey: "transactions", icon: "ArrowRightLeft" },
  { href: "/analysis", labelKey: "analysis", icon: "BarChart3" },
  { href: "/budgets", labelKey: "budgets", icon: "Target"},
  { href: "/goals", labelKey: "goals", icon: "Trophy" },
  { href: "/settings", labelKey: "settings", icon: "Settings" },
] as const;

// Keep original NavLinkIcon type if it's used elsewhere, or adapt as needed.
// For icon mapping, this type definition is still fine.
export type NavLinkIcon = typeof NAV_LINKS_KEYS[number]["icon"];
