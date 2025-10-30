// src/app/(app)/analysis/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrivateValue } from "@/components/shared/private-value";
import { 
  PieChart as PieIconLucide, 
  Wallet, 
  TrendingDown,
  AreaChart as AreaIconLucide,
  BarChart3 as BarIconLucide, 
  Radar as RadarIconLucide, 
  Target as RadialIconLucide,
  LineChart as LineIconLucideReal,
  Users,
  Briefcase,
  PiggyBank,
  Sigma,
  Coins,
  Receipt,
  ArrowRightLeft
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_NAME } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";

import {
  AreaChart, 
  Area,      
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart, 
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart, 
  Bar,
  LabelList,
  RadarChart, 
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar, 
  RadialBarChart, 
  RadialBar
} from "recharts";

interface CategoryData {
  name: string;
  value: number;
  fill: string;
}

interface MonthlyEvolutionData {
  month: string;
  Receitas: number;
  Despesas: number;
}

interface TopExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryName?: string;
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1)/0.7)",
  "hsl(var(--chart-2)/0.7)",
];

// --- MOCK DATA PARA GRÁFICOS PRINCIPAIS ---
const mockSpendingByCategory: CategoryData[] = [
  { name: "Moradia", value: 1850.55, fill: chartColors[0] },
  { name: "Alimentação", value: 1230.70, fill: chartColors[1] },
  { name: "Lazer", value: 680.00, fill: chartColors[2] },
  { name: "Transporte", value: 430.50, fill: chartColors[3] },
  { name: "Outros", value: 250.00, fill: chartColors[4] },
];

const mockIncomeBySource: CategoryData[] = [
  { name: "Salário", value: 7500.00, fill: chartColors[0] },
  { name: "Freelance", value: 2100.00, fill: chartColors[1] },
  { name: "Rendimentos", value: 350.00, fill: chartColors[2] },
];

const mockTopExpenses: TopExpense[] = [
  { id: '1', description: 'Aluguel & Condomínio', amount: 1800.00, date: '05/07/2024', categoryName: 'Moradia' },
  { id: '2', description: 'Compras do Mês', amount: 850.20, date: '02/07/2024', categoryName: 'Alimentação' },
  { id: '3', description: 'Show da Banda X', amount: 350.00, date: '15/07/2024', categoryName: 'Lazer' },
  { id: '4', description: 'Combustível', amount: 250.00, date: '10/07/2024', categoryName: 'Transporte' },
  { id: '5', description: 'Restaurante Y', amount: 220.50, date: '20/07/2024', categoryName: 'Alimentação' },
];

const mockMonthlyEvolution: MonthlyEvolutionData[] = [
  { month: "Jan/24", Receitas: 6800, Despesas: 4500 },
  { month: "Fev/24", Receitas: 7100, Despesas: 4800 },
  { month: "Mar/24", Receitas: 7200, Despesas: 4700 },
  { month: "Abr/24", Receitas: 6900, Despesas: 5100 },
  { month: "Mai/24", Receitas: 7800, Despesas: 5500 },
  { month: "Jun/24", Receitas: 8200, Despesas: 5300 },
  { month: "Jul/24", Receitas: 9600, Despesas: 4500 },
  { month: "Ago/24", Receitas: 0, Despesas: 0 },
  { month: "Set/24", Receitas: 0, Despesas: 0 },
  { month: "Out/24", Receitas: 0, Despesas: 0 },
  { month: "Nov/24", Receitas: 0, Despesas: 0 },
  { month: "Dez/24", Receitas: 0, Despesas: 0 },
];
// --- FIM DOS MOCK DATA ---

const RealDataCustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg backdrop-blur-sm">
        <p className="label text-sm font-medium text-foreground">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-xs">
            {`${entry.name || 'Data'}: ${typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A'}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RealDataPieCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length && payload[0] && payload[0].payload) {
    const data = payload[0].payload;
    const value = data.value;
    const percent = payload[0].percent;
    return (
      <div className="p-2 bg-background/90 border border-border rounded-md shadow-lg backdrop-blur-sm">
        <p className="text-sm font-medium" style={{color: data.fill}}>{`${data.name || 'Categoria'}`}</p>
        {typeof value === 'number' && (
           <p className="text-xs text-foreground">{`Valor: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</p>
        )}
        {typeof percent === 'number' && (
          <p className="text-xs text-muted-foreground">{`(${(percent * 100).toFixed(2)}%)`}</p>
        )}
      </div>
    );
  }
  return null;
};

// --- NOVOS MOCK DATA PARA A GALERIA ---
const mockMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const mockClientsProjectsData = mockMonths.map(month => ({ month, clientes: Math.floor(Math.random() * 5) + 2, projetos: Math.floor(Math.random() * 3) + 1 }));
const mockGoalsData = mockMonths.map((month, i) => ({ month, meta: 1000 * (i+1) * 1.5, atual: Math.floor(Math.random() * 1000 * (i+1)) }));
const mockAccumulatedData = [ { name: 'Projetos', total: 125000 }, { name: 'Orçamento', total: 85000 } ];
const mockBudgetPerformanceData = mockMonths.map(month => ({ month, orcado: 1000, gasto: Math.floor(Math.random() * 400) + 800 }));
const mockEssentialSpendingData = [ { name: 'Contas Fixas', value: 2500, fill: 'hsl(var(--chart-1))' }, { name: 'Alimentação Essencial', value: 1200, fill: 'hsl(var(--chart-2))' }, { name: 'Transporte Obrigatório', value: 450, fill: 'hsl(var(--chart-3))' }];
const mockTopSpendingRadar = [ { subject: 'Streaming', value: 120, fullMark: 150 }, { subject: 'Restaurantes', value: 98, fullMark: 150 }, { subject: 'Apps', value: 86, fullMark: 150 } ];
const mockInvestmentYieldData = [ { name: 'Renda Fixa', value: 68.2, fill: 'hsl(var(--chart-1))' }, { name: 'Renda Variável', value: 22.8, fill: 'hsl(var(--chart-2))' }, { name: 'Fundos', value: 9, fill: 'hsl(var(--chart-3))' } ];
const mockIRData = [{ name: 'IR', value: 78 }];
const mockComparisonData = [ { name: 'Este Mês', despesas: 4500, receitas: 8000 }, { name: 'Mês Passado', despesas: 5100, receitas: 7800 } ];

