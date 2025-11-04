
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
  { href: "/notepad", label: "Anotações", icon: "NotebookPen" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "PARA DEVs" },
  { href: "/dev/dashboard", label: "Dash", icon: "AreaChart" as const, type: "link" as const },
  { href: "/dev/clients", label: "Clientes & Projetos", icon: "Users2" as const, type: "link" as const },
  { href: "/dev/systems", label: "Ferramentas", icon: "Wrench" as const, type: "link" as const },
  { href: "/dev/web-management", label: "Gestão Web", icon: "Globe" as const, type: "link" as const },
  { href: "/dev/devops", label: "Gestão de Sistemas", icon: "GitMerge" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "Metodologia Kanban" },
  { href: "/dev/kanban", label: "Quadro Kanban", icon: "KanbanSquare" as const, type: "link" as const },
  { href: "/dev/kanban-analytics", label: "Análise Kanban", icon: "PieChart" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "Módulos" },
  { href: "/sharing", label: "Compartilhamento", icon: "Share2" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "CORPORATIVO" },
  { href: "/corporate/teams", label: "Equipes", icon: "Users" as const, type: "link" as const },
  { href: "/corporate/reports", label: "Graficos & Metas", icon: "AreaChart" as const, type: "link" as const },
  { type: "separator" as const },
  { href: "/plans", label: "Nossos Planos", icon: "Gem" as const, type: "link" as const },
  { href: "/help", label: "Ajuda", icon: "LifeBuoy" as const, type: "link" as const },
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
      'Funcionalidades básicas (Painel, Transações, Metas, etc.)',
      'Compartilhamento de 1 módulo',
      'Acesso limitado a ferramentas de análise',
      'Add-on de Cotações por R$ 5,00/mês'
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
      'Análise de dados detalhada e completa',
      'Módulo de Cotações incluso',
      'Sugestões financeiras com IA (em breve)',
      'Suporte prioritário'
    ],
    featured: true,
    icon: "BrainCircuit",
  },
    {
    name: 'Flortune para DEVs',
    id: 'tier-dev',
    href: '/signup?plan=dev',
    priceMonthly: 'R$119,90',
    priceAnnotation: 'por usuário/mês',
    description: 'Ferramentas de gestão de projetos e clientes para freelancers e pequenas equipes de desenvolvimento.',
    features: [
      'Todas as funcionalidades do Mestre Jardineiro',
      'Gerenciamento de Clientes e Projetos',
      'Calculadoras e Ferramentas de DEV',
      'Módulo Quadro Kanban com compartilhamento',
    ],
    featured: false,
    icon: "Code",
  },
  {
    name: 'Flortune Corporativo',
    id: 'tier-corporativo',
    href: '/signup?plan=corporativo',
    priceMonthly: 'R$249,90',
    priceAnnotation: 'para 5 usuários. Usuários adicionais cobrados à parte.',
    description: 'Soluções financeiras robustas e personalizadas para grandes equipes e empresas em crescimento.',
    features: [
      'Todas as funcionalidades do plano para DEVs',
      'Gerenciamento de múltiplos usuários/equipes',
      'Painel de controle administrativo',
      'Suporte via e-mail e chat',
    ],
    featured: false,
    icon: "Briefcase",
  },
];
export type PricingTierIconName = typeof PRICING_TIERS[number]["icon"];


// Lista de cotações disponíveis na API AwesomeAPI
export const AVAILABLE_QUOTES = [
  { name: "Dólar Comercial", code: "USD-BRL" },
  { name: "Dólar Turismo", code: "USDT-BRL" },
  { name: "Euro", code: "EUR-BRL" },
  { name: "Libra Esterlina", code: "GBP-BRL" },
  { name: "Iene Japonês", code: "JPY-BRL" },
  { name: "Peso Argentino", code: "ARS-BRL" },
  { name: "Bitcoin", code: "BTC-BRL" },
  { name: "Ethereum", code: "ETH-BRL" },
  { name: "Litecoin", code: "LTC-BRL" },
  { name: "Ibovespa", code: "IBOV" }, // Nota: API pode não retornar todos os campos para índices
  { name: "Nasdaq", code: "NASDAQ" }, // Nota: API pode não retornar todos os campos para índices
  { name: "Cacau", code: "CAC" },
];
