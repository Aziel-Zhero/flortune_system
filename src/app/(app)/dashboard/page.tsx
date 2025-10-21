// src/app/(app)/dashboard/page.tsx

"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { PrivateValue } from "@/components/shared/private-value";
import { DollarSign, CreditCard, TrendingUp, Sprout, PiggyBank, BarChart, PlusCircle, Repeat, ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts"; 
import { useAppSettings } from "@/contexts/app-settings-context";
import type { QuoteData } from "@/services/quote.service";

// --- MOCK DATA ---
const summaryValues = [
    { title: "Saldo (Exemplo)", value: 5420.75, icon: DollarSign, trend: "Feature em desenvolvimento", trendColor: "text-muted-foreground", isLoading: false },
    { title: "Receitas Este Mês", value: 7500.00, icon: TrendingUp, trend: "+5.2% vs. mês passado", trendColor: "text-emerald-500", isLoading: false },
    { title: "Despesas Este Mês", value: 2079.25, icon: CreditCard, trend: "-10.1% vs. mês passado", trendColor: "text-red-500", isLoading: false },
    { title: "Balanço Recorrente", value: 1250.00, icon: Repeat, trend: "Saldo Positivo", trendColor: "text-emerald-500", isLoading: false },
    { title: "Meta Principal", value: 65, icon: PiggyBank, unit: "%", trend: 'Meta: "Viagem para a Praia"', trendColor: "text-emerald-500", isLoading: false },
];

const recentTransactions = [
    { id: '1', description: 'Salário Mensal', date: '01/07/2024', category: { name: 'Salário' }, amount: 7500.00, type: 'income' },
    { id: '2', description: 'Aluguel & Condomínio', date: '05/07/2024', category: { name: 'Moradia' }, amount: 1800.00, type: 'expense' },
    { id: '3', description: 'Compras de Supermercado', date: '03/07/2024', category: { name: 'Alimentação' }, amount: 850.50, type: 'expense' },
    { id: '4', description: 'Projeto Freelance X', date: '02/07/2024', category: { name: 'Renda Extra' }, amount: 1200.00, type: 'income' },
];

const chartColors = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

const monthlySpendingByCategory = [
    { name: 'Moradia', value: 1800.00, fill: chartColors[0] },
    { name: 'Alimentação', value: 850.50, fill: chartColors[1] },
    { name: 'Transporte', value: 320.75, fill: chartColors[2] },
    { name: 'Lazer', value: 250.00, fill: chartColors[3] },
    { name: 'Outros', value: 150.00, fill: chartColors[4] },
];
// --- END MOCK DATA ---

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
  const { quotes, isLoadingQuotes, selectedQuotes } = useAppSettings();

  useEffect(() => {
    document.title = `Painel - ${APP_NAME}`;
  }, []);

  const welcomeName = "Usuário";

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };
  
  const quoteCodesToRender = useMemo(() => {
    return selectedQuotes.filter(q => q && q.trim() !== '');
  }, [selectedQuotes]);


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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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
                  <p className={cn("text-xs text-muted-foreground mt-1 truncate", item.trendColor)}>
                    {item.trend}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {isLoadingQuotes
          ? (
              // Mostra 5 esqueletos fixos
              Array(5).fill(0).map((_, index) => (
                <motion.div key={`skel-quote-${index}`} custom={index + 5} variants={cardVariants} initial="hidden" animate="visible">
                  <Card className="shadow-sm h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12"/>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )
          : (
              // Renderiza as cotações carregadas
              quotes.map((quote: QuoteData, index: number) => {
                const pctChange = parseFloat(quote.pctChange);
                const isPositive = pctChange >= 0;
                const quoteName = quote.name.split('/')[0];
                
                return (
                  <motion.div key={quote.code} custom={index + 5} variants={cardVariants} initial="hidden" animate="visible">
                    <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={quoteName}>
                          {quoteName}
                        </CardTitle>
                        <div className={cn("flex items-center text-xs font-semibold", isPositive ? "text-emerald-500" : "text-destructive")}>
                            {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                            {pctChange.toFixed(2)}%
                        </div>
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold font-headline">
                            <span>R$<PrivateValue value={parseFloat(quote.bid).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /></span>
                          </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )
        }
        {/* Preenche os espaços vazios se houver menos de 5 cotações */}
        {!isLoadingQuotes && quotes.length < 5 &&
          Array(5 - quotes.length).fill(0).map((_, index) => (
            <motion.div key={`placeholder-${index}`} custom={quotes.length + index + 5} variants={cardVariants} initial="hidden" animate="visible">
              <Card className="shadow-sm h-full opacity-50 flex items-center justify-center">
                 <CardContent className="p-0 text-center text-xs text-muted-foreground">
                    <p>Vazio</p>
                 </CardContent>
              </Card>
            </motion.div>
          ))
        }
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <motion.div custom={10} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Transações Recentes</CardTitle>
            <CardDescription>Suas últimas atividades financeiras (dados de exemplo).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors">
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date} - {tx.category?.name || "Sem Categoria"}</p>
                  </div>
                  <PrivateValue 
                    value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                    className={cn("font-medium text-sm", tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                  />
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/transactions">Ver Todas as Transações</Link>
            </Button>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div custom={11} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><BarChart className="mr-2 h-5 w-5 text-primary" />Visão Geral de Gastos (Este Mês)</CardTitle>
            <CardDescription>Suas principais categorias de despesas (dados de exemplo).</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[250px] flex items-center justify-center">
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
          </CardContent>
        </Card>
        </motion.div>
      </div>
      
       <motion.div custom={12} variants={cardVariants} initial="hidden" animate="visible">
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