const galleryChartConfig = {
  clientes: { label: "Novos Clientes", color: "hsl(var(--chart-1))" },
  projetos: { label: "Projetos Concluídos", color: "hsl(var(--chart-2))" },
  meta: { label: "Meta", color: "hsl(var(--chart-4))" },
  atual: { label: "Valor Atual", color: "hsl(var(--chart-5))" },
  total: { label: "Total", color: "hsl(var(--chart-1))"},
  orcado: { label: "Orçado", color: "hsl(var(--chart-3))" },
  gasto: { label: "Gasto", color: "hsl(var(--chart-4))" },
  despesas: { label: "Despesas", color: "hsl(var(--chart-2))" },
  receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;
// --- FIM DOS NOVOS MOCKS ---


export default function AnalysisPage() {
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = `Análise Financeira - ${APP_NAME}`;
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const spendingByCategory = mockSpendingByCategory;
  const incomeBySource = mockIncomeBySource;
  const monthlyEvolution = mockMonthlyEvolution;
  const topExpenses = mockTopExpenses;
  const isFetchingTransactions = false;
  const noTransactionsAtAll = false;

  const realDataChartConfig = useMemo(() => ({
    Receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
    Despesas: { label: "Despesas", color: "hsl(var(--chart-2))" },
  }), []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Análise Financeira" description="Carregando seus insights financeiros..." icon={<Wallet className="h-6 w-6 text-primary"/>} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => ( <Card key={`sk-card-pie-${i}`} className="shadow-sm lg:col-span-1"><CardHeader><Skeleton className="h-6 w-3/4 mb-1"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card> ))}
          <Card className="md:col-span-2 lg:col-span-3"><CardHeader><Skeleton className="h-6 w-1/2 mb-1"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent><Skeleton className="h-96 w-full"/></CardContent></Card>
        </div>
         <PageHeader title="Galeria de Análises de Negócio" description="Carregando demonstrações..." icon={<BarIconLucide className="h-6 w-6 text-primary"/>} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {[...Array(9)].map((_, i) => ( <Card key={`sk-gallery-${i}`}><CardHeader><Skeleton className="h-5 w-1/2" /><Skeleton className="h-3 w-3/4 mt-1" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análise Financeira Detalhada"
        description="Explore seus padrões de gastos, receitas e tendências ao longo do tempo."
        icon={<Wallet className="h-6 w-6 text-primary"/>}
        actions={
          <Select value={timePeriod} onValueChange={setTimePeriod} disabled={isFetchingTransactions || noTransactionsAtAll}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Selecionar período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Este Mês</SelectItem>
              <SelectItem value="yearly">Este Ano</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-primary" />Gastos por Categoria</CardTitle><CardDescription>Distribuição das suas despesas ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription></CardHeader>
                <CardContent className="h-[320px] sm:h-80">
                    {spendingByCategory.length > 0 ? (
                        <ChartContainer config={realDataChartConfig} className="min-h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%"><PieChart><RechartsTooltip content={<RealDataPieCustomTooltip />} /><Pie data={spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => (percent && name ? `${name} (${(percent * 100).toFixed(0)}%)` : '')}>{spendingByCategory.map((entry, index) => (<Cell key={`cell-spending-${index}`} fill={entry.fill} />))}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} /></PieChart></ResponsiveContainer>
                        </ChartContainer>
                    ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem dados de despesas.</p></div>}
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-emerald-500" />Fontes de Renda</CardTitle><CardDescription>De onde vêm suas receitas ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription></CardHeader>
                <CardContent className="h-[320px] sm:h-80">
                    {incomeBySource.length > 0 ? (
                        <ChartContainer config={realDataChartConfig} className="min-h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%"><PieChart><RechartsTooltip content={<RealDataPieCustomTooltip />} /><Pie data={incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => (percent && name ? `${name} (${(percent * 100).toFixed(0)}%)` : '')}>{incomeBySource.map((entry, index) => (<Cell key={`cell-income-${index}`} fill={entry.fill} />))}</Pie><ChartLegend content={<ChartLegendContent nameKey="name" />} /></PieChart></ResponsiveContainer>
                        </ChartContainer>
                    ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem dados de receitas.</p></div>}
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><TrendingDown className="mr-2 h-5 w-5 text-destructive" />Top 5 Despesas</CardTitle><CardDescription>Maiores gastos no período.</CardDescription></CardHeader>
                <CardContent className="h-[320px] sm:h-80 overflow-y-auto">
                    {topExpenses.length > 0 ? (
                        <Table size="sm"><TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader><TableBody>{topExpenses.map(tx => (<TableRow key={tx.id}><TableCell className="font-medium text-xs truncate max-w-[120px] sm:max-w-none" title={tx.description}>{tx.description}<br/><span className="text-muted-foreground text-[10px]">{tx.categoryName} - {tx.date}</span></TableCell><TableCell className="text-right text-xs"><PrivateValue value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="text-destructive/80" /></TableCell></TableRow>))}</TableBody></Table>
                    ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem despesas para listar.</p></div>}
                </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-3 shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><AreaIconLucide className="mr-2 h-5 w-5 text-primary" />Evolução Mensal (Últimos 12 Meses)</CardTitle><CardDescription>Suas receitas vs. despesas ao longo do tempo.</CardDescription></CardHeader>
                <CardContent className="h-80 sm:h-96 overflow-hidden">
                    {monthlyEvolution.length > 0 && monthlyEvolution.some(d => d.Receitas > 0 || d.Despesas > 0) ? (
                        <ChartContainer config={realDataChartConfig} className="min-h-[300px] w-full h-full">
                            <ResponsiveContainer width="99%" height="100%"><AreaChart accessibilityLayer data={monthlyEvolution} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}><defs><linearGradient id="fillReceitasEvolution" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Receitas)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-Receitas)" stopOpacity={0.1}/></linearGradient><linearGradient id="fillDespesasEvolution" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Despesas)" stopOpacity={0.7}/><stop offset="95%" stopColor="var(--color-Despesas)" stopOpacity={0.1}/></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} interval={0} angle={-45} textAnchor="end" height={80} dy={10} tick={{ fontSize: '0.65rem' }} /><YAxis tickFormatter={(value) => `R$${Number(value / 1000).toFixed(0)}k`} tick={{ fontSize: '0.65rem' }} tickLine={false} axisLine={false} tickMargin={5} dx={-5} width={60} /><ChartTooltip cursor={false} content={<RealDataCustomTooltip />} /><Legend verticalAlign="top" wrapperStyle={{paddingBottom: '15px', fontSize: '12px', paddingTop: '5px'}}/><Area type="monotone" dataKey="Receitas" stroke="var(--color-Receitas)" fillOpacity={1} fill="url(#fillReceitasEvolution)" stackId="1" name="Receitas" /><Area type="monotone" dataKey="Despesas" stroke="var(--color-Despesas)" fillOpacity={1} fill="url(#fillDespesasEvolution)" stackId="2" name="Despesas" /></AreaChart></ResponsiveContainer>
                        </ChartContainer>
                    ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem dados suficientes para exibir a evolução.</p></div>}
                </CardContent>
            </Card>
      </div>

      <PageHeader title="Galeria de Análises de Negócio" description="Visualizações sobre a performance de projetos, metas e finanças." icon={<BarIconLucide className="h-6 w-6 text-primary"/>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Clientes e Projetos</CardTitle><CardDescription>Aquisição de clientes e projetos concluídos.</CardDescription></CardHeader><CardContent className="h-72"><ChartContainer config={galleryChartConfig} className="w-full h-full"><AreaChart accessibilityLayer data={mockClientsProjectsData} margin={{left: 12, right: 12}}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} /><ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} /><Area dataKey="clientes" type="natural" fill="var(--color-clientes)" fillOpacity={0.4} stroke="var(--color-clientes)" stackId="a" /><Area dataKey="projetos" type="natural" fill="var(--color-projetos)" fillOpacity={0.4} stroke="var(--color-projetos)" stackId="b" /></AreaChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><PiggyBank className="mr-2 h-5 w-5 text-primary"/>Evolução de Metas</CardTitle><CardDescription>Progresso do valor atual vs. meta ao longo do tempo.</CardDescription></CardHeader><CardContent className="h-72"><ChartContainer config={galleryChartConfig} className="w-full h-full"><AreaChart accessibilityLayer data={mockGoalsData} margin={{left: 12, right: 12}}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} /><ChartTooltip cursor={false} content={<ChartTooltipContent />} /><defs><linearGradient id="fillAtual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-atual)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-atual)" stopOpacity={0.1} /></linearGradient></defs><Area dataKey="meta" type="step" stroke="var(--color-meta)" strokeWidth={2} strokeDasharray="5 5" /><Area dataKey="atual" type="natural" fill="url(#fillAtual)" stroke="var(--color-atual)" stackId="a" /></AreaChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><Sigma className="mr-2 h-5 w-5 text-primary"/>Totais Acumulados</CardTitle><CardDescription>Valores de projetos e orçamentos atingidos.</CardDescription></CardHeader><CardContent className="h-72"><ChartContainer config={galleryChartConfig} className="w-full h-full"><BarChart accessibilityLayer data={mockAccumulatedData} layout="vertical" margin={{right: 40}}><CartesianGrid horizontal={false} /><YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} className="capitalize"/><XAxis dataKey="total" type="number" hide /><ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} /><Bar dataKey="total" layout="vertical" fill="var(--color-total)" radius={4}><LabelList dataKey="total" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})} /></Bar></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><Target className="mr-2 h-5 w-5 text-primary"/>Desempenho do Orçamento</CardTitle><CardDescription>Comparativo de valores orçados vs. gastos.</CardDescription></CardHeader><CardContent className="h-72"><ChartContainer config={galleryChartConfig} className="w-full h-full"><LineChart accessibilityLayer data={mockBudgetPerformanceData} margin={{top: 20, left: 12, right: 12}}><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} /><ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} /><Line dataKey="gasto" type="natural" stroke="var(--color-gasto)" strokeWidth={2} dot={{fill: "var(--color-gasto)"}} activeDot={{ r: 6 }} ><LabelList dataKey="gasto" position="top" offset={12} className="fill-foreground" fontSize={12} /></Line><Line dataKey="orcado" type="monotone" stroke="var(--color-orcado)" strokeDasharray="3 4 5 2" /></LineChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Gastos Essenciais</CardTitle><CardDescription>Distribuição de despesas fixas e obrigatórias.</CardDescription></CardHeader><CardContent className="h-72 flex items-center justify-center"><ChartContainer config={galleryChartConfig} className="w-full max-w-[250px] aspect-square"><PieChart><ChartTooltip content={<ChartTooltipContent nameKey="name" />} /><Pie data={mockEssentialSpendingData} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{stroke: "hsl(var(--muted-foreground))"}} /></PieChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><RadarIconLucide className="mr-2 h-5 w-5 text-primary"/>3 Maiores Gastos</CardTitle><CardDescription>Comparativo entre os maiores gastos variáveis.</CardDescription></CardHeader><CardContent className="h-72"><ChartContainer config={galleryChartConfig} className="w-full h-full"><RadarChart data={mockTopSpendingRadar}><ChartTooltip content={<ChartTooltipContent />} /><PolarGrid gridType="polygon" /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis angle={30} domain={[0, 150]} /><Radar name="Valor" dataKey="value" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.6} /></RadarChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><Coins className="mr-2 h-5 w-5 text-primary"/>Rendimento de Investimentos</CardTitle><CardDescription>Composição da carteira de rendimentos.</CardDescription></CardHeader><CardContent className="h-72 flex items-center justify-center"><ChartContainer config={galleryChartConfig} className="w-full max-w-[250px] aspect-square"><RadialBarChart data={mockInvestmentYieldData} innerRadius="30%" outerRadius="80%" startAngle={90} endAngle={450}><PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} /><RadialBar dataKey="value" background><LabelList position="insideStart" dataKey="name" className="fill-white text-xs" fontSize={10}/></RadialBar><ChartTooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} /></RadialBarChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><Receipt className="mr-2 h-5 w-5 text-primary"/>Imposto de Renda (Estimativa)</CardTitle><CardDescription>Percentual estimado da meta de imposto anual.</CardDescription></CardHeader><CardContent className="h-72 flex items-center justify-center"><ChartContainer config={galleryChartConfig} className="w-full max-w-[250px] aspect-square"><RadialBarChart data={mockIRData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" barSize={10} startAngle={90} endAngle={450}><PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} /><RadialBar dataKey="value" background cornerRadius={5} fill="hsl(var(--chart-4))" /><RechartsTooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} /><text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-semibold">{`${mockIRData[0].value.toFixed(0)}%`}</text></RadialBarChart></ChartContainer></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-headline flex items-center"><ArrowRightLeft className="mr-2 h-5 w-5 text-primary"/>Comparativo Mensal</CardTitle><CardDescription>Receitas vs. Despesas do mês atual e anterior.</CardDescription></CardHeader><CardContent className="h-72"><ChartContainer config={galleryChartConfig} className="w-full h-full"><BarChart accessibilityLayer data={mockComparisonData}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><ChartLegend content={<ChartLegendContent />} /><Bar dataKey="receitas" fill="var(--color-receitas)" radius={[4, 4, 0, 0]} /><Bar dataKey="despesas" fill="var(--color-despesas)" radius={[4, 4, 0, 0]} /></BarChart></ChartContainer></CardContent></Card>
      </div>
    </div>
  );
}
