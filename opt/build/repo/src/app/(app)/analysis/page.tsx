
// src/app/(app)/analysis/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart as PieIcon, TrendingUp, AlertTriangle, Wallet } from "lucide-react";
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
} from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";
import { toast } from "@/hooks/use-toast";

interface CategoryData {
  name: string;
  value: number;
  fill: string;
}

interface MonthlyFlow {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function AnalysisPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === "loading";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("monthly"); // "monthly", "yearly", "all"

  const [spendingByCategory, setSpendingByCategory] = useState<CategoryData[]>([]);
  const [incomeBySource, setIncomeBySource] = useState<CategoryData[]>([]);
  const [cashFlowTrend, setCashFlowTrend] = useState<MonthlyFlow[]>([]);

  const processTransactionData = useCallback((allTransactions: Transaction[], currentPeriod: string) => {
    const filteredTransactions = allTransactions.filter(tx => {
      if (currentPeriod === "all") return true;
      const txDate = new Date(tx.date + "T00:00:00Z"); // Ensure UTC for consistent month/year
      const now = new Date();
      if (currentPeriod === "monthly") {
        return txDate.getUTCMonth() === now.getUTCMonth() && txDate.getUTCFullYear() === now.getUTCFullYear();
      }
      if (currentPeriod === "yearly") {
        return txDate.getUTCFullYear() === now.getUTCFullYear();
      }
      return true;
    });

    const spendingMap = new Map<string, number>();
    filteredTransactions
      .filter(tx => tx.type === 'expense' && tx.category)
      .forEach(tx => {
        const categoryName = tx.category!.name;
        spendingMap.set(categoryName, (spendingMap.get(categoryName) || 0) + tx.amount);
      });
    setSpendingByCategory(Array.from(spendingMap, ([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] })).sort((a,b) => b.value - a.value));

    const incomeMap = new Map<string, number>();
    filteredTransactions
      .filter(tx => tx.type === 'income' && tx.category)
      .forEach(tx => {
        const categoryName = tx.category!.name;
        incomeMap.set(categoryName, (incomeMap.get(categoryName) || 0) + tx.amount);
      });
    setIncomeBySource(Array.from(incomeMap, ([name, value], index) => ({ name, value, fill: chartColors[(index + 1) % chartColors.length] })).sort((a,b) => b.value - a.value));
    
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    const today = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Consider last 6 months including current for cash flow trend
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${monthNames[date.getUTCMonth()]}/${date.getUTCFullYear().toString().slice(-2)}`;
        monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    // Use allTransactions for the cash flow trend, not just filtered by timePeriod for pie charts
    allTransactions.forEach(tx => {
        const txDate = new Date(tx.date + "T00:00:00Z");
        const monthKey = `${monthNames[txDate.getUTCMonth()]}/${txDate.getUTCFullYear().toString().slice(-2)}`;
        if (monthlyData[monthKey] !== undefined) { // Check if the monthKey exists (it should due to pre-population)
            if (tx.type === 'income') monthlyData[monthKey].income += tx.amount;
            else if (tx.type === 'expense') monthlyData[monthKey].expense += tx.amount;
        }
    });

    setCashFlowTrend(
        Object.entries(monthlyData).map(([month, data]) => ({
            month,
            income: data.income,
            expense: data.expense,
            balance: data.income - data.expense
        }))
    );

  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await getTransactions(user.id);
      if (error) {
        toast({ title: "Erro ao buscar transações", description: error.message, variant: "destructive" });
        setTransactions([]);
      } else {
        setTransactions(data || []);
        processTransactionData(data || [], timePeriod); 
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: "Não foi possível carregar os dados de transação.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, processTransactionData, timePeriod]);

  useEffect(() => {
    document.title = `Análise Financeira - ${APP_NAME}`;
    if (user?.id && !authLoading) {
      fetchTransactions();
    } else if (!authLoading && !user?.id) {
      setIsLoading(false);
      setTransactions([]);
      processTransactionData([], timePeriod); // Process with empty data if not logged in
    }
  }, [user, authLoading, fetchTransactions, timePeriod, processTransactionData]);
  
  useEffect(() => {
    // Re-process data when timePeriod changes and transactions are already loaded
    if (transactions.length > 0 || (transactions.length === 0 && !isLoading && !authLoading)) { // Also process if no tx but loading finished
        processTransactionData(transactions, timePeriod);
    }
  }, [timePeriod, transactions, processTransactionData, isLoading, authLoading]);


  const chartConfig = {
    amount: { label: "Valor (R$)" },
    income: { label: "Receita", color: "hsl(var(--chart-1))" },
    expense: { label: "Despesa", color: "hsl(var(--chart-2))" },
    ...spendingByCategory.reduce((acc, cur) => {
      acc[cur.name] = { label: cur.name, color: cur.fill };
      return acc;
    }, {} as any),
    ...incomeBySource.reduce((acc, cur) => {
      acc[cur.name] = { label: cur.name, color: cur.fill };
      return acc;
    }, {} as any),
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background/80 border border-border rounded-md shadow-lg">
          <p className="label text-sm font-medium text-foreground">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-xs">
              {`${entry.name}: ${entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Access the actual data object for the pie slice
      return (
        <div className="p-2 bg-background/80 border border-border rounded-md shadow-lg">
          <p className="text-sm font-medium" style={{color: data.fill}}>{`${data.name}`}</p>
          <p className="text-xs text-foreground">{`Valor: ${data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</p>
          <p className="text-xs text-muted-foreground">{`(${(payload[0].percent * 100).toFixed(2)}%)`}</p>
        </div>
      );
    }
    return null;
  };


  if (authLoading || (isLoading && user)) {
    return (
      <div>
        <PageHeader title="Análise Financeira" description="Carregando seus insights..." icon={<Wallet className="h-6 w-6 text-primary"/>} />
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm"><CardHeader><Skeleton className="h-6 w-3/4 mb-1"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card>
          <Card className="shadow-sm"><CardHeader><Skeleton className="h-6 w-3/4 mb-1"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card>
          <Card className="md:col-span-2 shadow-sm"><CardHeader><Skeleton className="h-6 w-1/2 mb-1"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card>
        </div>
      </div>
    );
  }
  
  const noDataForPeriod = spendingByCategory.length === 0 && incomeBySource.length === 0 && (timePeriod === "monthly" || timePeriod === "yearly");
  const noTransactionsAtAll = transactions.length === 0;

  return (
    <div>
      <PageHeader
        title="Análise Financeira"
        description="Obtenha insights sobre seus padrões de gastos e receitas."
        icon={<Wallet className="h-6 w-6 text-primary"/>}
        actions={
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Este Mês</SelectItem>
              <SelectItem value="yearly">Este Ano</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {noTransactionsAtAll && !isLoading ? (
        <Card className="shadow-sm text-center py-12">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <CardTitle className="mt-4">Nenhuma Transação Encontrada</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                Não há dados de transações para analisar. Comece adicionando suas receitas e despesas.
                </CardDescription>
            </CardContent>
        </Card>
      ) : noDataForPeriod && !isLoading && (timePeriod === "monthly" || timePeriod === "yearly") ? (
        <Card className="shadow-sm text-center py-12">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <CardTitle className="mt-4">Sem Dados para o Período Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                Não há transações no período selecionado. Tente um período diferente ou adicione novas transações.
                </CardDescription>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-primary" />
                Gastos por Categoria
                </CardTitle>
                <CardDescription>Detalhamento de suas despesas ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {spendingByCategory.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <RechartsTooltip content={<PieCustomTooltip />} />
                            <Pie data={spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                            {spendingByCategory.map((entry, index) => (
                                <Cell key={`cell-spending-${index}`} fill={entry.fill} />
                            ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                       <p>Sem dados de despesas para exibir {timePeriod !== 'all' ? `neste ${timePeriod === 'monthly' ? 'mês' : 'ano'}` : ''}.</p>
                    </div>
                )}
            </CardContent>
            </Card>

            <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                <PieIcon className="mr-2 h-5 w-5 text-primary" />
                Fontes de Renda
                </CardTitle>
                <CardDescription>Distribuição de sua renda ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {incomeBySource.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <RechartsTooltip content={<PieCustomTooltip />} />
                            <Pie data={incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                            {incomeBySource.map((entry, index) => (
                                <Cell key={`cell-income-${index}`} fill={entry.fill} />
                            ))}
                            </Pie>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Sem dados de receitas para exibir {timePeriod !== 'all' ? `neste ${timePeriod === 'monthly' ? 'mês' : 'ano'}` : ''}.</p>
                    </div>
                )}
            </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                Tendência do Fluxo de Caixa (Últimos 6 Meses)
                </CardTitle>
                <CardDescription>Sua renda vs. despesas ao longo do tempo.</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                 {cashFlowTrend.some(d => d.income > 0 || d.expense > 0) ? (
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashFlowTrend} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={40}/>
                            <YAxis tickFormatter={(value) => `R$${Number(value/1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '10px', fontSize: '12px'}}/>
                            <Bar dataKey="income" fill="var(--color-income)" name="Receita" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expense" fill="var(--color-expense)" name="Despesa" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Sem dados suficientes para exibir a tendência do fluxo de caixa.</p>
                    </div>
                )}
            </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

