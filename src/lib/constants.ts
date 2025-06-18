
export const APP_NAME = "Flortune";

// Navigation links with Portuguese labels
export const NAV_LINKS_CONFIG = [
  { href: "/dashboard", label: "Painel", icon: "LayoutDashboard" },
  { href: "/calendar", label: "Calendário", icon: "CalendarDays" },
  { href: "/transactions", label: "Transações", icon: "ArrowRightLeft" },
  { href: "/analysis", label: "Análise", icon: "BarChart3" },
  { href: "/budgets", label: "Orçamentos", icon: "Target"},
  { href: "/goals", label: "Metas", icon: "Trophy" },
  { href: "/plans", label: "Nossos Planos", icon: "Gem" }, // Novo link para planos
  // { href: "/todos", label: "Lista de Tarefas", icon: "ListChecks" }, // Temporariamente removido
  { href: "/settings", label: "Configurações", icon: "Settings" },
] as const;

export type NavLinkIconName = typeof NAV_LINKS_CONFIG[number]["icon"];

// Pricing Tiers - Adicionado para a página de planos
export const PRICING_TIERS = [
  {
    name: 'Cultivador Consciente',
    id: 'tier-cultivador',
    href: '/signup?plan=cultivador',
    priceMonthly: 'Grátis',
    description: "Comece a organizar suas finanças e cultivar bons hábitos financeiros sem custo.",
    features: [
      'Gerenciamento de transações',
      'Criação de orçamentos básicos',
      'Definição de metas financeiras',
      'Visão geral com calendário financeiro'
    ],
    featured: false,
    icon: "Leaf",
  },
  {
    name: 'Mestre Jardineiro',
    id: 'tier-mestre',
    href: '/signup?plan=mestre',
    priceMonthly: 'R$19,90',
    description: 'Desbloqueie todo o potencial do Flortune com análises avançadas e IA.',
    features: [
      'Todas as funcionalidades do plano Cultivador',
      'Análise de dados detalhada',
      'Sugestões financeiras com IA',
      'Auto-categorização de transações por IA',
      'Relatórios avançados',
      'Suporte prioritário'
    ],
    featured: true,
    icon: "BrainCircuit",
  },
  {
    name: 'Flortune Corporativo',
    id: 'tier-corporativo',
    href: '/signup?plan=corporativo', // Idealmente, levaria a um formulário de contato
    priceMonthly: 'R$39,90*',
    priceAnnotation: 'por usuário/mês',
    description: 'Soluções financeiras robustas e personalizadas para grandes equipes e empresas em crescimento.',
    features: [
      'Todas as funcionalidades do Mestre Jardineiro',
      'Gerenciamento de múltiplos usuários/equipes',
      'Permissões de acesso personalizadas',
      'Painel de controle administrativo',
      'Suporte empresarial dedicado (SLA)',
      'Integrações com sistemas contábeis (sob demanda)',
      'Consultoria financeira especializada'
    ],
    featured: false,
    icon: "Briefcase",
  },
];
export type PricingTierIconName = typeof PRICING_TIERS[number]["icon"];
