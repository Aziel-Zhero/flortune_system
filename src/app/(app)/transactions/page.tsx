
// src/app/(app)/transactions/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, ArrowUpDown, MoreHorizontal, FileDown, Edit3, Trash2, ListFilter, AlertTriangle, List } from "lucide-react";
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
import { useSession } from "next-auth/react";
import { getTransactions, deleteTransaction } from "@/services/transaction.service";
import type { Transaction } from "@/types/database.types";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionForm } from "./transaction-form"; 

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
  const { data: session, status } = useSession(); 
  const authLoading = status === "loading";
  const user = session?.user; 

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; item: { id: string; description: string } | null }>({ isOpen: false, item: null });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchPageData = useCallback(async () => {
    if (!user?.id) return; 
    setIsLoading(true);
    try {
      const transactionsRes = await getTransactions(user.id);

      if (transactionsRes.error) {
        toast({ title: "Erro ao buscar transações", description: transactionsRes.error.message, variant: "destructive" });
        setTransactions([]);
      } else {
        setTransactions(transactionsRes.data || []);
      }
    } catch (error) {
      toast({ title: "Erro inesperado", description: "Não foi possível carregar os dados da página.", variant: "destructive" });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]); // Adicionado user?.id

  useEffect(() => {
    document.title = `Transações - ${APP_NAME}`;
    if (user?.id && !authLoading) { 
      fetchPageData();
    } else if (!authLoading && !user?.id) {
      setIsLoading(false);
      setTransactions([]);
    }
  }, [user?.id, authLoading, fetchPageData]); // Adicionado user?.id

  const handleDeleteClick = (transactionId: string, transactionDescription: string) => {
    setDeleteDialog({ isOpen: true, item: { id: transactionId, description: transactionDescription } });
  };

  const handleConfirmDelete = async () => {
    if (deleteDialog.item && user?.id) { 
      const originalTransactions = [...transactions];
      setTransactions(prev => prev.filter(t => t.id !== deleteDialog.item!.id!)); 

      const { error } = await deleteTransaction(deleteDialog.item.id, user.id);
      if (error) {
        toast({
          title: "Erro ao Deletar",
          description: error.message || `Não foi possível deletar a transação "${deleteDialog.item.description}".`,
          variant: "destructive",
        });
        setTransactions(originalTransactions); 
      } else {
        toast({
          title: "Transação Deletada",
          description: `A transação "${deleteDialog.item.description}" foi deletada com sucesso.`,
        });
      }
    }
    setDeleteDialog({ isOpen: false, item: null });
  };

  const handleEditClick = (transactionId: string, transactionDescription: string) => {
    console.log(`Editando transação: ${transactionDescription} (ID: ${transactionId})`);
    toast({
      title: "Ação de Edição",
      description: `Funcionalidade de edição de transações em desenvolvimento.`,
    });
  };
  
  const handleExportClick = () => {
    console.log("Exportar transações clicado.");
    toast({
      title: "Exportar Dados",
      description: "Funcionalidade de exportação de transações (placeholder)."
    });
  };

  const handleTransactionCreated = () => {
    setIsCreateModalOpen(false);
    fetchPageData(); 
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

  if (authLoading || (isLoading && !!user)) {
    return (
      <div className="w-full">
        <PageHeader
          title="Transações"
          icon={<List className="h-6 w-6 text-primary"/>}
          description="Gerencie e revise todas as suas transações financeiras."
          actions={
            <div className="flex flex-col sm:flex-row gap-2">
              <Skeleton className="h-10 w-full sm:w-28 rounded-md" />
              <Skeleton className="h-10 w-full sm:w-44 rounded-md" />
            </div>
          }
        />
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1"/>
            <Skeleton className="h-4 w-3/4"/>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] sm:w-[120px]"><Skeleton className="h-5 w-16"/></TableHead>
                    <TableHead className="min-w-[150px] sm:min-w-[200px]"><Skeleton className="h-5 w-32"/></TableHead>
                    <TableHead className="w-[120px] sm:w-[150px]"><Skeleton className="h-5 w-20"/></TableHead>
                    <TableHead className="text-right w-[100px] sm:w-[120px]"><Skeleton className="h-5 w-16 ml-auto"/></TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(5).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-full"/></TableCell>
                      <TableCell><Skeleton className="h-4 w-full"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto"/></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-sm"/></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
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
            <CardDescription>Uma lista detalhada de suas receitas e despesas.</CardDescription>
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
                      <TableCell className="font-medium">{transaction.description}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleEditClick(transaction.id, transaction.description)}>
                              <Edit3 className="mr-2 h-4 w-4"/>Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => handleDeleteClick(transaction.id, transaction.description)}
                            >
                              <Trash2 className="mr-2 h-4 w-4"/>Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {transactions.length === 0 && !isLoading && (
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
        {isCreateModalOpen && <TransactionForm onTransactionCreated={handleTransactionCreated} isModal={true} />}
      </DialogContent>
    </Dialog>
  );
}

    