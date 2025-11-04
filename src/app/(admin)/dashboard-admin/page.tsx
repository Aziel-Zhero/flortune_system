// src/app/(admin)/dashboard-admin/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, Code, Star, Home, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import { PrivateValue } from "@/components/shared/private-value";

const cardData = [
  { title: "Total de Usuários", value: "1,250", icon: Users },
  { title: "Usuários Pagantes", value: "150", icon: Star },
  { title: "Valor Total da Receita", value: <PrivateValue value={25340.50.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />, icon: DollarSign },
  { title: "Assinantes (DEV)", value: "45", icon: Code },
  { title: "Assinantes (Corporativo)", value: "12", icon: Briefcase },
];

const newUsersData = [
  { month: "Jan", users: 150 }, { month: "Fev", users: 220 },
  { month: "Mar", users: 180 }, { month: "Abr", users: 300 },
  { month: "Mai", users: 250 }, { month: "Jun", users: 400 },
];

const subscribersData = [
  { month: "Jan", subscribers: 20 }, { month: "Fev", subscribers: 35 },
  { month: "Mar", subscribers: 50 }, { month: "Abr", subscribers: 80 },
  { month: "Mai", subscribers: 110 }, { month: "Jun", subscribers: 150 },
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
              <CardTitle>Novos Usuários por Mês</CardTitle>
              <CardDescription>Acompanhe o crescimento da base de usuários.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{}} className="w-full h-full">
                  <BarChart data={newUsersData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis />
                    <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
         <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Assinantes</CardTitle>
              <CardDescription>Evolução do número de usuários pagantes.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{}} className="w-full h-full">
                  <LineChart data={subscribersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="subscribers" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
              <CardTitle>Bem-vindo ao Flortune Workspace!</CardTitle>
              <CardDescription>Esta é a base do seu painel de controle. A partir daqui, você pode expandir para gerenciar usuários, campanhas de marketing, visualizar dashboards de performance e muito mais.</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
    </div>
  );
}
