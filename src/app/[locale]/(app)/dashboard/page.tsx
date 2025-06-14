
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { PrivateValue } from "@/components/shared/private-value";
import { DollarSign, CreditCard, TrendingUp, Sprout } from "lucide-react";
import { Link } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Navigation'});
  return {
    title: `${t('dashboard')} - ${APP_NAME}`,
  };
}

// Sample data - replace with actual data fetching and i18n
const summaryData = [
  { titleKey: "totalBalance", value: 12345.67, icon: DollarSign, trend: "+2.5%", trendColor: "text-emerald-500" },
  { titleKey: "incomeThisMonth", value: 5678.90, icon: TrendingUp, trend: "+10.1%", trendColor: "text-emerald-500" },
  { titleKey: "expensesThisMonth", value: 2345.12, icon: CreditCard, trend: "-5.2%", trendColor: "text-red-500" },
  { titleKey: "savingsGoalProgress", value: 65, unit: "%", icon: Sprout, trend: "+5%", trendColor: "text-emerald-500" },
];

const recentTransactions = [
  { id: "1", descriptionKey: "groceryStore", amount: -55.20, date: "2024-07-27", categoryKey: "groceries" },
  { id: "2", descriptionKey: "salaryDeposit", amount: 2500.00, date: "2024-07-26", categoryKey: "income" },
  { id: "3", descriptionKey: "restaurantDinner", amount: -78.50, date: "2024-07-25", categoryKey: "diningOut" },
  { id: "4", descriptionKey: "onlineSubscription", amount: -12.99, date: "2024-07-25", categoryKey: "subscriptions" },
];

// TODO: Create a namespace for DashboardPage translations
// For now, using placeholders or generic keys.
// Example: tDashboard('totalBalance'), tTransactions('groceryStore')

export default async function DashboardPage({params: {locale}}: {params: {locale: string}}) {
  const tNav = await getTranslations({locale, namespace: 'Navigation'}); // For page title
  // const tDashboard = await getTranslations({locale, namespace: 'DashboardPage'});
  // const tMisc = await getTranslations({locale, namespace: 'Misc'}); // For generic terms like "Add Transaction"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Welcome back, Flora!" // Placeholder: tDashboard('welcomeMessage', {name: 'Flora'})
        description="Here's your financial overview for this month." // Placeholder: tDashboard('overviewDescription')
        actions={
          <Button asChild>
            <Link href="/transactions/new">Add Transaction</Link> {/* Placeholder: tMisc('addTransaction') */}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
          <Card key={item.titleKey} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.titleKey} {/* Placeholder: tDashboard(item.titleKey) */}
              </CardTitle>
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">
                {item.unit === "%" ? (
                   <PrivateValue value={item.value} /> && <>{item.value}{item.unit}</>
                ) : (
                  "$" + <PrivateValue value={item.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
                )}
              </div>
              <p className={cn("text-xs text-muted-foreground mt-1", item.trendColor)}>
                {item.trend} from last month {/* Placeholder: tDashboard('trendFromLastMonth', {trend: item.trend}) */}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Recent Transactions</CardTitle> {/* Placeholder */}
            <CardDescription>Your latest financial activities.</CardDescription> {/* Placeholder */}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
                  <div>
                    <p className="font-medium">{tx.descriptionKey}</p> {/* Placeholder: tTransactions(tx.descriptionKey) */}
                    <p className="text-xs text-muted-foreground">{tx.date} - {tx.categoryKey}</p> {/* Placeholder: tCategories(tx.categoryKey) */}
                  </div>
                  <PrivateValue 
                    value={tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} 
                    className={cn("font-medium", tx.amount > 0 ? "text-emerald-600" : "text-red-600")}
                  />
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link href="/transactions">View All Transactions</Link> {/* Placeholder */}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Spending Overview</CardTitle> {/* Placeholder */}
            <CardDescription>A quick look at your spending categories.</CardDescription> {/* Placeholder */}
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
             <Image src="https://placehold.co/300x200.png" alt="Spending Chart Placeholder" width={300} height={200} data-ai-hint="data chart"/>
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-sm bg-primary/10 border-primary/30">
        <CardHeader>
            <CardTitle className="font-headline text-primary flex items-center">
                <Sprout className="mr-2 h-6 w-6"/>
                Smart Suggestions {/* Placeholder */}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <p className="text-sm text-foreground/80">You've spent <PrivateValue value="$120" className="font-semibold"/> on coffee this month. Consider brewing at home to save!</p> {/* Placeholder */}
            <p className="text-sm text-foreground/80">Your subscription spending is up by 15%. <Link href="/budgets" className="text-primary hover:underline">Review your subscriptions?</Link></p> {/* Placeholder */}
             <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
                View All Insights {/* Placeholder */}
              </Button>
        </CardContent>
      </Card>
    </div>
  );
}
