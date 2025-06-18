
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
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "@/hooks/use-toast";

interface CategorySpending {
  name: string;
  value: number;
}

interface MonthlyFlow {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

const COLORS_SPENDING = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const COLORS_INCOME = ["hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--chart-4))", "hsl(var(--chart-3))", "hsl(var(--chart-5))"]; // Reordered for visual difference

export default function AnalysisPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === "loading";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("monthly"); // "monthly", "yearly", "all"

  const [spendingByCategory, setSpendingByCategory] = useState<CategorySpending[]>([]);
  const [incomeBySource, setIncomeBySource] = useState<CategorySpending[]>([]);
  const [cashFlowTrend, setCashFlowTrend] = useState<MonthlyFlow[]>([]);

  const processTransactionData = useCallback((allTransactions: Transaction[]) => {
    const filteredTransactions = allTransactions.filter(tx => {
      if (timePeriod === "all") return true;
      const txDate = new Date(tx.date + "T00:00:00");
      const now = new Date();
      if (timePeriod === "monthly") {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (timePeriod === "yearly") {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Gastos por Categoria
    const spendingMap = new Map<string, number>();
    filteredTransactions
      .filter(tx => tx.type === 'expense' && tx.category)
      .forEach(tx => {
        const categoryName = tx.category!.name;
        spendingMap.set(categoryName, (spendingMap.get(categoryName) || 0) + tx.amount);
      });
    setSpendingByCategory(Array.from(spendingMap, ([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value));

    // Fontes de Renda
    const incomeMap = new Map<string, number>();
    filteredTransactions
      .filter(tx => tx.type === 'income' && tx.category)
      .forEach(tx => {
        const categoryName = tx.category!.name;
        incomeMap.set(categoryName, (incomeMap.get(categoryName) || 0) + tx.amount);
      });
    setIncomeBySource(Array.from(incomeMap, ([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value));
    
    // Tendência do Fluxo de Caixa (últimos 6 meses incluindo o atual)
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    const today = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
        monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    allTransactions.forEach(tx => { // Usa todas as transações para a tendência, não apenas as filtradas pelo período selecionado para os gráficos de pizza/barra
        const txDate = new Date(tx.date + "T00:00:00");
        const monthKey = `${monthNames[txDate.getMonth()]}/${txDate.getFullYear().toString().slice(-2)}`;
        if (monthlyData[monthKey]) {
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

  }, [timePeriod]);

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
        processTransactionData(data || []);
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: "Não foi possível carregar os dados de transação.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, processTransactionData]);

  useEffect(() => {
    document.title = `Análise Financeira - ${APP_NAME}`;
    if (user?.id && !authLoading) {
      fetchTransactions();
    } else if (!authLoading && !user?.id) {
      setIsLoading(false);
      setTransactions([]);
    }
  }, [user, authLoading, fetchTransactions]);
  
  useEffect(() => {
    if (transactions.length > 0) {
        processTransactionData(transactions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriod, transactions]); // Não incluir processTransactionData aqui para evitar loop infinito

  if (authLoading || (isLoading && user)) {
    return (
      <div>
        <PageHeader title="Análise Financeira" description="Carregando seus insights..." />
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-sm"><CardHeader><Skeleton className="h-6 w-3/4 mb-1"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card>
          <Card className="shadow-sm"><CardHeader><Skeleton className="h-6 w-3/4 mb-1"/><Skeleton className="h-4 w-1/2"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card>
          <Card className="md:col-span-2 shadow-sm"><CardHeader><Skeleton className="h-6 w-1/2 mb-1"/><Skeleton className="h-4 w-3/4"/></CardHeader><CardContent><Skeleton className="h-80 w-full"/></CardContent></Card>
        </div>
      </div>
    );
  }
  
  const noDataForPeriod = spendingByCategory.length === 0 && incomeBySource.length === 0;

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
      {transactions.length === 0 && !isLoading ? (
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
      ) : noDataForPeriod && !isLoading ? (
        <Card className="shadow-sm text-center py-12">
            <CardHeader>
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <CardTitle className="mt-4">Sem Dados para o Período</CardTitle>
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
                <CardDescription>Detalhamento de suas despesas em diferentes categorias ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel indicator="dot" nameKey="name" />}
                    />
                    <Pie data={spendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {spendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_SPENDING[index % COLORS_SPENDING.length]} />
                    ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>

            <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline flex items-center">
                <PieIcon className="mr-2 h-5 w-5 text-primary" />
                Fontes de Renda
                </CardTitle>
                <CardDescription>Distribuição de sua renda de várias fontes ({timePeriod === 'monthly' ? 'este mês' : timePeriod === 'yearly' ? 'este ano' : 'total'}).</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel indicator="dot" nameKey="name" />}
                    />
                    <Pie data={incomeBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {incomeBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_INCOME[index % COLORS_INCOME.length]} />
                    ))}
                    </Pie>
                     <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
                </ResponsiveContainer>
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
            <CardContent className="h-96"> {/* Aumentado altura para melhor visualização */}
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `R$${value/1000}k`} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '10px'}}/>
                    <Bar dataKey="income" fill="hsl(var(--chart-1))" name="Receita" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="hsl(var(--chart-2))" name="Despesa" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
    