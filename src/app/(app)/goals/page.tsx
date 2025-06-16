
// src/app/(app)/goals/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import type { FinancialGoal } from "@/types/database.types"; // Import FinancialGoal type

// Updated mock data to reflect new FinancialGoal structure (with UUIDs as strings)
// TODO: Replace this with actual data fetching using goal.service.ts
const goalsData: FinancialGoal[] = [
  { 
    id: "goal_uuid_1", 
    user_id: "user_uuid_placeholder",
    name: "Fundo de Emergência", 
    target_amount: 5000, 
    current_amount: 3500, 
    deadline_date: "2024-12-31", 
    icon: "ShieldCheck", 
    status: 'in_progress', 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  { 
    id: "goal_uuid_2", 
    user_id: "user_uuid_placeholder",
    name: "Férias para Bali", 
    target_amount: 3000, 
    current_amount: 1200, 
    deadline_date: "2025-06-30", 
    icon: "Plane", 
    status: 'in_progress',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  { 
    id: "goal_uuid_3", 
    user_id: "user_uuid_placeholder",
    name: "Novo Laptop", 
    target_amount: 1500, 
    current_amount: 1500, 
    deadline_date: "2024-09-30", 
    icon: "Laptop", 
    status: 'achieved', // Achieved
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper to get Lucide icon component by name string
const getLucideIcon = (iconName?: string | null): React.ElementType => {
  if (!iconName) return Trophy; // Default icon
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Trophy;
};
// Need to import all of LucideIcons for the helper above
import * as LucideIcons from "lucide-react";


export default function GoalsPage() {
  const [currentGoals, setCurrentGoals] = useState(goalsData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null); // ID is string

  useEffect(() => {
    document.title = `Metas Financeiras - ${APP_NAME}`;
    // TODO: Fetch goals using goal.service.ts
  }, []);

  const handleDeleteClick = (goalId: string, goalName: string) => { // ID is string
    setItemToDelete({ id: goalId, name: goalName });
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      // TODO: Call deleteFinancialGoal from goal.service.ts
      setCurrentGoals(prevGoals => prevGoals.filter(g => g.id !== itemToDelete.id));
      toast({
        title: "Meta Deletada (Simulado)",
        description: `A meta "${itemToDelete.name}" foi deletada com sucesso.`,
      });
      setItemToDelete(null);
    }
    setDialogOpen(false);
  };

  const handleEditClick = (goalId: string, goalName: string) => { // ID is string
    console.log(`Editando meta: ${goalName} (ID: ${goalId})`);
    toast({
      title: "Ação de Edição",
      description: `Redirecionando para editar a meta "${goalName}" (placeholder).`,
    });
    // Em um app real: router.push(`/goals/edit/${goalId}`);
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
        {currentGoals.map((goal, index) => {
          const progressValue = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
          const isAchieved = goal.status === 'achieved'; // Use status field
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
                              <CardTitle className={cn("font-headline", isAchieved && "text-emerald-700 dark:text-emerald-300")}>
                              {isAchieved && <Trophy className="inline mr-1.5 h-5 w-5 text-yellow-500" />}
                              {goal.name}
                              </CardTitle>
                              {goal.deadline_date && (
                                <CardDescription className="flex items-center text-xs text-muted-foreground">
                                    <CalendarClock className="mr-1 h-3 w-3"/> Prazo: {new Date(goal.deadline_date + 'T00:00:00').toLocaleDateString('pt-BR')}
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
                      <PrivateValue value={`R$${goal.current_amount.toFixed(2)}`} className={cn(isAchieved && "text-emerald-600 dark:text-emerald-400 font-semibold")} />
                    </div>
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                      <span>Meta:</span>
                      <PrivateValue value={`R$${goal.target_amount.toFixed(2)}`} />
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
         <motion.div custom={currentGoals.length} variants={cardVariants} initial="hidden" animate="visible" layout>
            <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] h-full text-muted-foreground hover:text-primary cursor-pointer">
                <Link href="/goals/new" className="text-center p-6 block w-full h-full flex flex-col items-center justify-center"> 
                    <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                    <p className="font-semibold">Definir Nova Meta Financeira</p>
                </Link>
            </Card>
        </motion.div>
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
