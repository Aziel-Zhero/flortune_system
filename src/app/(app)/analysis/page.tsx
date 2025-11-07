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
  Users2,
  Trophy,
  DollarSign,
  Banknote,
  Percent,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_NAME } from "@/lib/constants";
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
  RadialBar,
  Brush
} from "recharts";
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';

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
];

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
const mockClientProjectData = [
  { month: "Jan", clientes: 5, projetos: 3 },
  { month: "Fev", clientes: 6, projetos: 4 },
  { month: "Mar", clientes: 8, projetos: 5 },
  { month: "Abr", clientes: 7, projetos: 6 },
  { month: "Mai", clientes: 9, projetos: 8 },
  { month: "Jun", clientes: 11, projetos: 9 },
];
const mockGoalsData = [
  { month: "Jan", meta: 10000, atingido: 8000 },
  { month: "Fev", meta: 10000, atingido: 8500 },
  { month: "Mar", meta: 12000, atingido: 11000 },
  { month: "Abr", meta: 12000, atingido: 12500 },
  { month: "Mai", meta: 15000, atingido: 14000 },
  { month: "Jun", meta: 15000, atingido: 16000 },
];
const mockAccumulatedData = [
  { name: 'Projetos', value: 125000 },
  { name: 'Orçamento', value: 85000 },
  { name: 'Metas', value: 45000 },
];
const mockSpendingTimelineData = [
  { date: '01/07', gastos: 250 },
  { date: '05/07', gastos: 450 },
  { date: '10/07', gastos: 300 },
  { date: '15/07', gastos: 600 },
  { date: '20/07', gastos: 550 },
  { date: '25/07', gastos: 700 },
];
const mockOverallSpendingData = [
  { name: 'Serviços', value: 4500, fill: chartColors[0] },
  { name: 'Marketing', value: 2500, fill: chartColors[1] },
  { name: 'Infraestrutura', value: 1800, fill: chartColors[2] },
  { name: 'Equipe', value: 8000, fill: chartColors[3] },
  { name: 'Outros', value: 1200, fill: chartColors[4] },
];
const mockRadarGeneralData = [
  { subject: 'Receita', A: 85, fullMark: 100 },
  { subject: 'Lucratividade', A: 70, fullMark: 100 },
  { subject: 'Satisfação', A: 90, fullMark: 100 },
  { subject: 'Novos Clientes', A: 60, fullMark: 100 },
  { subject: 'Retenção', A: 80, fullMark: 100 },
];
const mockTop3SpendingData = [
  { name: 'Equipe', value: 8000, fill: chartColors[3] },
  { name: 'Serviços', value: 4500, fill: chartColors[0] },
  { name: 'Marketing', value: 2500, fill: chartColors[1] },
];
const mockYieldData = { value: 8.5 };
const mockTaxData = { value: 22.5 };
const mockComparativeData = [
  { month: 'Q1', '2023': 4000, '2024': 5500 },
  { month: 'Q2', '2023': 3000, '2024': 4800 },
  { month: 'Q3', '2023': 5000, '2024': 6200 },
  { month: 'Q4', '2023': 4500, '2024': 7100 },
];

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

const businessChartConfig: ChartConfig = {
  clientes: { label: "Clientes", color: "hsl(var(--chart-1))" },
  projetos: { label: "Projetos", color: "hsl(var(--chart-2))" },
  meta: { label: "Meta", color: "hsl(var(--muted-foreground))" },
  atingido: { label: "Atingido", color: "hsl(var(--chart-1))" },
  gastos: { label: "Gastos", color: "hsl(var(--chart-2))" },
  '2023': { label: '2023', color: 'hsl(var(--chart-3))' },
  '2024': { label: '2024', color: 'hsl(var(--chart-1))' },
  performance: { label: "Performance", color: "hsl(var(--chart-1))" },
  rendimento: { label: "Rendimento", color: "hsl(var(--chart-1))"},
  imposto: { label: "Imposto", color: "hsl(var(--chart-2))" },
};

