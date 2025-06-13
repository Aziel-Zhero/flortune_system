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
} from "@/components/ui/dropdown-menu"

// Sample transactions data
const transactions = [
  { id: "txn_1", date: "2024-07-28", description: "Starbucks Coffee", category: "Food & Drink", amount: -5.75, type: "Expense" },
  { id: "txn_2", date: "2024-07-28", description: "Freelance Project Payment", category: "Income", amount: 750.00, type: "Income" },
  { id: "txn_3", date: "2024-07-27", description: "Netflix Subscription", category: "Entertainment", amount: -15.99, type: "Expense" },
  { id: "txn_4", date: "2024-07-26", description: "Groceries from Trader Joe's", category: "Groceries", amount: -85.20, type: "Expense" },
  { id: "txn_5", date: "2024-07-25", description: "Stock Dividend", category: "Investment", amount: 120.50, type: "Income" },
];

const categoryColors: { [key: string]: string } = {
  "Food & Drink": "bg-amber-500/20 text-amber-700 border-amber-500/50",
  "Income": "bg-emerald-500/20 text-emerald-700 border-emerald-500/50",
  "Entertainment": "bg-purple-500/20 text-purple-700 border-purple-500/50",
  "Groceries": "bg-sky-500/20 text-sky-700 border-sky-500/50",
  "Investment": "bg-teal-500/20 text-teal-700 border-teal-500/50",
  "Other": "bg-slate-500/20 text-slate-700 border-slate-500/50",
};


export default function TransactionsPage() {
  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Manage and review all your financial transactions."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button asChild>
              <Link href="/transactions/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
              </Link>
            </Button>
          </div>
        }
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">All Transactions</CardTitle>
          <CardDescription>A detailed list of your income and expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm">Date <ArrowUpDown className="ml-2 h-3 w-3" /></Button>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                   <Button variant="ghost" size="sm">Category <ArrowUpDown className="ml-2 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm">Amount <ArrowUpDown className="ml-2 h-3 w-3" /></Button>
                </TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-muted-foreground">{transaction.date}</TableCell>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(categoryColors[transaction.category] || categoryColors["Other"])}>
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PrivateValue
                      value={transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      className={transaction.type === "Income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit Transaction</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-800">Delete</DropdownMenuItem>
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
