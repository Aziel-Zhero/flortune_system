// src/app/(admin)/dashboard-admin/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, Code, Star, Home } from "lucide-react";
import { motion } from "framer-motion";

const cardData = [
  { title: "Total de Usuários", value: "1,250", icon: Users },
  { title: "Usuários Pagantes", value: "150", icon: Star },
  { title: "Assinantes (Plano DEV)", value: "45", icon: Code },
  { title: "Assinantes (Corporativo)", value: "12", icon: Briefcase },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <Card>
        <CardHeader>
            <CardTitle>Bem-vindo ao Flortune Workspace!</CardTitle>
            <CardDescription>Esta é a base do seu painel de controle. A partir daqui, você pode expandir para gerenciar usuários, campanhas de marketing, visualizar dashboards de performance e muito mais.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
