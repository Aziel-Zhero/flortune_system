// src/app/(admin)/dashboard-admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, Code, Star, Home, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Pie, PieChart as PieChartRecharts, ResponsiveContainer, Cell } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";
import { useIsMobile } from "@/hooks/use-mobile";

const cardData = [
  { title: "Total de Usuários", value: "1,250", icon: Users },
  { title: "Usuários Gratuitos", value: "1,100", icon: Users },
  { title: "Usuários Pagantes", value: "150", icon: Star },
  { title: "Assinantes (DEV)", value: "45", icon: Code },
  { title: "Assinantes (Corporativo)", value: "12", icon: Briefcase },
];

const userDistributionData = [
    { name: 'Gratuitos', value: 1100, fill: 'hsl(var(--chart-1))' },
    { name: 'Pagantes (Comum)', value: 93, fill: 'hsl(var(--chart-2))' },
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
    const { cx, cy, midAngle, outerRadius, percent, index, name } = props;
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
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cardData.map((card, index) => (
          <motion.div
            key={card.title}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
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
                <CardDescription>Proporção de usuários por tipo de plano.</CardDescription>
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
                              innerRadius={60}
                              outerRadius={90}
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
