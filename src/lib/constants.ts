
export const APP_NAME = "Flortune";
export const NO_ICON_VALUE = "__NO_ICON__";

// Navigation links with Portuguese labels
export const NAV_LINKS_CONFIG = [
  { href: "/dashboard", label: "Painel", icon: "LayoutDashboard" as const, type: "link" as const },
  { href: "/calendar", label: "Calendário", icon: "CalendarDays" as const, type: "link" as const },
  { href: "/transactions", label: "Transações", icon: "ArrowRightLeft" as const, type: "link" as const },
  { href: "/analysis", label: "Análise", icon: "BarChart3" as const, type: "link" as const },
  { href: "/budgets", label: "Orçamentos", icon: "Target" as const, type: "link" as const },
  { href: "/goals", label: "Metas", icon: "Trophy" as const, type: "link" as const },
  { href: "/todos", label: "Lista de Tarefas", icon: "ListChecks" as const, type: "link" as const },
  { href: "/notes", label: "Anotações", icon: "NotebookPen" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "PARA DEVs" },
  { href: "/dev/systems", label: "Sistemas e Ferramentas", icon: "HardDrive" as const, type: "link" as const },
  { href: "/dev/devops", label: "DevOps", icon: "GitMerge" as const, type: "link" as const },
  { href: "/dev/clients", label: "Clientes", icon: "Users2" as const, type: "link" as const },
  { type: "title" as const, label: "Metodologias Ágeis" },
  { href: "/dev/scrum", label: "Scrum Planner", icon: "ListChecks" as const, type: "link" as const },
  { href: "/dev/kanban", label: "Quadro Kanban", icon: "KanbanSquare" as const, type: "link" as const },
  { type: "separator" as const },
  { href: "/plans", label: "Nossos Planos", icon: "Gem" as const, type: "link" as const },
  { href: "/settings", label: "Configurações", icon: "Settings" as const, type: "link" as const },
] as const;

// Union type for NavLinkConfig items
export type NavLinkItem = (typeof NAV_LINKS_CONFIG)[number];

// Correctly extracting icon names for NavLinkItem that are links
export type NavLinkIconName = Extract<NavLinkItem, { type: "link"; icon: any }>["icon"];


// Pricing Tiers
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
      'Visão geral com calendário financeiro',
      'Lista de Tarefas básica'
    ],
    featured: false,
    icon: "Leaf",
  },
  {
    name: 'Mestre Jardineiro',
    id: 'tier-mestre',
    href: '/signup?plan=mestre',
    priceMonthly: 'R$14,90',
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
    href: '/signup?plan=corporativo',
    priceMonthly: 'R$350,90*',
    priceAnnotation: 'para 5 usuários. Usuários adicionais cobrados à parte.',
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
