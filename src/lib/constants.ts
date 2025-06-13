export const APP_NAME = "Flortune";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/calendar", label: "Calendar", icon: "CalendarDays" },
  { href: "/transactions", label: "Transactions", icon: "ArrowRightLeft" },
  { href: "/analysis", label: "Analysis", icon: "BarChart3" },
  { href: "/budgets", label: "Budgets", icon: "Target"},
  { href: "/goals", label: "Goals", icon: "Trophy" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export type NavLinkIcon = typeof NAV_LINKS[number]["icon"];
