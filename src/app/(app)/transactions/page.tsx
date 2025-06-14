import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
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

export const metadata: Metadata = {
  title: `Transações - ${APP_NAME}`,
};

// Sample transactions data
const transactions = [
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
  return (
    <div>
      <PageHeader
        title="Transações"
        description="Gerencie e revise todas as suas transações financeiras."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
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
              {transactions.map((transaction) => (
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
                        <DropdownMenuItem>Editar Transação</DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
    </div>
  );
}
