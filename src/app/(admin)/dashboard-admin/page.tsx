// src/app/(admin)/dashboard-admin/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, Code, Star, Home, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pie, PieChart as PieChartRecharts, ResponsiveContainer, Cell } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";

const cardData = [
  { title: "Total de Usuários", value: "1,250", icon: Users },
  { title: "Usuários Gratuitos", value: "1,100", icon: Users },
  { title: "Usuários Pagantes", value: "150", icon: Star },
  { title: "Assinantes (DEV)", value: "45", icon: Code },
  { title: "Assinantes (Corporativo)", value: "12", icon: Briefcase },
];

const userDistributionData = [
    { name: 'Gratuitos', value: 1100, fill: 'hsl(var(--chart-1))' },
    { name: 'Pagantes (Comum)', value: 93, fill: 'hsl(var(--chart-2))' }, // 150 - 45 - 12
    { name: 'DEV', value: 45, fill: 'hsl(var(--chart-3))' },
    { name: 'Corporativo', value: 12, fill: 'hsl(var(--chart-4))' },
];


export default function AdminDashboardPage() {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", stiffness: 100 },
    }),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Home"
        icon={<Home />}
        description="Visão geral e métricas chave do Flortune Workspace."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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
      
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><PieChartIcon /> Distribuição de Usuários</CardTitle>
                <CardDescription>Proporção de usuários por tipo de plano.</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                  <ChartContainer config={{}} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChartRecharts>
                            <ChartTooltip cursor={true} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={userDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} >
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

          <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
            <Card>
              <CardHeader>
                  <CardTitle>Bem-vindo ao Flortune Workspace!</CardTitle>
                  <CardDescription>Esta é a base do seu painel de controle. A partir daqui, você pode expandir para gerenciar usuários, campanhas de marketing, visualizar dashboards de performance e muito mais.</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
       </div>

    </div>
  );
}
