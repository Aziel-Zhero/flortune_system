// src/app/(app)/analysis/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrivateValue } from "@/components/shared/private-value";
import { 
  PieChart as PieIconLucide, 
  AlertTriangle, 
  Wallet, 
  TrendingDown,
  AreaChart as AreaIconLucide,
  BarChart3 as BarIconLucide, 
  Radar as RadarIconLucide, 
  Target as RadialIconLucide,
  LineChart as LineIconLucideReal // Renomeado para evitar conflito
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_NAME } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { getTransactions } from "@/services/transaction.service";
import type { Transaction } from "@/types/database.types";
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
  LineChart, // Este é o componente do Recharts
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
import { toast } from "@/hooks/use-toast";

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

const mockMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const mockAreaData = mockMonths.map(month => ({ month, desktop: Math.floor(Math.random() * 200) + 100, mobile: Math.floor(Math.random() * 150) + 50 }));
const mockBarData = mockMonths.map(month => ({ month, desktop: Math.floor(Math.random() * 200) + 100, mobile: Math.floor(Math.random() * 150) + 50 }));
const mockLineData = mockMonths.map(month => ({ month, desktop: Math.floor(Math.random() * 200) + 100, mobile: Math.floor(Math.random() * 150) + 50 }));
const mockPieData = [
  { name: 'Alimentação', value: 400, fill: 'var(--color-food)' },
  { name: 'Transporte', value: 300, fill: 'var(--color-transport)' },
  { name: 'Lazer', value: 300, fill: 'var(--color-leisure)' },
  { name: 'Moradia', value: 200, fill: 'var(--color-housing)' },
];
const mockRadarData = [
  { subject: 'Matemática', A: 120, B: 110, fullMark: 150 },
  { subject: 'Chinês', A: 98, B: 130, fullMark: 150 },
  { subject: 'Inglês', A: 86, B: 130, fullMark: 150 },
  { subject: 'Geografia', A: 99, B: 100, fullMark: 150 },
  { subject: 'Física', A: 85, B: 90, fullMark: 150 },
  { subject: 'História', A: 65, B: 85, fullMark: 150 },
];
const mockRadialData = [
  { name: 'Meta A', uv: 31.47, pv: 2400, fill: 'var(--color-goalA)' },
  { name: 'Meta B', uv: 26.69, pv: 4567, fill: 'var(--color-goalB)' },
  { name: 'Meta C', uv: 15.69, pv: 1398, fill: 'var(--color-goalC)' },
];

const genericChartConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
  mobile: { label: "Mobile", color: "hsl(var(--chart-2))" },
  food: { label: "Alimentação", color: "hsl(var(--chart-1))" },
  transport: { label: "Transporte", color: "hsl(var(--chart-2))" },
  leisure: { label: "Lazer", color: "hsl(var(--chart-3))" },
  housing: { label: "Moradia", color: "hsl(var(--chart-4))" },
  serieA: { label: "Série A", color: "hsl(var(--chart-1))" },
  serieB: { label: "Série B", color: "hsl(var(--chart-2))" },
  goalA: { label: "Meta A", color: "hsl(var(--chart-3))" },
  goalB: { label: "Meta B", color: "hsl(var(--chart-4))" },
  goalC: { label: "Meta C", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;


export default function AnalysisPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === "loading";

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(true);
  const [timePeriod, setTimePeriod] = useState("monthly");

  useEffect(() => {
    document.title = `Análise Financeira - ${APP_NAME}`;
  }, []);

  useEffect(() => {
    if (!user?.id || authLoading) {
      setIsFetchingTransactions(authLoading);
      if (!authLoading && !user?.id) setAllTransactions([]);
      return;
    }
    const fetchAllTransactions = async () => {
      setIsFetchingTransactions(true);
      try {
        const { data, error } = await getTransactions(user.id);
        if (error) {
          toast({ title: "Erro ao buscar transações", description: error.message, variant: "destructive" });
          setAllTransactions([]);
        } else {
          setAllTransactions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        toast({ title: "Erro inesperado", description: "Não foi possível carregar os dados de transação.", variant: "destructive" });
        setAllTransactions([]);
      } finally {
        setIsFetchingTransactions(false);
      }
    };
    fetchAllTransactions();
  }, [user?.id, authLoading]);

  const filteredTransactionsForPeriod = useMemo(() => {
    if (!Array.isArray(allTransactions) || allTransactions.length === 0) return [];
    return allTransactions.filter(tx => {
      if (timePeriod === "all") return true;
      if (!tx || !tx.date || typeof tx.date !== 'string') return false;
      try {
        const txDate = new Date(tx.date + "T00:00:00Z");
        if (isNaN(txDate.getTime())) return false;
        const now = new Date();
        if (timePeriod === "monthly") return txDate.getUTCMonth() === now.getUTCMonth() && txDate.getUTCFullYear() === now.getUTCFullYear();
        if (timePeriod === "yearly") return txDate.getUTCFullYear() === now.getUTCFullYear();
      } catch(e) { console.error("Error parsing transaction date:", tx.date, e); return false; }
      return true;
    });
  }, [allTransactions, timePeriod]);

  const spendingByCategory = useMemo((): CategoryData[] => {
    if (!Array.isArray(filteredTransactionsForPeriod) || filteredTransactionsForPeriod.length === 0) return [];
    const spendingMap = new Map<string, number>();
    filteredTransactionsForPeriod
      .filter(tx => tx?.type === 'expense' && typeof tx.amount === 'number' && tx.amount > 0)
      .forEach(tx => {
        const categoryName = tx.category?.name || 'Outros';
        spendingMap.set(categoryName, (spendingMap.get(categoryName) || 0) + tx.amount);
      });
    if (spendingMap.size === 0) return [];
    return Array.from(spendingMap, ([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a,b) => b.value - a.value);
  }, [filteredTransactionsForPeriod]);

  const incomeBySource = useMemo((): CategoryData[] => {
    if (!Array.isArray(filteredTransactionsForPeriod) || filteredTransactionsForPeriod.length === 0) return [];
    const incomeMap = new Map<string, number>();
    filteredTransactionsForPeriod
      .filter(tx => tx?.type === 'income' && typeof tx.amount === 'number' && tx.amount > 0)
      .forEach(tx => {
        const categoryName = tx.category?.name || 'Outras Receitas';
        incomeMap.set(categoryName, (incomeMap.get(categoryName) || 0) + tx.amount);
      });
    if (incomeMap.size === 0) return [];
    return Array.from(incomeMap, ([name, value], index) => ({ name, value, fill: chartColors[(index + 1) % chartColors.length] })).sort((a,b) => b.value - a.value);
  }, [filteredTransactionsForPeriod]);

  const monthlyEvolution = useMemo((): MonthlyEvolutionData[] => {
    if (!Array.isArray(allTransactions) || allTransactions.length === 0) return [];
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    const today = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getUTCFullYear(), today.getUTCMonth() - i, 1);
        const monthKey = `${monthNames[date.getUTCMonth()]}/${date.getUTCFullYear().toString().slice(-2)}`;
        monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    allTransactions.forEach(tx => {
      if (!tx?.date || typeof tx.date !== 'string' || typeof tx.amount !== 'number') return;
      try {
        const txDate = new Date(tx.date + "T00:00:00Z");
        if (isNaN(txDate.getTime())) return;
        const monthKey = `${monthNames[txDate.getUTCMonth()]}/${txDate.getUTCFullYear().toString().slice(-2)}`;
        if (monthlyData[monthKey] !== undefined) {
            if (tx.type === 'income' && tx.amount > 0) monthlyData[monthKey].income += tx.amount;
            else if (tx.type === 'expense' && tx.amount > 0) monthlyData[monthKey].expense += tx.amount;
        }
      } catch(e) { console.error("Error processing tx for monthlyEvolution:", tx.date, e); }
    });
    return Object.entries(monthlyData).map(([month, data]) => ({ month, Receitas: data.income, Despesas: data.expense }));
  }, [allTransactions]);

  const topExpenses = useMemo((): TopExpense[] => {
    if (!Array.isArray(filteredTransactionsForPeriod) || filteredTransactionsForPeriod.length === 0) return [];
    return filteredTransactionsForPeriod
        .filter(tx => tx?.type === 'expense' && typeof tx.amount === 'number' && tx.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(tx => ({
            id: tx.id,
            description: tx.description || "N/A",
            amount: tx.amount,
            date: tx.date ? new Date(tx.date + "T00:00:00Z").toLocaleDateString('pt-BR') : "N/A",
            categoryName: tx.category?.name || "Sem Categoria"
        }));
  }, [filteredTransactionsForPeriod]);

  const realDataChartConfig = useMemo(() => ({
    Receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
    Despesas: { label: "Despesas", color: "hsl(var(--chart-2))" },
  }), []);

  const isLoadingPage = authLoading || (isFetchingTransactions && status === 'authenticated' && !!user);

  if (isLoadingPage) {
    return (
      <div className="space-y-8">
        <PageHeader title="Análise Financeira" description="Carregando seus insights financeiros..." icon={<Wallet className="h-6 w-6 text-primary"/>} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => ( <Card key={`sk-card-pie-${i}`} className="shadow-sm lg:col-span-1"><CardHeader><Skeleton className="h-6 w-3/4 mb-1"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card> ))}
          <Card className="md:col-span-2 lg:col-span-3"><CardHeader><Skeleton className="h-6 w-1/2 mb-1"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent><Skeleton className="h-96 w-full"/></CardContent></Card>
        </div>
         <PageHeader title="Galeria de Exemplos de Gráficos" description="Carregando demonstrações..." icon={<BarIconLucide className="h-6 w-6 text-primary"/>} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {[...Array(6)].map((_, i) => ( <Card key={`sk-gallery-${i}`}><CardHeader><Skeleton className="h-5 w-1/2" /><Skeleton className="h-3 w-3/4 mt-1" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>))}
        </div>
      </div>
    );
  }

  const noTransactionsAtAll = !isFetchingTransactions && allTransactions.length === 0;
  const noDataForSelectedPeriod = !isFetchingTransactions && (timePeriod === "monthly" || timePeriod === "yearly") && spendingByCategory.length === 0 && incomeBySource.length === 0 && topExpenses.length === 0;

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
      {noTransactionsAtAll ? (
        <Card className="shadow-sm text-center py-12 col-span-full">
            <CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" /><CardTitle className="mt-4">Nenhuma Transação Registrada</CardTitle></CardHeader>
            <CardContent><CardDescription>Adicione transações para começar a ver suas análises financeiras.</CardDescription></CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {noDataForSelectedPeriod && timePeriod !== 'all' ? (
                 <Card className="shadow-sm text-center py-12 md:col-span-2 lg:col-span-3">
                    <CardHeader><AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" /><CardTitle className="mt-4">Sem Dados para o Período</CardTitle></CardHeader>
                    <CardContent><CardDescription>Não há transações no período selecionado. Tente um período diferente ou adicione novas transações.</CardDescription></CardContent>
                </Card>
            ) : (
                <>
                    <Card className="shadow-sm">
                        <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-primary" />Gastos por Categoria</CardTitle><CardDescription>Distribuição das suas despesas ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription></CardHeader>
                        <CardContent className="h-[320px] sm:h-80">
                            {spendingByCategory.length > 0 ? (
                                <ChartContainer config={realDataChartConfig} className="min-h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <RechartsTooltip content={<RealDataPieCustomTooltip />} />
                                            <Pie data={spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => (percent && name ? `${name} (${(percent * 100).toFixed(0)}%)` : '')}>
                                                {spendingByCategory.map((entry, index) => (<Cell key={`cell-spending-${index}`} fill={entry.fill} />))}
                                            </Pie>
                                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem dados de despesas.</p></div>}
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-emerald-500" />Fontes de Renda</CardTitle><CardDescription>De onde vêm suas receitas ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription></CardHeader>
                        <CardContent className="h-[320px] sm:h-80">
                            {incomeBySource.length > 0 ? (
                                <ChartContainer config={realDataChartConfig} className="min-h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <RechartsTooltip content={<RealDataPieCustomTooltip />} />
                                            <Pie data={incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => (percent && name ? `${name} (${(percent * 100).toFixed(0)}%)` : '')}>
                                                {incomeBySource.map((entry, index) => (<Cell key={`cell-income-${index}`} fill={entry.fill} />))}
                                            </Pie>
                                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem dados de receitas.</p></div>}
                        </CardContent>
                    </Card>
                    <Card className="shadow-sm">
                        <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><TrendingDown className="mr-2 h-5 w-5 text-destructive" />Top 5 Despesas</CardTitle><CardDescription>Maiores gastos no período.</CardDescription></CardHeader>
                        <CardContent className="h-[320px] sm:h-80 overflow-y-auto">
                            {topExpenses.length > 0 ? (
                                <Table size="sm">
                                    <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                                    <TableBody>{topExpenses.map(tx => (<TableRow key={tx.id}><TableCell className="font-medium text-xs truncate max-w-[120px] sm:max-w-none" title={tx.description}>{tx.description}<br/><span className="text-muted-foreground text-[10px]">{tx.categoryName} - {tx.date}</span></TableCell><TableCell className="text-right text-xs"><PrivateValue value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="text-destructive/80" /></TableCell></TableRow>))}</TableBody>
                                </Table>
                            ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem despesas para listar.</p></div>}
                        </CardContent>
                    </Card>
                </>
            )}
            <Card className="md:col-span-2 lg:col-span-3 shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><AreaIconLucide className="mr-2 h-5 w-5 text-primary" />Evolução Mensal (Últimos 12 Meses)</CardTitle><CardDescription>Suas receitas vs. despesas ao longo do tempo.</CardDescription></CardHeader>
                <CardContent className="h-80 sm:h-96 overflow-hidden">
                    {monthlyEvolution.length > 0 && monthlyEvolution.some(d => d.Receitas > 0 || d.Despesas > 0) ? (
                        <ChartContainer config={realDataChartConfig} className="min-h-[300px] w-full h-full">
                            <ResponsiveContainer width="99%" height="100%">
                                <AreaChart
                                    accessibilityLayer
                                    data={monthlyEvolution}
                                    margin={{
                                        top: 20, 
                                        right: 30, 
                                        left: 10,  
                                        bottom: 70, 
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="fillReceitasEvolution" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-Receitas)" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="var(--color-Receitas)" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="fillDespesasEvolution" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-Despesas)" stopOpacity={0.7}/>
                                            <stop offset="95%" stopColor="var(--color-Despesas)" stopOpacity={0.1}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10} 
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80} 
                                        dy={10}    
                                        tick={{ fontSize: '0.65rem' }}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `R$${Number(value / 1000).toFixed(0)}k`}
                                        tick={{ fontSize: '0.65rem' }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={5} 
                                        dx={-5}    
                                        width={60} 
                                    />
                                    <ChartTooltip cursor={false} content={<RealDataCustomTooltip />} />
                                    <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '15px', fontSize: '12px', paddingTop: '5px'}}/>
                                    <Area type="monotone" dataKey="Receitas" stroke="var(--color-Receitas)" fillOpacity={1} fill="url(#fillReceitasEvolution)" stackId="1" name="Receitas" />
                                    <Area type="monotone" dataKey="Despesas" stroke="var(--color-Despesas)" fillOpacity={1} fill="url(#fillDespesasEvolution)" stackId="2" name="Despesas" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    ) : <div className="flex items-center justify-center h-full text-muted-foreground"><p>Sem dados suficientes para exibir a evolução.</p></div>}
                </CardContent>
            </Card>
        </div>
      )}

      <PageHeader title="Galeria de Exemplos de Gráficos" description="Demonstração de diferentes tipos de gráficos." icon={<BarIconLucide className="h-6 w-6 text-primary"/>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><AreaIconLucide className="mr-2 h-5 w-5 text-primary"/>Area Chart - Interactive (Mock)</CardTitle><CardDescription>Passe o mouse para ver detalhes.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <AreaChart accessibilityLayer data={mockAreaData} margin={{left: 12, right: 12}}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Area dataKey="mobile" type="natural" fill="var(--color-mobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
                <Area dataKey="desktop" type="natural" fill="var(--color-desktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><AreaIconLucide className="mr-2 h-5 w-5 text-primary"/>Area Chart - Gradient (Mock)</CardTitle><CardDescription>Com preenchimento gradiente.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <AreaChart accessibilityLayer data={mockAreaData} margin={{left: 12, right: 12}}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="fillDesktopExample" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area dataKey="desktop" type="natural" fill="url(#fillDesktopExample)" stroke="var(--color-desktop)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><BarIconLucide className="mr-2 h-5 w-5 text-primary"/>Bar Chart - Custom Label (Mock)</CardTitle><CardDescription>Barras com rótulos personalizados.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <BarChart accessibilityLayer data={mockBarData} layout="vertical" margin={{right: 30}}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="month" type="category" tickLine={false} tickMargin={10} axisLine={false} className="capitalize"/>
                <XAxis dataKey="desktop" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" layout="vertical" fill="var(--color-desktop)" radius={4}>
                  <LabelList dataKey="desktop" position="right" offset={8} className="fill-foreground" fontSize={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><BarIconLucide className="mr-2 h-5 w-5 text-primary"/>Bar Chart - Stacked (Mock)</CardTitle><CardDescription>Barras empilhadas com legenda.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <BarChart accessibilityLayer data={mockBarData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><LineIconLucideReal className="mr-2 h-5 w-5 text-primary"/>Line Chart - Label (Mock)</CardTitle><CardDescription>Linhas com rótulos nos pontos.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <LineChart accessibilityLayer data={mockLineData} margin={{top: 20, left: 12, right: 12}}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line dataKey="desktop" type="natural" stroke="var(--color-desktop)" strokeWidth={2} dot={{fill: "var(--color-desktop)"}} activeDot={{ r: 6 }} >
                  <LabelList dataKey="desktop" position="top" offset={12} className="fill-foreground" fontSize={12} />
                </Line>
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><LineIconLucideReal className="mr-2 h-5 w-5 text-primary"/>Line Chart - Interactive (Mock)</CardTitle><CardDescription>Linhas com tooltip e brush.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <LineChart accessibilityLayer data={mockLineData} margin={{left:12, right:12}}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                <YAxis tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line"/>} />
                <Line dataKey="desktop" type="natural" stroke="var(--color-desktop)" strokeWidth={2} dot={false} activeDot={{r:6}}/>
                <Line dataKey="mobile" type="natural" stroke="var(--color-mobile)" strokeWidth={2} dot={false} activeDot={{r:6}}/>
                <Brush dataKey="month" height={30} stroke="hsl(var(--muted-foreground))" travellerWidth={15} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><PieIconLucide className="mr-2 h-5 w-5 text-primary"/>Pie Chart - Interactive (Mock)</CardTitle><CardDescription>Passe o mouse para ver detalhes.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ChartContainer config={genericChartConfig} className="w-full max-w-[250px] aspect-square">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                <Pie data={mockPieData} dataKey="value" nameKey="name" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><PieIconLucide className="mr-2 h-5 w-5 text-primary"/>Pie Chart - Label (Mock)</CardTitle><CardDescription>Gráfico de Pizza com rótulos.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ChartContainer config={genericChartConfig} className="w-full max-w-[250px] aspect-square">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={mockPieData} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={{stroke: "hsl(var(--muted-foreground))"}} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><RadarIconLucide className="mr-2 h-5 w-5 text-primary"/>Radar Chart - Circle (Mock)</CardTitle><CardDescription>Grid circular com área preenchida.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <RadarChart data={mockRadarData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarGrid gridType="circle" />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar name="Série A" dataKey="A" stroke="var(--color-serieA)" fill="var(--color-serieA)" fillOpacity={0.6} />
                <ChartLegend content={<ChartLegendContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><RadarIconLucide className="mr-2 h-5 w-5 text-primary"/>Radar Chart - Polygon (Mock)</CardTitle><CardDescription>Grid poligonal com múltiplas séries.</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <RadarChart data={mockRadarData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar name="Série A" dataKey="A" stroke="var(--color-serieA)" fill="var(--color-serieA)" fillOpacity={0.6} />
                <Radar name="Série B" dataKey="B" stroke="var(--color-serieB)" fill="var(--color-serieB)" fillOpacity={0.5} />
                <ChartLegend content={<ChartLegendContent />} />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><RadialIconLucide className="mr-2 h-5 w-5 text-primary"/>Radial Bar - Label (Mock)</CardTitle><CardDescription>Com rótulos nas barras.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ChartContainer config={genericChartConfig} className="w-full max-w-[250px] aspect-square">
              <RadialBarChart data={mockRadialData} innerRadius="20%" outerRadius="80%" startAngle={90} endAngle={450}>
                <PolarAngleAxis type="number" domain={[0, 100]} dataKey="uv" tick={false} />
                <RadialBar dataKey="uv" background>
                  <LabelList position="insideStart" dataKey="name" className="fill-white text-xs" fontSize={10}/>
                </RadialBar>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-headline flex items-center"><RadialIconLucide className="mr-2 h-5 w-5 text-primary"/>Radial Bar - Center (Mock)</CardTitle><CardDescription>Com texto no centro.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ChartContainer config={genericChartConfig} className="w-full max-w-[250px] aspect-square">
              <RadialBarChart data={[mockRadialData[0]]} 
                cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" barSize={10} startAngle={90} endAngle={450}>
                <PolarAngleAxis type="number" domain={[0, 100]} dataKey="uv" tick={false} />
                <RadialBar dataKey="uv" background cornerRadius={5} />
                <RechartsTooltip content={<ChartTooltipContent nameKey="name" hideIndicator />} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-semibold">
                  {`${mockRadialData[0].uv.toFixed(0)}%`}
                </text>
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="font-headline flex items-center"><RadialIconLucide className="mr-2 h-5 w-5 text-primary"/>Radial Bar - Multiple (Mock)</CardTitle><CardDescription>Múltiplas barras radiais.</CardDescription></CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
             <ChartContainer config={genericChartConfig} className="w-full max-w-[300px] aspect-square">
               <RadialBarChart data={mockRadialData} 
                  innerRadius={20}
                  outerRadius={100}
                  barSize={10}
                  startAngle={180}
                  endAngle={0}
                >
                <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} />
                <RadialBar dataKey="uv" />
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <ChartLegend content={<ChartLegendContent nameKey="name" verticalAlign="bottom"/>} />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-headline flex items-center"><BarIconLucide className="mr-2 h-5 w-5 text-primary"/>Bar Chart - Interactive (Mock)</CardTitle><CardDescription>Com brush e tooltip customizado.</CardDescription></CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={genericChartConfig} className="w-full h-full">
              <BarChart accessibilityLayer data={mockBarData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                <YAxis tickMargin={8}/>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dashed"
                      nameKey="name"
                      hideLabel
                      formatter={(value, name, item) => (
                        <div className="flex flex-col gap-0.5">
                           <span className="font-medium capitalize" style={{color: item.color}}>{name}</span>
                           <span className="text-muted-foreground text-xs">Mês: {item.payload.month}</span>
                           <span className="text-foreground font-bold">Valor: {value}</span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                <Brush dataKey="month" height={30} stroke="hsl(var(--muted-foreground))" travellerWidth={20} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
