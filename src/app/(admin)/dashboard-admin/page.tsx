
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Code, Star, Home, PieChart as PieChartIcon, TrendingUp, Megaphone, Leaf, UserPlus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart as PieChartRecharts, ResponsiveContainer, Cell } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export default function AdminDashboardPage() {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<StatCard[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRealStats = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: profiles, error } = await supabase.from('profiles').select('plan_id');
      
      if (error) throw error;

      const total = profiles?.length || 0;
      const cultivador = profiles?.filter(p => p.plan_id === 'tier-cultivador' || !p.plan_id).length || 0;
      const mestre = profiles?.filter(p => p.plan_id === 'tier-mestre').length || 0;
      const dev = profiles?.filter(p => p.plan_id === 'tier-dev').length || 0;
      const corp = profiles?.filter(p => p.plan_id === 'tier-corporativo').length || 0;

      setStats([
        { title: "Usuários Totais", value: total, icon: Users, color: "text-primary" },
        { title: "Cultivador", value: cultivador, icon: Leaf, color: "text-emerald-500" },
        { title: "Mestre Jardineiro", value: mestre, icon: Star, color: "text-yellow-500" },
        { title: "DEV", value: dev, icon: Code, color: "text-sky-500" },
        { title: "Corporativo", value: corp, icon: Briefcase, color: "text-amber-600" },
        { title: "Campanhas Ativas", value: 0, icon: Megaphone, color: "text-muted-foreground" },
      ]);

      setChartData([
        { name: 'Cultivador', value: cultivador, fill: 'hsl(var(--chart-1))' },
        { name: 'Mestre', value: mestre, fill: 'hsl(var(--chart-2))' },
        { name: 'DEV', value: dev, fill: 'hsl(var(--chart-3))' },
        { name: 'Corp', value: corp, fill: 'hsl(var(--chart-4))' },
      ].filter(d => d.value > 0));

    } catch (err: any) {
      toast({ title: "Erro ao carregar dados", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Home Admin - Flortune";
    fetchRealStats();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.15;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={textAnchor} dominantBaseline="central" className="text-[10px] md:text-xs">
        {isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
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
        title="Home"
        icon={<Home />}
        description="Visão geral real e métricas chave do Flortune Workspace."
        actions={
            <Button asChild>
                <Link href="/admin/users/new">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Usuário
                </Link>
            </Button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {stats.map((card, index) => (
          <motion.div key={card.title} custom={index} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                 <p className="text-xs text-muted-foreground mt-1">Dados reais do sistema</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
       <div className="grid grid-cols-1 gap-6">
          <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon /> Distribuição Real de Usuários</CardTitle>
              </CardHeader>
              <CardContent className="h-[25rem] flex flex-col items-center justify-center">
                  {chartData.length > 0 ? (
                    <ChartContainer config={{}} className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChartRecharts margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <ChartTooltip cursor={true} content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                  data={chartData}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={isMobile ? 50 : 80}
                                  outerRadius={isMobile ? 80 : 110}
                                  labelLine={false}
                                  label={renderCustomizedLabel}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChartRecharts>
                        </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <p className="text-muted-foreground">Nenhum dado para exibir.</p>
                  )}
              </CardContent>
            </Card>
          </motion.div>
       </div>
    </div>
  );
}
