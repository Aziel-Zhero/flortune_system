
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
  { type: "title" as const, label: "Módulos" },
  { href: "/sharing", label: "Compartilhamento", icon: "Share2" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "PARA DEVs" },
  { href: "/dev/dashboard", label: "Dash", icon: "AreaChart" as const, type: "link" as const },
  { href: "/dev/clients", label: "Clientes & Projetos", icon: "Users2" as const, type: "link" as const },
  { href: "/dev/systems", label: "Ferramentas", icon: "Wrench" as const, type: "link" as const },
  { href: "/dev/web-management", label: "Gestão Web", icon: "Globe" as const, type: "link" as const },
  { href: "/dev/devops", label: "Gestão de Sistemas", icon: "GitMerge" as const, type: "link" as const },
  { type: "title" as const, label: "Metodologia Kanban" },
  { href: "/dev/kanban", label: "Quadro Kanban", icon: "KanbanSquare" as const, type: "link" as const },
  { href: "/dev/kanban-analytics", label: "Análise Kanban", icon: "PieChart" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "CORPORATIVO" },
  { href: "/corporate/teams", label: "Equipes", icon: "Users" as const, type: "link" as const },
  { href: "/corporate/reports", label: "Graficos & Metas", icon: "AreaChart" as const, type: "link" as const },
  { type: "separator" as const },
  { href: "/plans", label: "Nossos Planos", icon: "Gem" as const, type: "link" as const },
  { href: "/help", label: "Ajuda", icon: "LifeBuoy" as const, type: "link" as const },
] as const;

export const ADMIN_NAV_LINKS_CONFIG = [
  { href: "/dashboard-admin", label: "Home", icon: "Home" as const, type: "link" as const, key: "admin-home" },
  { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" as const, type: "link" as const, key: "admin-dashboard" },
  { type: "title" as const, label: "Gestão de Conteúdo", key: "admin-title-content" },
  { href: "/admin/marketplace", label: "Produtos", icon: "Package" as const, type: "link" as const, key: "admin-marketplace" },
  { href: "/admin/lp", label: "LP", icon: "FileText" as const, type: "link" as const, key: "admin-lp" },
  { type: "title" as const, label: "Engajamento & Conversão", key: "admin-title-engagement" },
  { href: "/admin/marketing/dashboard", label: "Painel NPS", icon: "Heart" as const, type: "link" as const, key: "admin-nps" },
  { href: "/admin/leads", label: "Leads", icon: "Users" as const, type: "link" as const, key: "admin-leads" },
  { href: "/admin/campaigns", label: "Campanhas", icon: "ShoppingBag" as const, type: "link" as const, key: "admin-campaigns" },
  { href: "/admin/forms", label: "Formulários", icon: "ClipboardList" as const, type: "link" as const, key: "admin-forms" },
  { type: "separator" as const, key: "sep-admin-integ" },
  { type: "title" as const, label: "Integração", key: "admin-title-integration" },
  { href: "/admin/apis", label: "API's", icon: "Code" as const, type: "link" as const, key: "admin-apis" },
  { href: "/admin/telegram", label: "Telegram", icon: "Send" as const, type: "link" as const, key: "admin-telegram" },
  { href: "/admin/whatsapp", label: "Whatsapp (WAHA)", icon: "Bot" as const, type: "link" as const, key: "admin-waha" },
  { href: "/admin/whatsapp-official", label: "WhatsApp (Oficial)", icon: "MessageSquare" as const, type: "link" as const, key: "admin-whatsapp-official" },
];


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
      'Add-on de Cotações por R$ 2,00/mês'
    ],
    featured: false,
    icon: "Leaf",
    stripePriceId: null,
  },
  {
    name: 'Mestre Jardineiro',
    id: 'tier-mestre',
    href: 'https://buy.stripe.com/test_5kA5m32yP67x1i8cMM',
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
    stripePriceId: "price_1PMEpLAt9gV2x1d6lXv9z4aO",
  },
    {
    name: 'Flortune para DEVs',
    id: 'tier-dev',
    href: 'https://buy.stripe.com/test_14k15R0qLg8X1i8dQS',
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
    stripePriceId: "price_1PMEqNAt9gV2x1d6mpkQzPno",
  },
  {
    name: 'Flortune Corporativo',
    id: 'tier-corporativo',
    href: 'https://buy.stripe.com/test_8wM15R1uP7bB0e4eV1',
    priceMonthly: 'R$139,90',
    priceAnnotation: 'para 3 usuários. Usuários adicionais cobrados à parte.',
    description: 'Soluções financeiras e de gestão para pequenas e médias equipes.',
    features: [
      'Todas as funcionalidades do plano para DEVs',
      'Gerenciamento de múltiplos usuários/equipes',
      'Painel de controle administrativo',
      'Suporte via e-mail e chat',
    ],
    featured: false,
    icon: "Briefcase",
    stripePriceId: "price_1PMEr4At9gV2x1d6d8v0yWzG",
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
  { name: "Ibovespa", code: "IBOV" },
  { name: "Nasdaq", code: "NASDAQ" },
  { name: "Cacau", code: "CAC" },
];
