// src/app/(app)/dev/dashboard/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, DollarSign, Target, Briefcase, TrendingUp, TrendingDown, Users, PieChart as PieChartIcon } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { motion } from "framer-motion";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Line, LineChart as LineChartRecharts, Pie, PieChart as PieChartRecharts, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";

// Mock Data
const projectsSummary = { totalRevenue: 125000, totalCost: 42000 };
const profit = projectsSummary.totalRevenue - projectsSummary.totalCost;
const clients = { active: 12, newThisMonth: 2 };
const tasks = { completed: 87, pending: 23 };

const monthlyProfitData = [
  { month: "Jan", profit: 12000 }, { month: "Fev", profit: 15000 },
  { month: "Mar", profit: 13500 }, { month: "Abr", profit: 18000 },
  { month: "Mai", profit: 17500 }, { month: "Jun", profit: 21000 },
];
const profitChartConfig = { profit: { label: "Lucro", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

const revenueByServiceData = [
  { name: 'Website Institucional', revenue: 45000, fill: "hsl(var(--chart-1))" },
  { name: 'E-commerce', revenue: 35000, fill: "hsl(var(--chart-2))" },
  { name: 'Automação', revenue: 25000, fill: "hsl(var(--chart-3))" },
  { name: 'Manutenção', revenue: 20000, fill: "hsl(var(--chart-4))" },
];

export default function DevDashboardPage() {
  useEffect(() => {
    document.title = `Dashboard DEV - ${APP_NAME}`;
  }, []);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0, transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard do Desenvolvedor"
        description="Uma visão geral da saúde financeira e operacional dos seus projetos."
        icon={<AreaChart className="h-6 w-6 text-primary" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Receita Total</CardTitle><TrendingUp className="h-4 w-4 text-emerald-500"/></CardHeader>
            <CardContent><p className="text-2xl font-bold"><PrivateValue value={projectsSummary.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p><p className="text-xs text-muted-foreground">de todos os projetos</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Custos Totais</CardTitle><TrendingDown className="h-4 w-4 text-destructive"/></CardHeader>
            <CardContent><p className="text-2xl font-bold"><PrivateValue value={projectsSummary.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p><p className="text-xs text-muted-foreground">infra, ferramentas, etc.</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle><DollarSign className="h-4 w-4 text-primary"/></CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary"><PrivateValue value={profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/></p><p className="text-xs text-muted-foreground">Receita - Custos</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle><Users className="h-4 w-4 text-blue-500"/></CardHeader>
            <CardContent><p className="text-2xl font-bold">{clients.active}</p><p className="text-xs text-muted-foreground">+{clients.newThisMonth} este mês</p></CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><TrendingUp /> Lucro Mensal (Histórico)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer config={profitChartConfig} className="w-full h-full">
                <LineChartRecharts accessibilityLayer data={monthlyProfitData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                   <CartesianGrid vertical={false} />
                   <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                   <YAxis tickFormatter={(value) => `R$${(value / 1000)}k`}/>
                   <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                   <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} />
                </LineChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon /> Receita por Tipo de Serviço</CardTitle>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <ChartContainer config={{}} className="w-full h-full">
                  <PieChartRecharts>
                      <RechartsTooltip cursor={true} content={<ChartTooltipContent />} />
                      <Pie data={revenueByServiceData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {revenueByServiceData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                      </Pie>
                  </PieChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
