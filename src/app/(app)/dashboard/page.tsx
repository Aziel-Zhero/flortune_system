import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PrivateValue } from "@/components/shared/private-value";
import { ArrowUpRight, DollarSign, Users, CreditCard, Activity, TrendingUp, Sprout } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Sample data - replace with actual data fetching
const summaryData = [
  { title: "Total Balance", value: 12345.67, icon: DollarSign, trend: "+2.5%", trendColor: "text-emerald-500" },
  { title: "Income This Month", value: 5678.90, icon: TrendingUp, trend: "+10.1%", trendColor: "text-emerald-500" },
  { title: "Expenses This Month", value: 2345.12, icon: CreditCard, trend: "-5.2%", trendColor: "text-red-500" },
  { title: "Savings Goal Progress", value: 65, unit: "%", icon: Sprout, trend: "+5%", trendColor: "text-emerald-500" },
];

const recentTransactions = [
  { id: "1", description: "Grocery Store", amount: -55.20, date: "2024-07-27", category: "Groceries" },
  { id: "2", description: "Salary Deposit", amount: 2500.00, date: "2024-07-26", category: "Income" },
  { id: "3", description: "Restaurant Dinner", amount: -78.50, date: "2024-07-25", category: "Dining Out" },
  { id: "4", description: "Online Subscription", amount: -12.99, date: "2024-07-25", category: "Subscriptions" },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Welcome back, Flora!"
        description="Here's your financial overview for this month."
        actions={
          <Button asChild>
            <Link href="/transactions/new">Add Transaction</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
          <Card key={item.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">
                {item.unit === "%" ? (
                   <PrivateValue value={item.value} /> + item.unit
                ) : (
                  "$" + <PrivateValue value={item.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                )}
              </div>
              <p className={cn("text-xs text-muted-foreground mt-1", item.trendColor)}>
                {item.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date} - {tx.category}</p>
                  </div>
                  <PrivateValue 
                    value={tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} 
                    className={cn("font-medium", tx.amount > 0 ? "text-emerald-600" : "text-red-600")}
                  />
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/transactions">View All Transactions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Spending Overview</CardTitle>
            <CardDescription>A quick look at your spending categories.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {/* Placeholder for a chart */}
            <div className="w-full h-64 bg-muted/50 rounded-md flex items-center justify-center">
               <Image src="https://placehold.co/300x200.png?text=Spending+Chart" alt="Spending Chart Placeholder" width={300} height={200} data-ai-hint="data chart"/>
            </div>
             {/* <p className="text-sm text-muted-foreground">Spending chart coming soon!</p> */}
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-sm bg-primary/10 border-primary/30">
        <CardHeader>
            <CardTitle className="font-headline text-primary flex items-center">
                <Sprout className="mr-2 h-6 w-6"/>
                Smart Suggestions
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-sm text-foreground/80">You've spent <PrivateValue value="$120" className="font-semibold"/> on coffee this month. Consider brewing at home to save!</p>
            <p className="text-sm text-foreground/80">Your subscription spending is up by 15%. <Link href="/budgets" className="text-primary hover:underline">Review your subscriptions?</Link></p>
             <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                View All Insights
              </Button>
        </CardContent>
      </Card>

    </div>
  );
}
