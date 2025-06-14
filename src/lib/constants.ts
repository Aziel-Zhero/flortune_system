export const APP_NAME = "Flortune";

// Navigation links: keys are for next-intl translations
export const NAV_LINKS_KEYS = [
  { href: "/dashboard", labelKey: "dashboard", icon: "LayoutDashboard" },
  { href: "/calendar", labelKey: "calendar", icon: "CalendarDays" },
  { href: "/transactions", labelKey: "transactions", icon: "ArrowRightLeft" },
  { href: "/analysis", labelKey: "analysis", icon: "BarChart3" },
  { href: "/budgets", labelKey: "budgets", icon: "Target"},
  { href: "/goals", labelKey: "goals", icon: "Trophy" },
  { href: "/settings", labelKey: "settings", icon: "Settings" },
] as const;

export type NavLinkIconName = typeof NAV_LINKS_KEYS[number]["icon"];

// Default user data placeholder (replace with actual auth logic)
export const DEFAULT_USER = {
  name: "Flora Green",
  email: "flora.green@example.com",
  avatarUrl: "https://placehold.co/100x100.png", // data-ai-hint: "woman nature"
};
