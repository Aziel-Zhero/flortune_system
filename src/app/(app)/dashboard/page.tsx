
"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PrivateValue } from "@/components/shared/private-value";
import { DollarSign, CreditCard, TrendingUp, Sprout, PiggyBank, AlertTriangle, BarChart, PlusCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { getTransactions } from "@/services/transaction.service";
import { getFinancialGoals } from "@/services/goal.service";
import type { Transaction, FinancialGoal } from "@/types/database.types";
import { motion } from "framer-motion";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts"; 

interface SummaryData {
  title: string;
  value: number | null;
  icon: React.ElementType;
  trend?: string | null;
  trendColor?: string;
  unit?: string;
  isLoading: boolean;
}

interface SpendingCategoryChartData {
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const authIsLoading = status === "loading";
  const user = session?.user;
  const profile = user?.profile;

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  
  const [summaryValues, setSummaryValues] = useState<SummaryData[]>([
    { title: "Saldo Atual (Simulado)", value: null, icon: DollarSign, trend: null, trendColor: "text-muted-foreground", isLoading: true },
    { title: "Receitas Este Mês", value: null, icon: TrendingUp, trend: null, trendColor: "text-emerald-500", isLoading: true },
    { title: "Despesas Este Mês", value: null, icon: CreditCard, trend: null, trendColor: "text-red-500", isLoading: true },
    { title: "Meta Principal (Progresso)", value: null, icon: PiggyBank, unit: "%", trend: null, trendColor: "text-emerald-500", isLoading: true },
  ]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
        setTransactionsLoading(false);
        setSummaryValues(prev => prev.map(s => ({ ...s, isLoading: false, value: s.title.includes("Saldo") ? 0 : null })));
        setAllTransactions([]);
        return;
    }

    setTransactionsLoading(true);
    setSummaryValues(prev => prev.map(s => ({ ...s, isLoading: true })));

    try {
      const { data: transactionsData, error: transactionsError } = await getTransactions(user.id);
      if (transactionsError) {
        toast({ title: "Erro ao buscar transações", description: transactionsError.message, variant: "destructive" });
        setAllTransactions([]);
      } else {
        setAllTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      }

      const { data: goalsData, error: goalsError } = await getFinancialGoals(user.id);
      let primaryGoalProgress: number | null = null;
      if (goalsError) {
        // Silently fail for goals on dashboard for now
      } else if (goalsData && goalsData.length > 0) {
        const inProgressGoals = goalsData.filter(g => g.status === 'in_progress');
        if (inProgressGoals.length > 0) {
            const primaryGoal = inProgressGoals.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]; 
            if (primaryGoal.target_amount > 0) {
                 primaryGoalProgress = Math.min((primaryGoal.current_amount / primaryGoal.target_amount) * 100, 100);
            }
        }
      }
      
      let totalIncome = 0;
      let totalExpenses = 0;
      const currentMonth = new Date().getUTCMonth();
      const currentYear = new Date().getUTCFullYear();

      (Array.isArray(transactionsData) ? transactionsData : []).forEach(tx => {
        if (!tx.date || typeof tx.date !== 'string') return;
        try {
            const txDate = new Date(tx.date + 'T00:00:00Z');
            if (isNaN(txDate.getTime())) return;

            if (txDate.getUTCMonth() === currentMonth && txDate.getUTCFullYear() === currentYear) {
            if (tx.type === 'income' && typeof tx.amount === 'number') {
                totalIncome += tx.amount;
            } else if (tx.type === 'expense' && typeof tx.amount === 'number') {
                totalExpenses += tx.amount;
            }
            }
        } catch(e) {
            console.error("Error processing transaction for summary: ", tx, e);
        }
      });
      
      setSummaryValues([
        { title: "Saldo (Não Calculado)", value: 0, icon: DollarSign, trend: "N/A", trendColor: "text-muted-foreground", isLoading: false },
        { title: "Receitas Este Mês", value: totalIncome, icon: TrendingUp, trend: totalIncome > 0 ? "Ver Detalhes" : "Nenhuma receita", trendColor: "text-emerald-500", isLoading: false },
        { title: "Despesas Este Mês", value: totalExpenses, icon: CreditCard, trend: totalExpenses > 0 ? "Ver Detalhes": "Nenhuma despesa", trendColor: "text-red-500", isLoading: false },
        { title: "Meta Principal", value: primaryGoalProgress, icon: PiggyBank, unit: "%", trend: primaryGoalProgress !== null ? "Ver Meta" : "Nenhuma meta ativa", trendColor: "text-emerald-500", isLoading: false },
      ]);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast({ title: "Erro de Dados", description: "Não foi possível carregar todos os dados do painel.", variant: "destructive" });
    } finally {
      setTransactionsLoading(false);
      setSummaryValues(prev => prev.map(s => ({ ...s, isLoading: false }))); 
    }
  }, [user?.id]);

  useEffect(() => {
    document.title = `Painel - ${APP_NAME}`;
    if (user?.id && !authIsLoading) {
      fetchDashboardData();
    } else if (!authIsLoading && !user?.id) {
      setAllTransactions([]);
      setSummaryValues(prev => prev.map(s => ({ ...s, value: null, isLoading: false })));
      setTransactionsLoading(false);
    }
  }, [user, authIsLoading, fetchDashboardData]);

  const recentTransactions = useMemo(() => {
    if (!Array.isArray(allTransactions)) return [];
    return allTransactions.slice(0, 4);
  }, [allTransactions]);

  const monthlySpendingByCategory = useMemo((): SpendingCategoryChartData[] => {
    if (transactionsLoading || !Array.isArray(allTransactions) || allTransactions.length === 0) return [];
    const spendingMap = new Map<string, number>();
    const currentMonth = new Date().getUTCMonth();
    const currentYear = new Date().getUTCFullYear();

    allTransactions.forEach(tx => {
      if (!tx.date || typeof tx.date !== 'string') return;
      try {
        const txDate = new Date(tx.date + 'T00:00:00Z');
        if (isNaN(txDate.getTime())) return;

        if (txDate.getUTCMonth() === currentMonth && txDate.getUTCFullYear() === currentYear) {
          if (tx.type === 'expense' && typeof tx.amount === 'number' && tx.amount > 0 && tx.category) {
            const categoryName = tx.category.name;
            spendingMap.set(categoryName, (spendingMap.get(categoryName) || 0) + tx.amount);
          }
        }
      } catch (e) {
        console.error("Error processing transaction for chart:", tx, e);
      }
    });
    return Array.from(spendingMap, ([name, value], index) => ({ name, value, fill: chartColors[index % chartColors.length] }))
           .sort((a,b) => b.value - a.value);
  }, [allTransactions, transactionsLoading]);


  const welcomeName = profile?.display_name || profile?.full_name?.split(" ")[0] || session?.user?.name?.split(" ")[0] || "Usuário";

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };
  
  if (authIsLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title={`Bem-vindo(a) de volta!`}
          description="Aqui está seu resumo financeiro para este mês."
           actions={<Skeleton className="h-10 w-36 rounded-md" />}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, index) => (
            <Card key={index} className="shadow-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-1"/>
              <Skeleton className="h-4 w-3/4"/>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array(3).fill(0).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
               <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-1/2 mb-1"/>
              <Skeleton className="h-4 w-3/4"/>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-[200px] md:w-[300px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return <p>Redirecionando para o login...</p>; 
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Bem-vindo(a) de volta, ${welcomeName}!`}
        description="Aqui está seu resumo financeiro."
        actions={
          <Link 
            href="/transactions/new" 
            className={cn(buttonVariants({ variant: "default", size: "default" }))}
          >
            <PlusCircle className="mr-2 h-4 w-4"/>
            Adicionar Transação
          </Link>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {summaryValues.map((item, index) => (
          <motion.div key={item.title} custom={index} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {item.isLoading ? (
                  <>
                    <Skeleton className="h-8 w-3/5 mb-1" />
                    <Skeleton className="h-3 w-2/5" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold font-headline">
                      {item.value === null || item.value === undefined ? (
                        item.unit === "%" ? "N/A %" : "N/A"
                      ) : item.unit === "%" ? (
                        <span><PrivateValue value={String(item.value.toFixed(0))} />%</span>
                      ) : (
                        <span>R$<PrivateValue value={item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /></span>
                      )}
                    </div>
                    {item.trend && (
                      <p className={cn("text-xs text-muted-foreground mt-1", item.trendColor)}>
                        {item.trend}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Transações Recentes</CardTitle>
            <CardDescription>Suas últimas atividades financeiras.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
               Array(4).fill(0).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))
            ) : recentTransactions.length > 0 ? (
              <ul className="space-y-1">
                {recentTransactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors">
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.date + 'T00:00:00Z').toLocaleDateString('pt-BR')} - {tx.category?.name || "Sem Categoria"}</p>
                    </div>
                    <PrivateValue 
                      value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                      className={cn("font-medium text-sm", tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação recente encontrada.</p>
            )}
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/transactions">Ver Todas as Transações</Link>
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChart className="mr-2 h-5 w-5 text-primary" />Visão Geral de Gastos (Este Mês)</CardTitle>
            <CardDescription>Suas principais categorias de despesas.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[250px] flex items-center justify-center">
             {transactionsLoading ? (
                <Skeleton className="w-full h-[200px]" />
             ): monthlySpendingByCategory.length > 0 ? (
                <ChartContainer config={{}} className="min-h-[200px] w-full h-64">
                  <PieChart>
                    <RechartsTooltip content={<PieCustomTooltip />} />
                    <Pie data={monthlySpendingByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} labelLine={false} label={({ name, percent }) => (name && percent ? `${name} (${(percent * 100).toFixed(0)}%)` : '')}>
                      {monthlySpendingByCategory.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
             ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sem dados de gastos para exibir o gráfico.</p>
             )}
          </CardContent>
        </Card>
        </motion.div>
      </div>
      
       <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
       <Card className="shadow-sm bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30">
        <CardHeader>
            <CardTitle className="font-headline text-primary flex items-center">
                <Sprout className="mr-2 h-6 w-6"/>
                Sugestões Inteligentes (Em Breve)
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-sm text-foreground/80">Em breve, o Flortune usará IA para analisar seus padrões e oferecer dicas personalizadas para otimizar suas finanças!</p>
            <p className="text-sm text-foreground/80">Ex: "Você gastou <PrivateValue value="R$120" className="font-semibold"/> em café este mês. Considere preparar em casa para economizar!"</p>
             <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary" onClick={() => toast({ title: "Funcionalidade Futura", description: "Insights com IA estarão disponíveis em breve." })} disabled>
                Ver Todos os Insights
              </Button>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}

    