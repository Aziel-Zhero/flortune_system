// src/app/(admin)/dashboard-admin/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Code, Star, Home, PieChart as PieChartIcon, TrendingUp, TrendingDown, Megaphone, Leaf, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart as PieChartRecharts, ResponsiveContainer, Cell } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const cardData = [
  { title: "Usuários Totais", value: "1.250", icon: Users, trend: "+5.2%", trend_color: "text-emerald-500" },
  { title: "Cultivador", value: "1.100", icon: Leaf, trend: "+5.8%", trend_color: "text-emerald-500" },
  { title: "Mestre Jardineiro", value: "93", icon: Star, trend: "+2.1%", trend_color: "text-emerald-500" },
  { title: "DEV", value: "45", icon: Code, trend: "-1.2%", trend_color: "text-destructive" },
  { title: "Corporativo", value: "12", icon: Briefcase, trend: "+4.5%", trend_color: "text-emerald-500" },
  { title: "Origem de Campanhas", value: "28", icon: Megaphone, trend: "+10%", trend_color: "text-emerald-500" },
];

const userDistributionData = [
    { name: 'Cultivador', value: 1100, fill: 'hsl(var(--chart-1))' },
    { name: 'Mestre Jardineiro', value: 93, fill: 'hsl(var(--chart-2))' },
    { name: 'DEV', value: 45, fill: 'hsl(var(--chart-3))' },
    { name: 'Corporativo', value: 12, fill: 'hsl(var(--chart-4))' },
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

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.15;
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
        title="Home"
        icon={<Home />}
        description="Visão geral e métricas chave do Flortune Workspace."
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
        {cardData.map((card, index) => (
          <motion.div
            key={card.title}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                 <p className={`text-xs ${card.trend_color}`}>
                    {card.trend} vs. mês anterior
                 </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
       <div className="grid grid-cols-1 gap-6">
          <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon /> Distribuição de Usuários</CardTitle>
              </CardHeader>
              <CardContent className="h-[22rem] flex flex-col items-center justify-center">
                  <ChartContainer config={{}} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChartRecharts margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <ChartTooltip cursor={true} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                              data={userDistributionData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={isMobile ? 40 : 60}
                              outerRadius={isMobile ? 70 : 90}
                              labelLine={false}
                              label={renderCustomizedLabel}
                            >
                                {userDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
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
