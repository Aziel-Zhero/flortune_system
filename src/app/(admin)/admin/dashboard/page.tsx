// src/app/(admin)/admin/dashboard/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as BarChartRecharts, Line, LineChart as LineChartRecharts, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";

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
        title="Dashboard"
        icon={<LayoutDashboard />}
        description="Análise detalhada do crescimento de usuários e assinantes."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Novos Usuários por Mês</CardTitle>
              <CardDescription>Acompanhe o crescimento da base de usuários.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{}} className="w-full h-full">
                  <BarChartRecharts data={newUsersData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8}/>
                    <YAxis />
                    <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={4} />
                  </BarChartRecharts>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
         <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Assinantes</CardTitle>
              <CardDescription>Evolução do número de usuários pagantes.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{}} className="w-full h-full">
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
      </div>
    </div>
  );
}
