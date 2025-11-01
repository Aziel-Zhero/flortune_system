// src/app/(app)/goals/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Trophy, Edit3, Trash2, CalendarClock, AlertTriangle, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getFinancialGoals, deleteFinancialGoal } from "@/services/goal.service";
import type { FinancialGoal } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import * as LucideIcons from "lucide-react";
import { FinancialGoalForm } from "./goal-form"; 

const getLucideIcon = (iconName?: string | null): React.ElementType => {
  if (!iconName) return Trophy; 
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Trophy;
};

export default function GoalsPage() {
  const [currentGoals, setCurrentGoals] = useState<FinancialGoal[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: { id: string; name: string } | null }>({ isOpen: false, item: null });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchGoalsData = useCallback(async () => {
    const mockUserId = "mock-user-id";
    setIsLoadingData(true);
    try {
      const { data, error } = await getFinancialGoals(mockUserId);
      if (error) {
        toast({ title: "Erro ao buscar metas", description: error.message, variant: "destructive" });
        setCurrentGoals([]);
      } else {
        setCurrentGoals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      toast({ title: "Erro inesperado", description: "Não foi possível carregar as metas.", variant: "destructive" });
      setCurrentGoals([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    document.title = `Metas Financeiras - ${APP_NAME}`;
    fetchGoalsData();
  }, [fetchGoalsData]);

  const handleDeleteClick = (goalId: string, goalName: string) => {
    setDeleteDialog({ isOpen: true, item: { id: goalId, name: goalName } });
  };

  const handleConfirmDelete = async () => {
    const mockUserId = "mock-user-id";
    if (deleteDialog.item) {
      const originalGoals = [...currentGoals];
      setCurrentGoals(prevGoals => prevGoals.filter(g => g.id !== deleteDialog.item!.id));
      
      const { error } = await deleteFinancialGoal(deleteDialog.item.id, mockUserId);
      if (error) {
        toast({
          title: "Erro ao Deletar",
          description: error.message || `Não foi possível deletar a meta "${deleteDialog.item.name}".`,
          variant: "destructive",
        });
        setCurrentGoals(originalGoals);
      } else {
        toast({
          title: "Meta Deletada",
          description: `A meta "${deleteDialog.item.name}" foi deletada com sucesso.`,
        });
      }
    }
    setDeleteDialog({ isOpen: false, item: null });
  };

  const handleEditClick = (goalId: string, goalName: string) => {
    toast({
      title: "Editar Meta",
      description: `Funcionalidade de edição para "${goalName}" (placeholder).`,
    });
  };

  const handleGoalCreated = () => {
    setIsCreateModalOpen(false);
    fetchGoalsData(); 
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.07,
        type: "spring",
        stiffness: 100,
      },
    }),
  };
  
  if (isLoadingData) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Metas Financeiras"
          description="Defina, acompanhe e alcance suas aspirações financeiras."
          icon={<Trophy className="h-6 w-6 text-primary"/>}
          actions={<Skeleton className="h-10 w-44 rounded-md" />}
        />
        <div className="flex-1 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, index) => (
            <Card key={index} className="shadow-sm h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-6 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-7 w-7 rounded-sm" />
                    <Skeleton className="h-7 w-7 rounded-sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-3" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
           <Card className="shadow-sm border-dashed border-2 flex items-center justify-center min-h-[200px] h-full">
             <Button variant="ghost" className="text-center p-6 block w-full h-full flex flex-col items-center justify-center text-muted-foreground focus:outline-none" disabled>
                <Skeleton className="h-10 w-10 rounded-full mb-2" />
                <Skeleton className="h-5 w-3/4" />
            </Button>
          </Card>
        </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <div className="flex flex-col h-full">
        <PageHeader
          title="Metas Financeiras"
          description="Defina, acompanhe e alcance suas aspirações financeiras."
          icon={<Trophy className="h-6 w-6 text-primary"/>}
          actions={
            <DialogTrigger asChild>
              <Button> 
                <PlusCircle className="mr-2 h-4 w-4" />
                Definir Nova Meta
              </Button>
            </DialogTrigger>
          }
        />
        <div className="flex-1 overflow-y-auto">
        {currentGoals.length === 0 && !isLoadingData && (
          <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[240px] text-center p-6">
              <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold font-headline mb-2">Nenhuma Meta Definida Ainda</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Metas financeiras são o mapa para seus sonhos. Comece definindo sua primeira meta e veja seu progresso florescer!
              </p>
              <DialogTrigger asChild>
                  <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Definir Minha Primeira Meta
                  </Button>
              </DialogTrigger>
          </Card>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {currentGoals.map((goal, index) => {
            const progressValue = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
            const isAchieved = goal.status === 'achieved';
            const GoalIcon = getLucideIcon(goal.icon);

            return (
              <motion.div
                key={goal.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                layout
              >
                <Card className={cn("shadow-sm hover:shadow-md transition-shadow h-full flex flex-col", isAchieved && "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500")}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-lg",
                                isAchieved ? "bg-emerald-100 dark:bg-emerald-800" : "bg-muted"
                            )}>
                                <GoalIcon className={cn("h-6 w-6", isAchieved ? "text-emerald-600 dark:text-emerald-400" : "text-primary")} />
                            </div>
                            <div>
                                <CardTitle className={cn("font-headline text-lg md:text-xl", isAchieved && "text-emerald-700 dark:text-emerald-300")}>
                                {isAchieved && <Trophy className="inline mr-1.5 h-5 w-5 text-yellow-500" />}
                                {goal.name}
                                </CardTitle>
                                {goal.deadline_date && (
                                  <CardDescription className="flex items-center text-xs text-muted-foreground">
                                      <CalendarClock className="mr-1 h-3 w-3"/> Prazo: {new Date(goal.deadline_date + 'T00:00:00Z').toLocaleDateString('pt-BR')}
                                  </CardDescription>
                                )}
                            </div>
                        </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(goal.id, goal.name)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(goal.id, goal.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div>
                      <Progress 
                          value={progressValue} 
                          className={cn("h-3 mb-3", isAchieved ? "bg-emerald-200 dark:bg-emerald-700" : "bg-primary/20 dark:bg-primary/30")}
                          indicatorClassName={cn(isAchieved ? "bg-emerald-500 dark:bg-emerald-400" : "bg-primary")}
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Guardado:</span>
                        <PrivateValue value={goal.current_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} className={cn(isAchieved && "text-emerald-600 dark:text-emerald-400 font-semibold")} />
                      </div>
                      <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>Meta:</span>
                        <PrivateValue value={goal.target_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                      </div>
                    </div>
                    {isAchieved && (
                        <p className="text-center mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-md">
                            Meta Alcançada! 🎉
                        </p>
                    )}
                     {goal.status === 'cancelled' && (
                        <p className="text-center mt-4 text-sm font-semibold text-muted-foreground p-2 bg-muted/50 rounded-md">
                            Meta Cancelada
                        </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
           {currentGoals.length > 0 && !isLoadingData && (
              <motion.div custom={currentGoals.length} variants={cardVariants} initial="hidden" animate="visible" layout>
                  <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] h-full text-muted-foreground hover:text-primary cursor-pointer">
                     <DialogTrigger asChild>
                       <button className="text-center p-6 block w-full h-full flex flex-col items-center justify-center focus:outline-none"> 
                          <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                          <p className="font-semibold">Definir Nova Meta Financeira</p>
                       </button>
                      </DialogTrigger>
                  </Card>
              </motion.div>
           )}
        </div>
        </div>
        <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog(prev => ({...prev, isOpen}))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja deletar a meta "{deleteDialog.item?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialog({isOpen: false, item: null})}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className={buttonVariants({ variant: "destructive" })}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center text-lg md:text-xl">
            <Trophy className="mr-2 h-5 w-5 text-primary"/>
            Nova Meta Financeira
          </DialogTitle>
          <DialogDescription>
            Defina um novo objetivo para suas finanças e acompanhe seu progresso.
          </DialogDescription>
        </DialogHeader>
        {isCreateModalOpen && <FinancialGoalForm onGoalCreated={handleGoalCreated} isModal={true} />}
      </DialogContent>
    </Dialog>
  );
}
