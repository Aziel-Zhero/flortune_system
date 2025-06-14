// src/app/(app)/transactions/page.tsx
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, ArrowUpDown, MoreHorizontal, FileDown } from "lucide-react";
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
import type { Metadata } from 'next';
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

// Metadata estática não funciona bem em Client Components.
// export const metadata: Metadata = {
//   title: `Transações - ${APP_NAME}`,
// };

// Sample transactions data
const transactionsData = [ // Renomeado para evitar conflito de nome
  { id: "txn_1", date: "28/07/2024", description: "Café Starbucks", category: "Alimentação", amount: -5.75, type: "Despesa" },
  { id: "txn_2", date: "28/07/2024", description: "Pagamento Projeto Freelance", category: "Receita", amount: 750.00, type: "Receita" },
  { id: "txn_3", date: "27/07/2024", description: "Assinatura Netflix", category: "Entretenimento", amount: -15.99, type: "Despesa" },
  { id: "txn_4", date: "26/07/2024", description: "Compras Supermercado", category: "Alimentação", amount: -85.20, type: "Despesa" },
  { id: "txn_5", date: "25/07/2024", description: "Dividendo Ações", category: "Investimento", amount: 120.50, type: "Receita" },
];

const categoryColors: { [key: string]: string } = {
  "Alimentação": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-800/30 dark:text-amber-300 dark:border-amber-700",
  "Receita": "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-800/30 dark:text-emerald-300 dark:border-emerald-700",
  "Entretenimento": "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-800/30 dark:text-purple-300 dark:border-purple-700",
  "Investimento": "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-800/30 dark:text-teal-300 dark:border-teal-700",
  "Outro": "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600",
};

export default function TransactionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; description: string } | null>(null);

  const handleDeleteClick = (transactionId: string, transactionDescription: string) => {
    setItemToDelete({ id: transactionId, description: transactionDescription });
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      console.log(`Deletando transação: ${itemToDelete.description} (ID: ${itemToDelete.id})`);
      transactionsData.splice(transactionsData.findIndex(t => t.id === itemToDelete.id), 1); // Simula deleção
      toast({
        title: "Transação Deletada",
        description: `A transação "${itemToDelete.description}" foi deletada com sucesso.`,
      });
      setItemToDelete(null);
    }
    setDialogOpen(false);
  };

  const handleEditClick = (transactionId: string, transactionDescription: string) => {
    console.log(`Editando transação: ${transactionDescription} (ID: ${transactionId})`);
    toast({
      title: "Ação de Edição",
      description: `Redirecionando para editar a transação "${transactionDescription}" (placeholder).`,
    });
    // Em um app real: router.push(`/transactions/edit/${transactionId}`);
  };

  const handleViewDetailsClick = (transactionId: string, transactionDescription: string) => {
    console.log(`Visualizando detalhes da transação: ${transactionDescription} (ID: ${transactionId})`);
    toast({
      title: "Visualizar Detalhes",
      description: `Mostrando detalhes da transação "${transactionDescription}" (placeholder).`,
    });
  };

  const handleExportClick = () => {
    console.log("Exportar transações clicado.");
    toast({
      title: "Exportar Dados",
      description: "Funcionalidade de exportação de transações (placeholder)."
    });
  };
  
  // Definir título da página dinamicamente em client components
  if (typeof document !== 'undefined') {
    document.title = `Transações - ${APP_NAME}`;
  }

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Gerencie e revise todas as suas transações financeiras."
        actions={
          <div className="flex gap-2">
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
              {transactionsData.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground text-xs md:text-sm">{transaction.date}</TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge 
                        variant="outline" 
                        className={cn("font-normal", categoryColors[transaction.category] || categoryColors["Outro"])}
                    >
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PrivateValue
                      value={transaction.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      className={cn("font-semibold", transaction.type === "Receita" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
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
                        <DropdownMenuItem onClick={() => handleEditClick(transaction.id, transaction.description)}>Editar Transação</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewDetailsClick(transaction.id, transaction.description)}>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeleteClick(transaction.id, transaction.description)}
                        >
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
