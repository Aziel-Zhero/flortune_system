// src/app/(app)/dashboard/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PrivateValue } from "@/components/shared/private-value";
import { DollarSign, CreditCard, TrendingUp, Sprout } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { APP_NAME, DEFAULT_USER } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect } from "react";


const summaryData = [
  { title: "Saldo Total", value: 12345.67, icon: DollarSign, trend: "+2,5%", trendColor: "text-emerald-500" },
  { title: "Receita Este Mês", value: 5678.90, icon: TrendingUp, trend: "+10,1%", trendColor: "text-emerald-500" },
  { title: "Despesas Este Mês", value: 2345.12, icon: CreditCard, trend: "-5,2%", trendColor: "text-red-500" },
  { title: "Progresso Meta Poupança", value: 65, unit: "%", icon: Sprout, trend: "+5%", trendColor: "text-emerald-500" },
];

const recentTransactions = [
  { id: "1", description: "Supermercado", amount: -55.20, date: "2024-07-27", category: "Alimentação" },
  { id: "2", description: "Depósito de Salário", amount: 2500.00, date: "2024-07-26", category: "Receita" },
  { id: "3", description: "Jantar Restaurante", amount: -78.50, date: "2024-07-25", category: "Restaurantes" },
  { id: "4", description: "Assinatura Online", amount: -12.99, date: "2024-07-25", category: "Assinaturas" },
];

export default function DashboardPage() {
  const handleViewAllInsights = () => {
    console.log("Botão 'Ver Todos os Insights' clicado.");
    toast({ title: "Navegação", description: "Visualizando todos os insights (placeholder)." });
  };
  
  useEffect(() => {
    document.title = `Painel - ${APP_NAME}`;
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        type: "spring",
        stiffness: 150,
        damping: 20,
      },
    }),
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      } 
    },
  };


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Bem-vinda de volta, ${DEFAULT_USER.name.split(" ")[0]}!`}
        description="Aqui está seu resumo financeiro para este mês."
        actions={
          <Button asChild>
            <Link href="/transactions/new">Adicionar Transação</Link> {/* Placeholder */}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item, index) => (
          <motion.div
            key={item.title}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="h-full"
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </CardTitle>
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">
                  {item.unit === "%" ? (
                     <span><PrivateValue value={String(item.value)} />%</span>
                  ) : (
                    <span>R$<PrivateValue value={item.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /></span>
                  )}
                </div>
                <p className={cn("text-xs text-muted-foreground mt-1", item.trendColor)}>
                  {item.trend} do último mês
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Transações Recentes</CardTitle>
              <CardDescription>Suas últimas atividades financeiras.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recentTransactions.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date} - {tx.category}</p>
                    </div>
                    <PrivateValue 
                      value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                      className={cn("font-medium", tx.amount > 0 ? "text-emerald-600" : "text-red-600")}
                    />
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-4 w-full" asChild>
                <Link href="/transactions">Ver Todas as Transações</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Visão Geral de Gastos</CardTitle>
              <CardDescription>Uma rápida olhada nas suas categorias de gastos.</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
               <Image src="https://placehold.co/300x200.png" alt="Gráfico de Gastos" width={300} height={200} data-ai-hint="data chart"/>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
         <Card className="shadow-sm bg-primary/10 border-primary/30">
          <CardHeader>
              <CardTitle className="font-headline text-primary flex items-center">
                  <Sprout className="mr-2 h-6 w-6"/>
                  Sugestões Inteligentes
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
              <p className="text-sm text-foreground/80">Você gastou <PrivateValue value="R$120" className="font-semibold"/> em café este mês. Considere preparar em casa para economizar!</p>
              <p className="text-sm text-foreground/80">Seus gastos com assinaturas aumentaram 15%. <Link href="/budgets" className="text-primary hover:underline">Revisar suas assinaturas?</Link></p>
               <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary" onClick={handleViewAllInsights}>
                  Ver Todos os Insights
                </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
