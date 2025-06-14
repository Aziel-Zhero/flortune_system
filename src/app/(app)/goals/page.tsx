
// src/app/(app)/goals/page.tsx
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Trophy, Edit3, Trash2, CalendarClock, ShieldCheck, Plane, Laptop } from "lucide-react";
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

const goalsData = [
  { id: "goal_1", name: "Fundo de Emergência", targetAmount: 5000, currentAmount: 3500, deadline: "31/12/2024", icon: ShieldCheck, iconHint: "shield security" },
  { id: "goal_2", name: "Férias para Bali", targetAmount: 3000, currentAmount: 1200, deadline: "30/06/2025", icon: Plane, iconHint: "travel plane" },
  { id: "goal_3", name: "Novo Laptop", targetAmount: 1500, currentAmount: 1500, deadline: "30/09/2024", icon: Laptop, iconHint: "tech computer" }, // Achieved
];

export default function GoalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    document.title = `Metas Financeiras - ${APP_NAME}`;
  }, []);

  const handleDeleteClick = (goalId: string, goalName: string) => {
    setItemToDelete({ id: goalId, name: goalName });
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      console.log(`Deletando meta: ${itemToDelete.name} (ID: ${itemToDelete.id})`);
      // Aqui iria a lógica de deleção real
      const indexToDelete = goalsData.findIndex(g => g.id === itemToDelete.id);
      if (indexToDelete > -1) {
        goalsData.splice(indexToDelete, 1); // Simula deleção local
      }
      toast({
        title: "Meta Deletada",
        description: `A meta "${itemToDelete.name}" foi deletada com sucesso.`,
      });
      setItemToDelete(null);
    }
    setDialogOpen(false);
  };

  const handleEditClick = (goalId: string, goalName: string) => {
    console.log(`Editando meta: ${goalName} (ID: ${goalId})`);
    toast({
      title: "Ação de Edição",
      description: `Redirecionando para editar a meta "${goalName}" (placeholder).`,
    });
    // Em um app real: router.push(`/goals/edit/${goalId}`);
  };
  
  return (
    <div>
      <PageHeader
        title="Metas Financeiras"
        description="Defina, acompanhe e alcance suas aspirações financeiras."
        actions={
          <Button asChild>
            <Link href="/goals/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Definir Nova Meta
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goalsData.map((goal) => {
          const progressValue = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
          const isAchieved = goal.currentAmount >= goal.targetAmount;
          const GoalIcon = goal.icon;

          return (
            <Card key={goal.id} className={cn("shadow-sm hover:shadow-md transition-shadow", isAchieved && "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500")}>
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
                            <CardTitle className={cn("font-headline", isAchieved && "text-emerald-700 dark:text-emerald-300")}>
                            {isAchieved && <Trophy className="inline mr-1.5 h-5 w-5 text-yellow-500" />}
                            {goal.name}
                            </CardTitle>
                            <CardDescription className="flex items-center text-xs text-muted-foreground">
                                <CalendarClock className="mr-1 h-3 w-3"/> Prazo: {goal.deadline}
                            </CardDescription>
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
              <CardContent>
                <Progress 
                    value={progressValue} 
                    className={cn("h-3 mb-3", isAchieved ? "bg-emerald-200 dark:bg-emerald-700" : "bg-primary/20 dark:bg-primary/30")}
                    indicatorClassName={cn(isAchieved ? "bg-emerald-500 dark:bg-emerald-400" : "bg-primary")}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Guardado:</span>
                  <PrivateValue value={`R$${goal.currentAmount.toFixed(2)}`} className={cn(isAchieved && "text-emerald-600 dark:text-emerald-400 font-semibold")} />
                </div>
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                  <span>Meta:</span>
                  <PrivateValue value={`R$${goal.targetAmount.toFixed(2)}`} />
                </div>
                {isAchieved && (
                    <p className="text-center mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-md">
                        Meta Alcançada! 🎉
                    </p>
                )}
              </CardContent>
            </Card>
          );
        })}
         <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-primary cursor-pointer">
            <Link href="/goals/new" className="text-center p-6 block w-full h-full">
                <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                <p className="font-semibold">Definir Nova Meta Financeira</p>
            </Link>
        </Card>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja deletar a meta "{itemToDelete?.name}"? Esta ação não pode ser desfeita.
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
