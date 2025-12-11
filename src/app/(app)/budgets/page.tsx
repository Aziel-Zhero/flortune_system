// src/app/(app)/budgets/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Target, Edit3, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import type { Budget } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetForm } from "./budget-form";
import { useSession } from "@/contexts/auth-context";
import { getBudgets, deleteBudget } from "@/services/budget.service";

export default function BudgetsPage() {
  const { session, isLoading: isAuthLoading } = useSession();
  const [currentBudgets, setCurrentBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: { id: string; name: string } | null }>({ isOpen: false, item: null });
  const [editDialog, setEditDialog] = useState<{ isOpen: boolean; budget: Budget | null }>({ isOpen: false, budget: null });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchBudgetsData = useCallback(async () => {
    if (!session?.user?.id) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    const { data, error } = await getBudgets(session.user.id);
    if (error) {
      toast({ title: "Erro ao carregar orçamentos", description: error, variant: "destructive" });
    } else {
      setCurrentBudgets(data || []);
    }
    setIsLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    document.title = `Orçamentos - ${APP_NAME}`;
    if (!isAuthLoading) {
      fetchBudgetsData();
    }
  }, [isAuthLoading, fetchBudgetsData]);

  const handleDeleteClick = (budget: Budget) => {
    setDeleteDialog({ isOpen: true, item: { id: budget.id, name: budget.category?.name || 'desconhecido' }});
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.item) {
      const originalBudgets = [...currentBudgets];
      setCurrentBudgets(prev => prev.filter(b => b.id !== deleteDialog.item!.id));
      
      const { error } = await deleteBudget(deleteDialog.item.id);
      if(error) {
        toast({ title: "Erro ao deletar", description: error, variant: "destructive" });
        setCurrentBudgets(originalBudgets); // Reverte a UI em caso de erro
      } else {
        toast({ title: "Orçamento Deletado!", description: `O orçamento para "${deleteDialog.item.name}" foi removido.` });
      }
    }
    setDeleteDialog({ isOpen: false, item: null });
  };

  const handleEditClick = (budget: Budget) => {
    setEditDialog({ isOpen: true, budget });
  };

  const handleFormSuccess = () => {
    setEditDialog({ isOpen: false, budget: null });
    setIsCreateModalOpen(false);
    toast({ title: "Sucesso!", description: "Sua lista de orçamentos será atualizada."});
    fetchBudgetsData();
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0, transition: { delay: i * 0.07, type: "spring", stiffness: 100 },
    }),
  };
  
  const finalIsLoading = isAuthLoading || isLoading;

  if (finalIsLoading) {
    return (
      <div>
        <PageHeader title="Orçamentos" description="Defina e acompanhe seus limites de gastos para diferentes categorias." actions={<Skeleton className="h-10 w-40 rounded-md" />} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, index) => (
            <Card key={index} className="shadow-sm h-full">
              <CardHeader><div className="flex justify-between items-start"><div><Skeleton className="h-6 w-3/4 mb-1" /><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-4 w-full" /></div><div className="flex gap-1"><Skeleton className="h-7 w-7 rounded-sm" /><Skeleton className="h-7 w-7 rounded-sm" /></div></div></CardHeader>
              <CardContent><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-4 w-1/2 mb-1" /><Skeleton className="h-4 w-1/3" /></CardContent>
            </Card>
          ))}
          <Card className="shadow-sm border-dashed border-2 flex items-center justify-center min-h-[200px] h-full"><Skeleton className="h-10 w-10 rounded-full mb-2" /><Skeleton className="h-5 w-3/4" /></Card>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={editDialog.isOpen || isCreateModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setEditDialog({isOpen: false, budget: null});
            setIsCreateModalOpen(false);
        }
    }}>
      <div>
        <PageHeader title="Orçamentos" icon={<Target className="mr-2 h-6 w-6 text-primary"/>} description="Defina e acompanhe seus limites de gastos para diferentes categorias." actions={
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Criar Orçamento</Button>
          </DialogTrigger>
        } />
        {currentBudgets.length === 0 && !finalIsLoading && (
          <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[240px] text-center p-6">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline mb-2">Nenhum Orçamento Criado Ainda</h3>
            <p className="text-muted-foreground mb-4 max-w-md">Orçamentos ajudam você a controlar seus gastos e alcançar suas metas. Que tal criar seu primeiro?</p>
            <DialogTrigger asChild>
                <Button size="lg" onClick={() => setIsCreateModalOpen(true)}><PlusCircle className="mr-2 h-5 w-5" />Criar Meu Primeiro Orçamento</Button>
            </DialogTrigger>
          </Card>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentBudgets.map((budget, index) => {
            const remaining = budget.limit_amount - budget.spent_amount;
            const progressValue = budget.limit_amount > 0 ? Math.min((budget.spent_amount / budget.limit_amount) * 100, 100) : 0;
            const isOverspent = remaining < 0;
            return (
              <motion.div key={budget.id} custom={index} variants={cardVariants} initial="hidden" animate="visible" layout>
                <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="font-headline flex items-center"><Target className="mr-2 h-5 w-5 text-primary" />{budget.category?.name || 'Categoria Desconhecida'}</CardTitle>
                        <CardDescription>
                          Limite: <PrivateValue value={budget.limit_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(budget)}><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(budget)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div>
                      <Progress value={progressValue} className={cn("h-3", isOverspent && "bg-destructive/20")} indicatorClassName={cn(isOverspent ? "bg-destructive" : "bg-primary")} />
                      <div className="mt-3 flex justify-between text-sm"><span className="text-muted-foreground">Gasto:</span><PrivateValue value={budget.spent_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className={cn(isOverspent && "text-destructive font-semibold")} /></div>
                      <div className="flex justify-between text-sm font-medium">
                        <span className={cn(isOverspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>{isOverspent ? "Excedido:" : "Restante:"}</span>
                        <PrivateValue value={Math.abs(remaining).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className={cn(isOverspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog(prev => ({...prev, isOpen}))}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Deleção</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja deletar o orçamento para "{deleteDialog.item?.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteDialog({isOpen: false, item: null})}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>Deletar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center text-lg md:text-xl">
             {editDialog.budget ? <Edit3 className="mr-2 h-5 w-5 text-primary"/> : <PlusCircle className="mr-2 h-5 w-5 text-primary"/>}
             {editDialog.budget ? "Editar Orçamento" : "Criar Novo Orçamento"}
          </DialogTitle>
          <DialogDescription>
            {editDialog.budget ? "Ajuste os detalhes do seu orçamento." : "Defina um novo limite de gastos para uma categoria."}
          </DialogDescription>
        </DialogHeader>
        <BudgetForm onFormSuccess={handleFormSuccess} isModal={true} initialData={editDialog.budget || undefined} />
      </DialogContent>
    </Dialog>
  );
}
