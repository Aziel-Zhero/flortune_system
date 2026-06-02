"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard, Users, Percent, Share2, Star, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Line, LineChart as LineChartRecharts } from "recharts";
import { toast } from "@/hooks/use-toast";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAdminAnalytics } from "@/services/admin.service";

export default function AdminDashboardAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    conversionRate: 0,
    freeUsers: 0,
    totalShared: 0,
    paidUsers: 0
  });
  const [growthData, setGrowthData] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getAdminAnalytics();
      if (error) throw new Error(error);
      if (!data) throw new Error("Nenhum dado analítico retornado.");

      const { conversionRate, freeUsers, paidUsers, growthData } = data;

      setMetrics({
        conversionRate,
        freeUsers,
        totalShared: 0, 
        paidUsers
      });

      setGrowthData(growthData);

    } catch (err: any) {
      toast({ title: "Erro Analytics", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Analytics Admin - Flortune";
    fetchAnalytics();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1850px] mx-auto w-full">
      <PageHeader
        title="Dashboard de Métricas"
        icon={<LayoutDashboard />}
        description="Análise real da performance e crescimento da plataforma."
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle><Percent className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold text-emerald-500">{metrics.conversionRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">Gratuitos para Pagantes</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Usuários Gratuitos</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.freeUsers}</div><p className="text-xs text-muted-foreground">Potenciais para conversão</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Módulos Compartilhados</CardTitle><Share2 className="h-4 w-4 text-muted-foreground"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.totalShared}</div><p className="text-xs text-muted-foreground">Interação entre usuários</p></CardContent>
          </Card>
        </motion.div>
        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Assinantes Ativos</CardTitle><Star className="h-4 w-4 text-yellow-500"/></CardHeader>
            <CardContent><div className="text-2xl font-bold">{metrics.paidUsers}</div><p className="text-xs text-muted-foreground">Receita recorrente direta</p></CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Novos Usuários (Últimos 6 Meses)</CardTitle>
              <CardDescription>Quantidade de novos registros reais por mês.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{ count: { label: "Usuários", color: "hsl(var(--primary))" } }} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChartRecharts data={growthData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChartRecharts>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
         <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Crescimento</CardTitle>
              <CardDescription>Projeção baseada na velocidade de cadastro.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{ count: { label: "Crescimento", color: "hsl(var(--chart-2))" } }} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChartRecharts data={growthData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 6 }} />
                        </LineChartRecharts>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
