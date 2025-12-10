"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sprout, BarChart } from "lucide-react";
import { getTransactions } from "@/lib/data/get-transactions";
import { getCategories } from "@/lib/data/get-categories";
import { ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@/lib/utils";
import { PrivateValue } from "@/components/private-value";
import { SmartSuggestionCard } from "@/components/smart-suggestion-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PieCustomTooltip } from "@/components/charts/pie-custom-tooltip";

export default function DashboardPage() {
  const mockUserId = "demo";
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await getTransactions(mockUserId, { limit: 5 });

      if (!error && data) {
        setTransactions(data);
      }
      setTransactionsLoading(false);

      const categoriesResult = await getCategories(mockUserId);
      if (!categoriesResult.error && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setIsWelcomeOpen(true);
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  const handleDismissWelcome = () => setIsWelcomeOpen(false);

  const monthlySpendingByCategory = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name,
      value:
        transactions
          .filter((t) => t.categoryId === c.id && t.type === "expense")
          .reduce((acc, cur) => acc + Number(cur.amount), 0) || 0,
      fill: c.color ?? "#8884d8",
    }))
    .filter((item) => item.value > 0);

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.07, duration: 0.4 },
    }),
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1500);
  };

  return (
    <>
      <div className="flex flex-col gap-6 relative">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-headline font-semibold text-3xl tracking-tight"
        >
          Dashboard
        </motion.h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <Sprout className="mr-2 h-5 w-5 text-primary" />
                  Resumo Rápido
                </CardTitle>
                <CardDescription>Veja sua evolução financeira.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Total de transações: {transactions.length}</p>
                <p>Categorias cadastradas: {categories.length}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <Sprout className="mr-2 h-5 w-5 text-primary" />
                  Rápida ação
                </CardTitle>
                <CardDescription>Crie algo novo rapidamente.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <Button asChild>
                    <Link href="/transactions/new">Adicionar Transação</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/budgets">Criar Orçamento</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/goals">Criar Meta</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <Sprout className="mr-2 h-5 w-5 text-primary" />
                  Últimas Transações
                </CardTitle>
                <CardDescription>Veja o que aconteceu recentemente.</CardDescription>
              </CardHeader>

              <CardContent>
                {transactionsLoading ? (
                  <Skeleton className="w-full h-[200px]" />
                ) : transactions.length > 0 ? (
                  <ul className="space-y-2">
                    {transactions.map((tx: any) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.date + "T00:00:00Z").toLocaleDateString("pt-BR")} -{" "}
                            {tx.category?.name || "Sem Categoria"}
                          </p>
                        </div>

                        <PrivateValue
                          value={tx.amount.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                          className={cn(
                            "font-medium text-sm",
                            tx.type === "income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma transação recente encontrada.
                  </p>
                )}

                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link href="/transactions">Ver Todas as Transações</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={11} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="font-headline flex items-center">
                  <BarChart className="mr-2 h-5 w-5 text-primary" />
                  Visão Geral de Gastos (Este Mês)
                </CardTitle>
                <CardDescription>Suas principais categorias de despesas.</CardDescription>
              </CardHeader>

              <CardContent className="min-h-[280px] flex items-center justify-center">
                {transactionsLoading ? (
                  <Skeleton className="w-full h-[200px]" />
                ) : monthlySpendingByCategory.length > 0 ? (
                  <ChartContainer config={{}} className="min-h-[200px] w-full h-64">
                    <PieChart>
                      <RechartsTooltip content={<PieCustomTooltip />} />
                      <Pie
                        data={monthlySpendingByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        labelLine={false}
                        label={({ name, percent }) =>
                          name && percent ? `${name} (${(percent * 100).toFixed(0)}%)` : ""
                        }
                      >
                        {monthlySpendingByCategory.map((entry, index) => (
                          <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sem dados de gastos para exibir o gráfico.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div custom={12} variants={cardVariants} initial="hidden" animate="visible">
          <SmartSuggestionCard />
        </motion.div>
      </div>

      <Dialog open={isWelcomeOpen} onOpenChange={setIsWelcomeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-primary flex items-center text-2xl">
              <Sprout className="mr-2 h-7 w-7" />
              Bem-vindo(a) ao Flortune!
            </DialogTitle>

            <DialogDescription className="pt-2 text-base">
              Estamos felizes em ter você aqui. Flortune é seu novo parceiro para cultivar um futuro financeiro mais próspero.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <h4 className="font-semibold">Primeiros Passos:</h4>

            <ul className="list-disc list-inside text-sm text-foreground/80 space-y-2">
              <li>
                Adicione sua primeira transação clicando no botão{" "}
                <span className="font-bold">Adicionar Transação</span> no topo da página.
              </li>
              <li>
                Crie um orçamento para uma categoria de gastos na página{" "}
                <Link href="/budgets" className="underline font-medium" onClick={handleDismissWelcome}>
                  Orçamentos
                </Link>
                .
              </li>
              <li>
                Defina sua primeira meta financeira na página{" "}
                <Link href="/goals" className="underline font-medium" onClick={handleDismissWelcome}>
                  Metas
                </Link>
                .
              </li>
            </ul>
          </div>

          <DialogFooter>
            <Button onClick={handleDismissWelcome}>Começar a Cultivar!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
