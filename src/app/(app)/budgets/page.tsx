
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
import type { Budget } from "@/types/database.types"; // Import Budget type

// Updated mock data to reflect new Budget structure (with UUIDs as strings)
// TODO: Replace this with actual data fetching using budget.service.ts
const budgetsData: Budget[] = [
  { 
    id: "budget_uuid_1", 
    user_id: "user_uuid_placeholder",
    category_id: "cat_uuid_food",
    category: { id: "cat_uuid_food", name: "Alimentação", type: "expense", icon: "Utensils", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_default: true, user_id: null },
    limit_amount: 400, 
    spent_amount: 250.75,
    period_start_date: "2024-08-01",
    period_end_date: "2024-08-31",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  { 
    id: "budget_uuid_2", 
    user_id: "user_uuid_placeholder",
    category_id: "cat_uuid_restaurants",
    category: { id: "cat_uuid_restaurants", name: "Restaurantes", type: "expense", icon: "Utensils", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_default: false, user_id: "user_uuid_placeholder" },
    limit_amount: 200, 
    spent_amount: 180.50,
    period_start_date: "2024-08-01",
    period_end_date: "2024-08-31",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
   { 
    id: "budget_uuid_3", 
    user_id: "user_uuid_placeholder",
    category_id: "cat_uuid_entertainment",
    category: { id: "cat_uuid_entertainment", name: "Entretenimento", type: "expense", icon: "Ticket", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_default: true, user_id: null },
    limit_amount: 150, 
    spent_amount: 75.00,
    period_start_date: "2024-08-01",
    period_end_date: "2024-08-31",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  { 
    id: "budget_uuid_4", 
    user_id: "user_uuid_placeholder",
    category_id: "cat_uuid_shopping",
    category: { id: "cat_uuid_shopping", name: "Compras", type: "expense", icon: "ShoppingCart", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_default: true, user_id: null },
    limit_amount: 300, 
    spent_amount: 320.00, // Overspent
    period_start_date: "2024-08-01",
    period_end_date: "2024-08-31",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function BudgetsPage() {
  const [currentBudgets, setCurrentBudgets] = useState(budgetsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null); // ID is string

  useEffect(() => {
    document.title = `Orçamentos - ${APP_NAME}`;
    // TODO: Fetch budgets using budget.service.ts
  }, []);

  const handleDeleteClick = (budgetId: string, budgetCategoryName: string) => { // ID is string
    setItemToDelete({ id: budgetId, name: budgetCategoryName });
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      // TODO: Call deleteBudget from budget.service.ts
      setCurrentBudgets(prevBudgets => prevBudgets.filter(b => b.id !== itemToDelete.id));
      toast({
        title: "Orçamento Deletado (Simulado)",
        description: `O orçamento "${itemToDelete.name}" foi deletado com sucesso.`,
      });
      setItemToDelete(null);
    }
    setDialogOpen(false);
  };

  const handleEditClick = (budgetId: string, budgetCategoryName: string) => { // ID is string
    console.log(`Editando orçamento: ${budgetCategoryName} (ID: ${budgetId})`);
    toast({
      title: "Ação de Edição",
      description: `Redirecionando para editar o orçamento "${budgetCategoryName}" (placeholder).`,
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
            <Link href="/budgets/new"> 
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Orçamento
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentBudgets.map((budget, index) => {
          const remaining = budget.limit_amount - budget.spent_amount;
          const progressValue = budget.limit_amount > 0 ? Math.min((budget.spent_amount / budget.limit_amount) * 100, 100) : 0;
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
                        {budget.category?.name || 'Categoria Desconhecida'}
                      </CardTitle>
                      <CardDescription>
                        Período: {new Date(budget.period_start_date + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(budget.period_end_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                         <br/>
                        Limite: <PrivateValue value={`R$${budget.limit_amount.toFixed(2)}`} />
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(budget.id, budget.category?.name || 'N/A')}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(budget.id, budget.category?.name || 'N/A')}>
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
                      <PrivateValue value={`R$${budget.spent_amount.toFixed(2)}`} className={cn(isOverspent && "text-destructive font-semibold")} />
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
                <Link href="/budgets/new" className="text-center p-6 block w-full h-full flex flex-col items-center justify-center"> 
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
              Você tem certeza que deseja deletar o orçamento para "{itemToDelete?.name}"? Esta ação não pode ser desfeita.
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
