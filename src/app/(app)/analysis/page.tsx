// src/app/(app)/analysis/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrivateValue } from "@/components/shared/private-value";
import { 
  PieChart as PieIconLucide, 
  Wallet, 
  TrendingDown,
  AreaChart as AreaIconLucide,
  AlertTriangle,
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
  type ChartConfig
} from "@/components/ui/chart";
import {
  AreaChart, 
  Area,      
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart, 
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTransactions } from "@/services/transaction.service";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import type { Transaction } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";


interface CategoryData {
  name: string;
  value: number;
  fill: string;
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
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
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("monthly");

  const fetchTransactions = useCallback(async () => {
    const mockUserId = "mock-user-id";
    setIsLoading(true);
    const { data, error } = await getTransactions(mockUserId);
    if (error) {
      toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
    } else {
      setTransactions(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    document.title = `Análise Financeira - ${APP_NAME}`;
    fetchTransactions();
  }, [fetchTransactions]);

  const { spendingByCategory, incomeBySource, topExpenses, monthlyEvolution } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();
    
    const spendingMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();
    
    const monthlyEvolutionMap = new Map<string, { Receitas: number; Despesas: number }>();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1);
        const monthKey = `${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
        monthlyEvolutionMap.set(monthKey, { Receitas: 0, Despesas: 0 });
    }

    const filteredTransactions = transactions.filter(tx => {
        if (!tx.date) return false;
        const txDate = new Date(tx.date + 'T00:00:00Z');
        if (timePeriod === 'monthly') return txDate.getUTCMonth() === currentMonth && txDate.getUTCFullYear() === currentYear;
        if (timePeriod === 'yearly') return txDate.getUTCFullYear() === currentYear;
        return true;
    });

    for(const tx of transactions) { // Monthly evolution uses all transactions
        if(!tx.date) continue;
        const txDate = new Date(tx.date + 'T00:00:00Z');
        const monthKey = `${txDate.getUTCMonth() + 1}/${txDate.getUTCFullYear()}`;
        const monthData = monthlyEvolutionMap.get(monthKey);
        if (monthData) {
            if(tx.type === 'income') monthData.Receitas += tx.amount;
            else if(tx.type === 'expense') monthData.Despesas += tx.amount;
        }
    }
    
    for (const tx of filteredTransactions) {
      if (tx.type === 'expense' && tx.category) {
        spendingMap.set(tx.category.name, (spendingMap.get(tx.category.name) || 0) + tx.amount);
      } else if (tx.type === 'income' && tx.category) {
        incomeMap.set(tx.category.name, (incomeMap.get(tx.category.name) || 0) + tx.amount);
      }
    }

    const topExpenses = [...filteredTransactions]
      .filter(tx => tx.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(tx => ({ id: tx.id, description: tx.description, amount: tx.amount, date: tx.date, categoryName: tx.category?.name }));

    return {
      spendingByCategory: Array.from(spendingMap.entries()).map(([name, value], i) => ({ name, value, fill: chartColors[i % chartColors.length] })),
      incomeBySource: Array.from(incomeMap.entries()).map(([name, value], i) => ({ name, value, fill: chartColors[i % chartColors.length] })),
      topExpenses,
      monthlyEvolution: Array.from(monthlyEvolutionMap.entries()).map(([month, data]) => {
          const [m, y] = month.split('/');
          const shortYear = y.substring(2);
          const monthName = new Date(Number(y), Number(m)-1, 1).toLocaleString('pt-BR', { month: 'short' });
          return { month: `${monthName}/${shortYear}`, ...data };
      }),
    };
  }, [transactions, timePeriod]);


  const realDataChartConfig = useMemo(() => ({
    Receitas: { label: "Receitas", color: "hsl(var(--chart-1))" },
    Despesas: { label: "Despesas", color: "hsl(var(--chart-2))" },
  }), []);

  const renderEmptyState = (title: string, message: string) => (
      <Card className="shadow-sm h-full flex flex-col">
          <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-primary" />{title}</CardTitle></CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                  <p className="font-semibold">{message}</p>
              </div>
          </CardContent>
      </Card>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Análise Financeira Detalhada"
        description="Explore seus padrões de gastos, receitas e tendências ao longo do tempo."
        icon={<Wallet className="h-6 w-6 text-primary"/>}
        actions={
          <Select value={timePeriod} onValueChange={setTimePeriod} disabled={isLoading}>
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
            {isLoading ? <Skeleton className="h-96" /> : spendingByCategory.length === 0 ? renderEmptyState("Gastos por Categoria", "Nenhum gasto no período.") : (
              <Card className="shadow-sm">
                  <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-primary" />Gastos por Categoria</CardTitle><CardDescription>Distribuição das suas despesas ({timePeriod === 'monthly' ? 'este mês' : 'total'}).</CardDescription></CardHeader>
                  <CardContent className="h-80 sm:h-96"><ChartContainer config={{}} className="min-h-[200px] w-full h-full aspect-square"><ResponsiveContainer width="100%" height="100%"><PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}><RechartsTooltip content={<RealDataPieCustomTooltip />} /><Pie data={spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={true} label={<PieLabel />}>{spendingByCategory.map((entry, index) => (<Cell key={`cell-spending-${index}`} fill={entry.fill} />))}</Pie></PieChart></ResponsiveContainer></ChartContainer></CardContent>
              </Card>
            )}
             {isLoading ? <Skeleton className="h-96" /> : incomeBySource.length === 0 ? renderEmptyState("Fontes de Renda", "Nenhuma receita no período.") : (
                <Card className="shadow-sm">
                    <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><PieIconLucide className="mr-2 h-5 w-5 text-emerald-500" />Fontes de Renda</CardTitle><CardDescription>De onde vêm suas receitas ({timePeriod === 'monthly' ? 'este mês' : 'total'}).</CardDescription></CardHeader>
                    <CardContent className="h-80 sm:h-96"><ChartContainer config={{}} className="min-h-[200px] w-full h-full aspect-square"><ResponsiveContainer width="100%" height="100%"><PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}><RechartsTooltip content={<RealDataPieCustomTooltip />} /><Pie data={incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={true} label={<PieLabel />}>{incomeBySource.map((entry, index) => (<Cell key={`cell-income-${index}`} fill={entry.fill} />))}</Pie></PieChart></ResponsiveContainer></ChartContainer></CardContent>
                </Card>
             )}
            <Card className="shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><TrendingDown className="mr-2 h-5 w-5 text-destructive" />Top 5 Despesas</CardTitle><CardDescription>Maiores gastos no período.</CardDescription></CardHeader>
                <CardContent className="h-80 sm:h-96">
                  <ScrollArea className="h-full pr-2">
                    {isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 mb-2" />) : topExpenses.length === 0 ? (<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nenhuma despesa.</div>) : (
                      <Table size="sm">
                          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                          <TableBody>{topExpenses.map(tx => (<TableRow key={tx.id}><TableCell className="font-medium text-xs break-words max-w-[150px] sm:max-w-none" title={tx.description}>{tx.description}<br/><span className="text-muted-foreground text-[10px]">{tx.categoryName} - {tx.date}</span></TableCell><TableCell className="text-right text-xs"><PrivateValue value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className="text-destructive/80" /></TableCell></TableRow>))}</TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-3 shadow-sm">
                <CardHeader><CardTitle className="font-headline flex items-center text-lg md:text-xl"><AreaIconLucide className="mr-2 h-5 w-5 text-primary" />Evolução Mensal (Últimos 12 Meses)</CardTitle><CardDescription>Suas receitas vs. despesas ao longo do tempo.</CardDescription></CardHeader>
                <CardContent className="h-80 sm:h-96 overflow-hidden">
                    {isLoading ? <Skeleton className="w-full h-full" /> : (
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
                    )}
                </CardContent>
            </Card>
      </div>
    </div>
  );
}
