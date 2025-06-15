
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
import { PlusCircle, ArrowUpDown, MoreHorizontal, FileDown, Edit3, Trash2, ListFilter } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from "@/contexts/auth-context";
import { getTransactions, deleteTransaction } from "@/services/transaction.service";
import type { Transaction, Category } from "@/types/database.types";
import { getCategories } from "@/services/category.service";
import { Skeleton } from "@/components/ui/skeleton"; // Para loading state

// Mapeamento de cores para categorias (pode ser expandido ou movido para um utilitário)
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
  const { user, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; description: string } | null>(null);

  const fetchPageData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [transactionsRes, categoriesRes] = await Promise.all([
        getTransactions(user.id),
        getCategories(user.id) // Busca categorias padrão e do usuário
      ]);

      if (transactionsRes.error) {
        toast({ title: "Erro ao buscar transações", description: transactionsRes.error.message, variant: "destructive" });
      } else {
        setTransactions(transactionsRes.data || []);
      }

      if (categoriesRes.error) {
        toast({ title: "Erro ao buscar categorias", description: categoriesRes.error.message, variant: "destructive" });
      } else {
        setCategories(categoriesRes.data || []);
      }
    } catch (error) {
      toast({ title: "Erro inesperado", description: "Não foi possível carregar os dados da página.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.title = `Transações - ${APP_NAME}`;
    if (user) {
      fetchPageData();
    } else if (!authLoading) {
      // Usuário não logado e autenticação não está carregando mais (ex: deslogado)
      setIsLoading(false);
      setTransactions([]); // Limpa transações se o usuário deslogar
    }
  }, [user, authLoading, fetchPageData]);

  const handleDeleteClick = (transactionId: number, transactionDescription: string) => {
    setItemToDelete({ id: transactionId, description: transactionDescription });
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete && user) {
      const originalTransactions = [...transactions];
      setTransactions(prev => prev.filter(t => t.id !== itemToDelete.id!)); // Otimista

      const { error } = await deleteTransaction(itemToDelete.id, user.id);
      if (error) {
        toast({
          title: "Erro ao Deletar",
          description: error.message || `Não foi possível deletar a transação "${itemToDelete.description}".`,
          variant: "destructive",
        });
        setTransactions(originalTransactions); // Reverte
      } else {
        toast({
          title: "Transação Deletada",
          description: `A transação "${itemToDelete.description}" foi deletada com sucesso.`,
        });
      }
      setItemToDelete(null);
    }
    setDialogOpen(false);
  };

  const handleEditClick = (transactionId: number, transactionDescription: string) => {
    console.log(`Editando transação: ${transactionDescription} (ID: ${transactionId})`);
    toast({
      title: "Ação de Edição",
      description: `Redirecionando para editar a transação "${transactionDescription}" (placeholder).`,
    });
    // Em um app real: router.push(`/transactions/edit/${transactionId}`);
  };
  
  const handleExportClick = () => {
    console.log("Exportar transações clicado.");
    toast({
      title: "Exportar Dados",
      description: "Funcionalidade de exportação de transações (placeholder)."
    });
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

  if (authLoading || (isLoading && user)) {
    return (
      <div>
        <PageHeader
          title="Transações"
          description="Gerencie e revise todas as suas transações financeiras."
          actions={
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-md" />
              <Skeleton className="h-10 w-44 rounded-md" />
            </div>
          }
        />
        <Card className="shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1"/>
            <Skeleton className="h-4 w-3/4"/>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-20"/></TableHead>
                  <TableHead><Skeleton className="h-5 w-40"/></TableHead>
                  <TableHead><Skeleton className="h-5 w-24"/></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto"/></TableHead>
                  <TableHead><span className="sr-only">Ações</span></TableHead>
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
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader
        title="Transações"
        description="Gerencie e revise todas as suas transações financeiras."
        actions={
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => toast({ title: "Filtros", description: "Funcionalidade de filtros em desenvolvimento." })}>
              <ListFilter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline" onClick={handleExportClick}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button asChild>
              <Link href="/transactions/new"> 
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Transação
              </Link>
            </Button>
          </div>
        }
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Todas as Transações</CardTitle>
          <CardDescription>Uma lista detalhada de suas receitas e despesas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Data <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>
                   <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Categoria <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Valor <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
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
                    {new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge 
                        variant="outline" 
                        className={cn("font-normal", getCategoryColorClass(transaction.category?.type))}
                    >
                      {transaction.category?.name || "Sem categoria"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PrivateValue
                      value={transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      className={cn("font-semibold", transaction.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
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
                        {/* <DropdownMenuItem onClick={() => handleViewDetailsClick(transaction.id, transaction.description)}>Ver Detalhes</DropdownMenuItem> */}
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
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja deletar a transação "{itemToDelete?.description}"? Esta ação não pode ser desfeita.
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
