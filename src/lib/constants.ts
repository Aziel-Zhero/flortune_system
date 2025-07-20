
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
  { href: "/dev/clients", label: "Clientes & Projetos", icon: "Users2" as const, type: "link" as const },
  { href: "/dev/systems", label: "Ferramentas DEV", icon: "HardDrive" as const, type: "link" as const },
  { href: "/dev/devops", label: "Gestão de Sistemas", icon: "GitMerge" as const, type: "link" as const },
  { type: "separator" as const },
  { type: "title" as const, label: "Metodologias Ágeis" },
  { href: "/dev/scrum", label: "Scrum Visual", icon: "GanttChartSquare" as const, type: "link" as const },
  { href: "/dev/kanban", label: "Quadro Kanban", icon: "KanbanSquare" as const, type: "link" as const },
  { href: "/dev/scrum-analytics", label: "Análise Scrum", icon: "PieChart" as const, type: "link" as const },
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
    name: 'Flortune para DEVs',
    id: 'tier-dev',
    href: '/signup?plan=dev',
    priceMonthly: 'R$150',
    priceAnnotation: 'por usuário/mês (base)',
    description: 'Ferramentas de gestão de projetos e clientes para freelancers e pequenas equipes de desenvolvimento.',
    features: [
      'Todas as funcionalidades do Mestre Jardineiro',
      'Gerenciamento de Clientes e Projetos',
      'Calculadoras e Ferramentas de DEV',
      'Módulo Scrum Planner (+R$50/mês)',
      'Módulo Quadro Kanban (+R$50/mês)',
      'API de acesso para integrações (em breve)',
    ],
    featured: false,
    icon: "Code",
  },
  {
    name: 'Flortune Corporativo',
    id: 'tier-corporativo',
    href: '/signup?plan=corporativo',
    priceMonthly: 'R$350,90*',
    priceAnnotation: 'para 5 usuários. Usuários adicionais cobrados à parte.',
    description: 'Soluções financeiras robustas e personalizadas para grandes equipes e empresas em crescimento.',
    features: [
      'Todas as funcionalidades do plano para DEVs',
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
  { name: "Dogecoin", code: "DOGE-BRL" },
  { name: "Litecoin", code: "LTC-BRL" },
  { name: "Ibovespa", code: "IBOV" }, // Nota: API pode não retornar todos os campos para índices
  { name: "Nasdaq", code: "NASDAQ" }, // Nota: API pode não retornar todos os campos para índices
  { name: "Cacau", code: "CAC" },
  { name: "Ouro", code: "GOLD" },
];