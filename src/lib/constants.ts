
export const APP_NAME = "Flortune";

// Navigation links with Portuguese labels
export const NAV_LINKS_CONFIG = [
  { href: "/dashboard", label: "Painel", icon: "LayoutDashboard" },
  { href: "/calendar", label: "Calendário", icon: "CalendarDays" },
  { href: "/transactions", label: "Transações", icon: "ArrowRightLeft" },
  { href: "/analysis", label: "Análise", icon: "BarChart3" },
  { href: "/budgets", label: "Orçamentos", icon: "Target"},
  { href: "/goals", label: "Metas", icon: "Trophy" },
  // { href: "/todos", label: "Lista de Tarefas", icon: "ListChecks" }, // Temporariamente removido
  { href: "/settings", label: "Configurações", icon: "Settings" },
] as const;

export type NavLinkIconName = typeof NAV_LINKS_CONFIG[number]["icon"];

// DEFAULT_USER não é mais necessário, pois os dados virão do Supabase Auth
// export const DEFAULT_USER = {
//   name: "Flora Green",
//   email: "flora.green@example.com",
//   avatarUrl: "https://placehold.co/100x100.png",
// };
