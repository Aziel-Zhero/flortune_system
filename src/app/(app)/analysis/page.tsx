
// src/app/(app)/analysis/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from "recharts";
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
  if (active && payload && payload.length && payload[0] && payload[0].payload) {
    const data = payload[0].payload;
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
      if (!authLoading && !user?.id) {
        setAllTransactions([]);
      }
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
          setAllTransactions(data || []);
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
    if (isFetchingTransactions || !Array.isArray(allTransactions) || allTransactions.length === 0) return [];
    
    return allTransactions.filter(tx => {
      if (timePeriod === "all") return true;
      if (!tx.date || typeof tx.date !== 'string') return false;
      try {
        const txDate = new Date(tx.date + "T00:00:00Z"); 
        if (isNaN(txDate.getTime())) return false; 

        const now = new Date();
        if (timePeriod === "monthly") {
          return txDate.getUTCMonth() === now.getUTCMonth() && txDate.getUTCFullYear() === now.getUTCFullYear();
        }
        if (timePeriod === "yearly") {
          return txDate.getUTCFullYear() === now.getUTCFullYear();
        }
      } catch(e) {
        console.error("Error parsing transaction date in filteredTransactionsForPeriod:", tx.date, e);
        return false;
      }
      return true; 
    });
  }, [allTransactions, timePeriod, isFetchingTransactions]);

  const spendingByCategory = useMemo((): CategoryData[] => {
    if (!Array.isArray(filteredTransactionsForPeriod) || filteredTransactionsForPeriod.length === 0) return [];
    const spendingMap = new Map<string, number>();
    filteredTransactionsForPeriod
      .filter(tx => tx.type === 'expense' && tx.amount > 0)
      .forEach(tx => {
        const categoryName = tx.category?.name || 'Outros';
        spendingMap.set(categoryName, (spendingMap.get(categoryName) || 0) + tx.amount);
      });
    return Array.from(spendingMap, ([name, value], index) => ({ 
        name, 
        value, 
        fill: chartColors[index % chartColors.length] 
    })).sort((a,b) => b.value - a.value);
  }, [filteredTransactionsForPeriod]);

  const incomeBySource = useMemo((): CategoryData[] => {
    if (!Array.isArray(filteredTransactionsForPeriod) || filteredTransactionsForPeriod.length === 0) return [];
    const incomeMap = new Map<string, number>();
    filteredTransactionsForPeriod
      .filter(tx => tx.type === 'income' && tx.amount > 0)
      .forEach(tx => {
        const categoryName = tx.category?.name || 'Outras Receitas';
        incomeMap.set(categoryName, (incomeMap.get(categoryName) || 0) + tx.amount);
      });
    return Array.from(incomeMap, ([name, value], index) => ({ 
        name, 
        value, 
        fill: chartColors[(index + 1) % chartColors.length] 
    })).sort((a,b) => b.value - a.value);
  }, [filteredTransactionsForPeriod]);

  const cashFlowTrend = useMemo((): MonthlyFlow[] => {
    if (isFetchingTransactions || !Array.isArray(allTransactions) || allTransactions.length === 0) return [];
    const monthlyData: { [key: string]: { income: number; expense: number } } = {};
    const today = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getUTCFullYear(), today.getUTCMonth() - i, 1);
        const monthKey = `${monthNames[date.getUTCMonth()]}/${date.getUTCFullYear().toString().slice(-2)}`;
        monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    allTransactions.forEach(tx => {
      if (!tx.date || typeof tx.date !== 'string') return;
      try {
        const txDate = new Date(tx.date + "T00:00:00Z"); 
        if (isNaN(txDate.getTime())) return; 

        const monthKey = `${monthNames[txDate.getUTCMonth()]}/${txDate.getUTCFullYear().toString().slice(-2)}`;
        if (monthlyData[monthKey] !== undefined) { 
            if (tx.type === 'income' && tx.amount > 0) monthlyData[monthKey].income += tx.amount;
            else if (tx.type === 'expense' && tx.amount > 0) monthlyData[monthKey].expense += tx.amount;
        }
      } catch(e) {
         console.error("Error processing transaction for cash flow:", tx.date, e);
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense
    }));
  }, [allTransactions, isFetchingTransactions]);

  const chartConfig = useMemo(() => ({
    income: { label: "Receita", color: "hsl(var(--chart-1))" },
    expense: { label: "Despesa", color: "hsl(var(--chart-2))" },
  }), []);
  
  const isLoading = authLoading || (isFetchingTransactions && !!user); 

  if (isLoading) {
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
  
  const noTransactionsAtAll = !isFetchingTransactions && allTransactions.length === 0;
  const noDataForSelectedPeriod = 
    !isFetchingTransactions &&
    (timePeriod === "monthly" || timePeriod === "yearly") &&
    spendingByCategory.length === 0 && 
    incomeBySource.length === 0;

  return (
    <div>
      <PageHeader
        title="Análise Financeira"
        description="Obtenha insights sobre seus padrões de gastos e receitas."
        icon={<Wallet className="h-6 w-6 text-primary"/>}
        actions={
          <Select value={timePeriod} onValueChange={setTimePeriod} disabled={isFetchingTransactions}>
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
      {noTransactionsAtAll ? (
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
      ) : noDataForSelectedPeriod ? (
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
                <CardTitle className="font-headline flex items-center text-lg md:text-xl">
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
                <CardTitle className="font-headline flex items-center text-lg md:text-xl">
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
                <CardTitle className="font-headline flex items-center text-lg md:text-xl">
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
