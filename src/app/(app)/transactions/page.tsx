// src/app/(app)/transactions/page.tsx
"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, ArrowUpDown, MoreHorizontal, FileDown, Edit3, Trash2, ListFilter, AlertTriangle, List, Repeat } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type { Transaction } from "@/types/database.types";
import { TransactionForm } from "./transaction-form"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- MOCK DATA ---
const sampleTransactions: Transaction[] = [
    { id: '1', user_id: 'mock-user', description: 'Salário Mensal', date: '2024-07-01', amount: 7500.00, type: 'income', is_recurring: true, created_at: '', updated_at: '', category: { id: 'cat-1', name: 'Salário', type: 'income', is_default: true, created_at: '', updated_at: '' } },
    { id: '2', user_id: 'mock-user', description: 'Aluguel & Condomínio', date: '2024-07-05', amount: 1800.00, type: 'expense', is_recurring: true, created_at: '', updated_at: '', category: { id: 'cat-2', name: 'Moradia', type: 'expense', is_default: true, created_at: '', updated_at: '' } },
    { id: '3', user_id: 'mock-user', description: 'Compras de Supermercado', date: '2024-07-03', amount: 850.50, type: 'expense', is_recurring: false, created_at: '', updated_at: '', category: { id: 'cat-3', name: 'Alimentação', type: 'expense', is_default: true, created_at: '', updated_at: '' } },
    { id: '4', user_id: 'mock-user', description: 'Projeto Freelance X', date: '2024-07-02', amount: 1200.00, type: 'income', is_recurring: false, created_at: '', updated_at: '', category: { id: 'cat-4', name: 'Renda Extra', type: 'income', is_default: true, created_at: '', updated_at: '' } },
    { id: '5', user_id: 'mock-user', description: 'Cinema', date: '2024-07-10', amount: 80.00, type: 'expense', is_recurring: false, created_at: '', updated_at: '', category: { id: 'cat-5', name: 'Lazer', type: 'expense', is_default: true, created_at: '', updated_at: '' } },
];
// --- END MOCK DATA ---

const categoryTypeColors: { [key: string]: string } = {
  income: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-800/30 dark:text-emerald-300 dark:border-emerald-700",
  expense: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-800/30 dark:text-amber-300 dark:border-amber-700",
  default: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600",
};

const getCategoryColorClass = (categoryType?: 'income' | 'expense') => {
  if (categoryType === 'income') return categoryTypeColors.income;
  if (categoryType === 'expense') return categoryTypeColors.expense;
  return categoryTypeColors.default;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: { id: string; description: string } | null }>({ isOpen: false, item: null });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleDeleteClick = (transactionId: string, transactionDescription: string) => {
    setDeleteDialog({ isOpen: true, item: { id: transactionId, description: transactionDescription } });
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.item) { 
      // Simula a exclusão no estado local
      setTransactions(prev => prev.filter(t => t.id !== deleteDialog.item!.id!)); 
      toast({
        title: "Transação Deletada (Simulação)",
        description: `A transação "${deleteDialog.item.description}" foi removida.`,
      });
    }
    setDeleteDialog({ isOpen: false, item: null });
  };

  const handleEditClick = (transactionId: string, transactionDescription: string) => {
    toast({
      title: "Editar Transação (Simulação)",
      description: `Funcionalidade de edição para "${transactionDescription}" (placeholder).`,
    });
  };
  
  const handleExportClick = () => {
    toast({
      title: "Exportar Dados (Simulação)",
      description: "Funcionalidade de exportação de transações (placeholder)."
    });
  };

  const handleTransactionCreated = () => {
    setIsCreateModalOpen(false);
    toast({ title: "Nova Transação Adicionada!", description: "Sua lista de transações será atualizada."});
    // Em um app real, aqui você chamaria `fetchPageData()` para recarregar os dados.
  };
  
  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 120,
      },
    }),
    exit: { opacity: 0, x: 20 }
  };

  return (
    <TooltipProvider>
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <div className="w-full">
        <PageHeader
          title="Transações"
          icon={<List className="h-6 w-6 text-primary"/>}
          description="Gerencie e revise todas as suas transações financeiras."
          actions={
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
               <Button variant="outline" className="w-full sm:w-auto" onClick={() => toast({ title: "Filtros", description: "Funcionalidade de filtros em desenvolvimento." })}>
                <ListFilter className="mr-2 h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportClick}>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto"> 
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Transação
                  </Button>
              </DialogTrigger>
            </div>
          }
        />
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl">Todas as Transações</CardTitle>
            <CardDescription>Uma lista detalhada de suas receitas e despesas (dados de exemplo).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] sm:w-[120px]">
                      <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Data <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                    </TableHead>
                    <TableHead className="min-w-[150px] sm:min-w-[200px]">Descrição</TableHead>
                    <TableHead className="w-[120px] sm:w-[150px]">
                      <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Categoria <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                    </TableHead>
                    <TableHead className="text-right w-[100px] sm:w-[120px]">
                      <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Valor <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                    </TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      custom={index}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="text-muted-foreground text-xs md:text-sm">
                        {new Date(transaction.date + 'T00:00:00Z').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            {transaction.is_recurring && (
                                <Tooltip>
                                    <TooltipTrigger><Repeat className="h-3 w-3 text-muted-foreground"/></TooltipTrigger>
                                    <TooltipContent><p>Transação Recorrente</p></TooltipContent>
                                </Tooltip>
                            )}
                            <span>{transaction.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                            variant="outline" 
                            className={cn("font-normal whitespace-nowrap", getCategoryColorClass(transaction.category?.type))}
                        >
                          {transaction.category?.name || "Sem categoria"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <PrivateValue
                          value={transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          className={cn("font-semibold whitespace-nowrap", transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(transaction.id, transaction.description || "Transação")}>
                              <Edit3 className="mr-2 h-4 w-4"/>Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDeleteClick(transaction.id, transaction.description || "Transação")}
                            >
                              <Trash2 className="mr-2 h-4 w-4"/>Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                         <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-10 w-10 text-muted-foreground/50" />
                          <span>Nenhuma transação encontrada.</span>
                          <DialogTrigger asChild>
                              <Button size="sm" className="mt-2">Adicionar Primeira Transação</Button>
                          </DialogTrigger>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => setDeleteDialog(prev => ({...prev, isOpen}))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja deletar a transação "{deleteDialog.item?.description}"? Esta ação não pode ser desfeita.
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
              <PlusCircle className="mr-2 h-5 w-5 text-primary"/>
              Nova Transação
          </DialogTitle>
          <DialogDescription>
            Registre uma nova receita ou despesa.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm onTransactionCreated={handleTransactionCreated} isModal={true} />
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}
