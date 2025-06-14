// src/app/(app)/budgets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Target, Edit3, Trash2, Sprout } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const budgetsData = [
  { id: "budget_1", category: "Alimentação", limit: 400, spent: 250.75 },
  { id: "budget_2", category: "Restaurantes", limit: 200, spent: 180.50 },
  { id: "budget_3", category: "Entretenimento", limit: 150, spent: 75.00 },
  { id: "budget_4", category: "Compras", limit: 300, spent: 320.00 }, // Overspent
];

export default function BudgetsPage() {
  const [currentBudgets, setCurrentBudgets] = useState(budgetsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    document.title = `Orçamentos - ${APP_NAME}`;
  }, []);

  const handleDeleteClick = (budgetId: string, budgetCategory: string) => {
    setItemToDelete({ id: budgetId, name: budgetCategory });
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      setCurrentBudgets(prevBudgets => prevBudgets.filter(b => b.id !== itemToDelete.id));
      toast({
        title: "Orçamento Deletado",
        description: `O orçamento "${itemToDelete.name}" foi deletado com sucesso.`,
      });
      setItemToDelete(null);
    }
    setDialogOpen(false);
  };

  const handleEditClick = (budgetId: string, budgetCategory: string) => {
    console.log(`Editando orçamento: ${budgetCategory} (ID: ${budgetId})`);
    toast({
      title: "Ação de Edição",
      description: `Redirecionando para editar o orçamento "${budgetCategory}" (placeholder).`,
    });
    // Em um app real: router.push(`/budgets/edit/${budgetId}`);
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
      },
    }),
  };

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Defina e acompanhe seus limites de gastos para diferentes categorias."
        actions={
          <Button asChild>
            <Link href="/budgets/new"> {/* Placeholder: Link para criar novo orçamento */}
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Orçamento
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentBudgets.map((budget, index) => {
          const remaining = budget.limit - budget.spent;
          const progressValue = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
          const isOverspent = remaining < 0;
          
          return (
            <motion.div
              key={budget.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              layout
            >
              <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline flex items-center">
                        <Target className="mr-2 h-5 w-5 text-primary" />
                        {budget.category}
                      </CardTitle>
                      <CardDescription>
                        Limite: <PrivateValue value={`R$${budget.limit.toFixed(2)}`} />
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(budget.id, budget.category)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(budget.id, budget.category)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <div>
                    <Progress 
                        value={progressValue} 
                        className={cn("h-3", isOverspent && "bg-destructive/20")} 
                        indicatorClassName={cn(isOverspent ? "bg-destructive" : "bg-primary")}
                    />
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Gasto:</span>
                      <PrivateValue value={`R$${budget.spent.toFixed(2)}`} className={cn(isOverspent && "text-destructive font-semibold")} />
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className={cn(isOverspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                        {isOverspent ? "Excedido:" : "Restante:"}
                      </span>
                      <PrivateValue
                        value={`R$${Math.abs(remaining).toFixed(2)}`}
                        className={cn(isOverspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
         <motion.div custom={currentBudgets.length} variants={cardVariants} initial="hidden" animate="visible" layout>
            <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] h-full text-muted-foreground hover:text-primary cursor-pointer">
                <Link href="/budgets/new" className="text-center p-6 block w-full h-full flex flex-col items-center justify-center"> {/* Placeholder */}
                    <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                    <p className="font-semibold">Criar Novo Orçamento</p>
                </Link>
            </Card>
        </motion.div>
      </div>

      <Card className="mt-8 shadow-sm bg-primary/10 border-primary/30">
        <CardHeader>
            <CardTitle className="font-headline text-primary flex items-center">
                <Sprout className="mr-2 h-6 w-6"/>
                Dicas de Orçamento
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>Revise seus orçamentos regularmente para garantir que estejam alinhados com seus objetivos financeiros.</p>
            <p>Considere a regra 50/30/20: 50% para necessidades, 30% para desejos e 20% para poupança.</p>
            <p>Use o recurso de "rollover" (em breve!) para categorias onde os gastos variam de mês a mês.</p>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja deletar o orçamento "{itemToDelete?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