const PieLabel = (props: PieSectorDataItem) => {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, name, percent, fill } = props;
    if (!name || !percent || !outerRadius) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    
    return (
        <text
            x={x}
            y={y}
            textAnchor={textAnchor}
            dominantBaseline="central"
            className="text-xs fill-foreground"
        >
            <tspan x={x} dy="-0.6em" fill={fill} className="font-semibold">{name}</tspan>
            <tspan x={x} dy="1.1em">{`(${(percent * 100).toFixed(0)}%)`}</tspan>
        </text>
    );
};

export default function AnalysisPage() {
  const [timePeriod, setTimePeriod] = useState("monthly");

  useEffect(() => {
    document.title = `Análise Financeira - ${APP_NAME}`;
  }, []);

  const spendingByCategory = mockSpendingByCategory;
  const incomeBySource = mockIncomeBySource;
  const monthlyEvolution = mockMonthlyEvolution;
  const topExpenses = mockTopExpenses;

  const realDataChartConfig = useMemo(() => ({
    Receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
    Despesas: { label: "Despesas", color: "hsl(var(--chart-2))" },
  }), []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análise Financeira Detalhada"
        description="Explore seus padrões de gastos, receitas e tendências ao longo do tempo."
        icon={<Wallet className="h-6 w-6 text-primary"/>}
        actions={
          <Select value={timePeriod} onValueChange={setTimePeriod}>
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
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-primary" />Gastos por Categoria</CardTitle><CardDescription>Distribuição das suas despesas ({timePeriod === 'monthly' ? 'este mês' : 'total'}).</CardDescription></CardHeader>
                <CardContent className="h-80 sm:h-96">
                    <ChartContainer config={{}} className="min-h-[200px] w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                <RechartsTooltip content={<RealDataPieCustomTooltip />} />
                                <Pie data={spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={true} label={<PieLabel />}>
                                    {spendingByCategory.map((entry, index) => (<Cell key={`cell-spending-${index}`} fill={entry.fill} />))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-emerald-500" />Fontes de Renda</CardTitle><CardDescription>De onde vêm suas receitas ({timePeriod === 'monthly' ? 'este mês' : 'total'}).</CardDescription></CardHeader>
                 <CardContent className="h-80 sm:h-96">
                    <ChartContainer config={{}} className="min-h-[200px] w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                                <RechartsTooltip content={<RealDataPieCustomTooltip />} />
                                <Pie data={incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={true} label={<PieLabel />}>
                                    {incomeBySource.map((entry, index) => (<Cell key={`cell-income-${index}`} fill={entry.fill} />))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><TrendingDown className="mr-2 h-5 w-5 text-destructive" />Top 3 Despesas</CardTitle><CardDescription>Maiores gastos no período.</CardDescription></CardHeader>
                <CardContent className="h-80 sm:h-96 overflow-y-auto">
                    <Table size="sm">
                        <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                        <TableBody>{topExpenses.map(tx => (<TableRow key={tx.id}><TableCell className="font-medium text-xs truncate max-w-[120px] sm:max-w-none" title={tx.description}>{tx.description}<br/><span className="text-muted-foreground text-[10px]">{tx.categoryName} - {tx.date}</span></TableCell><TableCell className="text-right text-xs"><PrivateValue value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="text-destructive/80" /></TableCell></TableRow>))}</TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-3 shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><AreaIconLucide className="mr-2 h-5 w-5 text-primary" />Evolução Mensal (Últimos 12 Meses)</CardTitle><CardDescription>Suas receitas vs. despesas ao longo do tempo.</CardDescription></CardHeader>
                <CardContent className="h-80 sm:h-96 overflow-hidden">
                    <ChartContainer config={realDataChartConfig} className="min-h-[300px] w-full h-full">
                        <ResponsiveContainer width="99%" height="100%">
                            <AreaChart accessibilityLayer data={monthlyEvolution} margin={{ top: 20, right: 30, left: 10, bottom: 70 }}>
                                <defs>
                                    <linearGradient id="fillReceitasEvolution" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Receitas)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-Receitas)" stopOpacity={0.1}/></linearGradient>
                                    <linearGradient id="fillDespesasEvolution" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-Despesas)" stopOpacity={0.7}/><stop offset="95%" stopColor="var(--color-Despesas)" stopOpacity={0.1}/></linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} interval={0} angle={-45} textAnchor="end" height={80} dy={10} tick={{ fontSize: '0.65rem' }} />
                                <YAxis tickFormatter={(value) => `R$${Number(value / 1000).toFixed(0)}k`} tick={{ fontSize: '0.65rem' }} tickLine={false} axisLine={false} tickMargin={5} dx={-5} width={60} />
                                <ChartTooltip cursor={false} content={<RealDataCustomTooltip />} />
                                <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '15px', fontSize: '12px', paddingTop: '5px'}}/>
                                <Area type="monotone" dataKey="Receitas" stroke="var(--color-Receitas)" fillOpacity={1} fill="url(#fillReceitasEvolution)" stackId="1" name="Receitas" />
                                <Area type="monotone" dataKey="Despesas" stroke="var(--color-Despesas)" fillOpacity={1} fill="url(#fillDespesasEvolution)" stackId="2" name="Despesas" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
      </div>

      <PageHeader title="Galeria de Análises de Negócio" description="Demonstração de métricas de projetos e clientes." icon={<BarIconLucide className="h-6 w-6 text-primary"/>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Users2 className="mr-2 h-5 w-5 text-primary"/>Clientes e Projetos</CardTitle><CardDescription>Evolução de novos clientes e projetos.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={businessChartConfig} className="w-full h-full">
              <AreaChart accessibilityLayer data={mockClientProjectData} margin={{left: 0, right: 12}}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                <YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area dataKey="clientes" type="natural" fill="var(--color-clientes)" fillOpacity={0.4} stroke="var(--color-clientes)" stackId="a" />
                <Area dataKey="projetos" type="natural" fill="var(--color-projetos)" fillOpacity={0.4} stroke="var(--color-projetos)" stackId="b" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Trophy className="mr-2 h-5 w-5 text-primary"/>Progresso de Metas</CardTitle><CardDescription>Valores atingidos vs. metas mensais.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={businessChartConfig} className="w-full h-full">
              <AreaChart accessibilityLayer data={mockGoalsData} margin={{left: 0, right: 12}}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                <YAxis tickFormatter={(value) => `${(value / 1000)}k`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillAtingido" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-atingido)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-atingido)" stopOpacity={0.1} /></linearGradient>
                </defs>
                <Line dataKey="meta" type="monotone" stroke="var(--color-meta)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Area dataKey="atingido" type="natural" fill="url(#fillAtingido)" stroke="var(--color-atingido)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><DollarSign className="mr-2 h-5 w-5 text-primary"/>Totais Acumulados</CardTitle><CardDescription>Valores totais de projetos e orçamentos.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={businessChartConfig} className="w-full h-full">
              <BarChart accessibilityLayer data={mockAccumulatedData} layout="vertical" margin={{right: 30, left: 10}}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={5} axisLine={false} className="capitalize text-xs"/>
                <XAxis type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" layout="vertical" fill="var(--color-clientes)" radius={4}>
                  <LabelList dataKey="value" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(value: number) => `R$${(value / 1000)}k`} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Banknote className="mr-2 h-5 w-5 text-primary"/>Orçamento Atingido</CardTitle><CardDescription>Acompanhamento de gastos ao longo do tempo.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={businessChartConfig} className="w-full h-full">
              <LineChart accessibilityLayer data={mockSpendingTimelineData} margin={{top: 20, left: 0, right: 12}}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => `R$${value}`}/>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line dataKey="gastos" type="monotone" stroke="var(--color-gastos)" strokeWidth={2} dot={{fill: "var(--color-gastos)"}} activeDot={{ r: 6 }}>
                   <LabelList dataKey="gastos" position="top" offset={12} className="fill-foreground" fontSize={12} formatter={(value: number) => `R$${value}`} />
                </Line>
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><PieIconLucide className="mr-2 h-5 w-5 text-primary"/>Gastos Gerais</CardTitle><CardDescription>Distribuição geral de despesas do negócio.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ChartContainer config={businessChartConfig} className="w-full max-w-[250px] aspect-square">
              <PieChart>
                <RechartsTooltip content={<RealDataPieCustomTooltip />} />
                <Pie data={mockOverallSpendingData} dataKey="value" nameKey="name" label={<PieLabel />} labelLine={{stroke: "hsl(var(--muted-foreground))"}}/>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><RadarIconLucide className="mr-2 h-5 w-5 text-primary"/>Visão Geral do Negócio</CardTitle><CardDescription>Indicadores de performance chave.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={businessChartConfig} className="w-full h-full">
              <RadarChart data={mockRadarGeneralData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Performance" dataKey="A" stroke="var(--color-performance)" fill="var(--color-performance)" fillOpacity={0.6} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><TrendingDown className="mr-2 h-5 w-5 text-destructive"/>Top 3 Maiores Gastos</CardTitle><CardDescription>Focos de despesa do período.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ChartContainer config={businessChartConfig} className="w-full max-w-[250px] aspect-square">
              <RadialBarChart data={mockTop3SpendingData} innerRadius="30%" outerRadius="80%" startAngle={90} endAngle={450}>
                <PolarAngleAxis type="number" domain={[0, 8000]} dataKey="value" tick={false} />
                <RadialBar dataKey="value" background>
                  <LabelList position="insideStart" dataKey="name" className="fill-white text-xs" fontSize={10}/>
                </RadialBar>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-emerald-500"/>Rendimento Médio</CardTitle><CardDescription>Percentual de rendimento médio.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ChartContainer config={businessChartConfig} className="w-full max-w-[250px] aspect-square">
              <RadialBarChart data={[mockYieldData]} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" barSize={10} startAngle={90} endAngle={450}>
                <PolarAngleAxis type="number" domain={[0, 10]} dataKey="value" tick={false} />
                <RadialBar dataKey="value" background cornerRadius={5} fill="var(--color-rendimento)" />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-semibold">
                  {`${mockYieldData.value.toFixed(1)}%`}
                </text>
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><Percent className="mr-2 h-5 w-5 text-primary"/>Alíquota de Imposto</CardTitle><CardDescription>Simulação de alíquota efetiva.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
             <ChartContainer config={businessChartConfig} className="w-full max-w-[300px] aspect-square">
               <RadialBarChart data={[mockTaxData, {value: 100-mockTaxData.value}]} innerRadius={50} outerRadius={100} barSize={10} startAngle={90} endAngle={450}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={5}>
                    <Cell fill="var(--color-imposto)" />
                    <Cell fill="var(--color-muted)" />
                </RadialBar>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-semibold">
                  {`${mockTaxData.value.toFixed(1)}%`}
                </text>
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="font-headline flex items-center"><BarIconLucide className="mr-2 h-5 w-5 text-primary"/>Comparativo Anual (Trimestral)</CardTitle><CardDescription>Comparação de performance entre 2023 e 2024.</CardDescription></CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={businessChartConfig} className="w-full h-full">
              <BarChart accessibilityLayer data={mockComparativeData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickFormatter={(value) => `R$${(value / 1000)}k`}/>
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="2023" fill="var(--color-2023)" radius={4} />
                <Bar dataKey="2024" fill="var(--color-2024)" radius={4} />
                <Brush dataKey="month" height={30} stroke="hsl(var(--muted-foreground))" travellerWidth={20} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
