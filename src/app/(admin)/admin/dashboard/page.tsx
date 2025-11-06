// src/app/(admin)/admin/dashboard/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, Users, Percent, Share2, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Line, LineChart as LineChartRecharts, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Pie, PieChart as PieChartRecharts, Cell } from "recharts";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const newUsersData = [
  { month: "Jan", users: 150, free: 130, paid: 20 }, 
  { month: "Fev", users: 220, free: 180, paid: 40 },
  { month: "Mar", users: 180, free: 140, paid: 40 }, 
  { month: "Abr", users: 300, free: 250, paid: 50 },
  { month: "Mai", users: 250, free: 200, paid: 50 }, 
  { month: "Jun", users: 400, free: 320, paid: 80 },
];

const subscribersData = [
  { month: "Jan", subscribers: 20 }, { month: "Fev", subscribers: 35 },
  { month: "Mar", subscribers: 50 }, { month: "Abr", subscribers: 80 },
  { month: "Mai", subscribers: 110 }, { month: "Jun", subscribers: 150 },
];

const shareDistributionData = [
    { name: 'Usuários Gratuitos', value: 40, fill: 'hsl(var(--chart-1))' },
    { name: 'Assinantes', value: 60, fill: 'hsl(var(--chart-2))' },
];

export default function AdminDashboardPage() {
  const isMobile = useIsMobile();
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  useEffect(() => {
    // Simular notificações de eventos importantes
    const timer1 = setTimeout(() => {
      toast({
        title: "🚀 Novo Assinante!",
        description: "Maria Oliveira assinou o plano Mestre Jardineiro.",
      });
    }, 3000);

    const timer2 = setTimeout(() => {
      toast({
        title: "✅ Lead Convertido",
        description: "João da Silva aceitou a oferta e tornou-se assinante.",
      });
    }, 6000);
    
    return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
    }

  }, []);
  
  const renderResponsivePieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * (isMobile ? 1.1 : 1.2);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    const label = isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} (${(percent * 100).toFixed(0)}%)`;

    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={textAnchor} dominantBaseline="central" className="text-xs">
        {label}
      </text>
    );
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        icon={<LayoutDashboard />}
        description="Análise detalhada do crescimento de usuários e assinantes."
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Taxa de Conversão (Mês)</CardTitle><Percent className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent className="flex-grow"><div className="text-2xl font-bold text-emerald-500">4.2%</div><p className="text-xs text-muted-foreground">+1.1% vs. mês anterior</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Crescimento (Gratuitos)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent className="flex-grow"><div className="text-2xl font-bold">+180</div><p className="text-xs text-muted-foreground">Novos usuários gratuitos este mês</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Módulos Compartilhados</CardTitle><Share2 className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent className="flex-grow"><div className="text-2xl font-bold">87</div><p className="text-xs text-muted-foreground">Total de módulos com acesso compartilhado</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Compart. por Assinantes</CardTitle><Star className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent className="flex-grow"><div className="text-2xl font-bold">52</div><p className="text-xs text-muted-foreground">Módulos compartilhados por usuários pagantes</p></CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Novos Usuários por Mês</CardTitle>
              <CardDescription>Total de novos usuários (gratuitos e pagantes).</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{ users: { label: "Total" }, free: {label: "Gratuitos"}, paid: {label: "Pagantes"} }} className="w-full h-full">
                  <BarChartRecharts data={newUsersData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis />
                    <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="free" fill="hsl(var(--chart-2))" radius={4} stackId="a" />
                    <Bar dataKey="paid" fill="hsl(var(--chart-1))" radius={4} stackId="a" />
                  </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
         <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Assinantes</CardTitle>
              <CardDescription>Evolução do número de usuários pagantes.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{ subscribers: { label: "Assinantes", color: "hsl(var(--primary))" } }} className="w-full h-full">
                  <LineChartRecharts data={subscribersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="subscribers" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Compartilhamentos</CardTitle>
              <CardDescription>Proporção de módulos compartilhados por tipo de usuário.</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex justify-center">
              <ChartContainer config={{}} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChartRecharts>
                        <RechartsTooltip cursor={true} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={shareDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={isMobile ? 70 : 90} labelLine={false} label={renderResponsivePieLabel}>
                            {shareDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent />} />
                    </PieChartRecharts>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
