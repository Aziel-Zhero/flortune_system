
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, ArrowUpDown, MoreHorizontal, FileDown } from "lucide-react";
import { Link } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Navigation'});
  return {
    title: `${t('transactions')} - ${APP_NAME}`,
  };
}

// Sample transactions data - replace with actual data fetching and i18n keys
const transactions = [
  { id: "txn_1", date: "2024-07-28", description: "Starbucks Coffee", category: "Food & Drink", amount: -5.75, type: "Expense" },
  { id: "txn_2", date: "2024-07-28", description: "Freelance Project Payment", category: "Income", amount: 750.00, type: "Income" },
  { id: "txn_3", date: "2024-07-27", description: "Netflix Subscription", category: "Entertainment", amount: -15.99, type: "Expense" },
  { id: "txn_4", date: "2024-07-26", description: "Groceries from Trader Joe's", category: "Groceries", amount: -85.20, type: "Expense" },
  { id: "txn_5", date: "2024-07-25", description: "Stock Dividend", category: "Investment", amount: 120.50, type: "Income" },
];

// Define category colors for styling badges
const categoryColors: { [key: string]: string } = {
  "Food & Drink": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-800/30 dark:text-amber-300 dark:border-amber-700",
  "Income": "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-800/30 dark:text-emerald-300 dark:border-emerald-700",
  "Entertainment": "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-800/30 dark:text-purple-300 dark:border-purple-700",
  "Groceries": "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-800/30 dark:text-sky-300 dark:border-sky-700",
  "Investment": "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-800/30 dark:text-teal-300 dark:border-teal-700",
  "Other": "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-600",
};
// TODO: Add translations for categories and other text

export default async function TransactionsPage({params: {locale}}: {params: {locale: string}}) {
  // const tPage = await getTranslations({locale, namespace: 'TransactionsPage'});
  // const tMisc = await getTranslations({locale, namespace: 'Misc'});
  // const tCategories = await getTranslations({locale, namespace: 'Categories'});
  // const tActions = await getTranslations({locale, namespace: 'Actions'});

  return (
    <div>
      <PageHeader
        title={"Transactions"} // Placeholder: tPage('title')
        description={"Manage and review all your financial transactions."} // Placeholder: tPage('description')
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Export {/* Placeholder: tMisc('export') */}
            </Button>
            <Button asChild>
              <Link href="/transactions/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction {/* Placeholder: tMisc('addTransaction') */}
              </Link>
            </Button>
          </div>
        }
      />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">All Transactions</CardTitle> {/* Placeholder: tPage('allTransactionsTitle') */}
          <CardDescription>A detailed list of your income and expenses.</CardDescription> {/* Placeholder: tPage('allTransactionsDescription') */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Date <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                   <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Category <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="px-1 py-0.5 h-auto hover:bg-muted">Amount <ArrowUpDown className="ml-1 h-3 w-3" /></Button>
                </TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
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
                        className={cn("font-normal", categoryColors[transaction.category] || categoryColors["Other"])}
                    >
                      {transaction.category} {/* Placeholder: tCategories(transaction.categoryKey) */}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PrivateValue
                      value={transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} // Format currency as needed
                      className={cn("font-semibold", transaction.type === "Income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span> {/* Placeholder: tActions('openMenu') */}
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel> {/* Placeholder: tActions('title') */}
                        <DropdownMenuItem>Edit Transaction</DropdownMenuItem> {/* Placeholder: tActions('edit') */}
                        <DropdownMenuItem>View Details</DropdownMenuItem> {/* Placeholder: tActions('viewDetails') */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          Delete {/* Placeholder: tActions('delete') */}
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
