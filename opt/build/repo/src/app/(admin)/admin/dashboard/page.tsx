// src/app/(admin)/admin/dashboard/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, Users, Percent, Share2, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Line, LineChart as LineChartRecharts, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Pie, PieChart as PieChartRecharts, Cell } from "recharts";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

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
  
  const renderResponsivePieLabel = (props: PieSectorDataItem) => {
    const { cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0, name = '' } = props;
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
            <CardContent className="flex-grow"><div className="text-2xl font-bold text-emerald-500">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Crescimento (Gratuitos)</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent className="flex-grow"><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Módulos Compartilhados</CardTitle><Share2 className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent className="flex-grow"><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Compart. por Assinantes</CardTitle><Star className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent className="flex-grow"><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Dados indisponíveis</p></CardContent>
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
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">Nenhum dado para exibir.</div>
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
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">Nenhum dado para exibir.</div>
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
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">Nenhum dado para exibir.</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
