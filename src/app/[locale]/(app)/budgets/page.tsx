
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Target, Edit3, Trash2, Sprout } from "lucide-react";
import { Link } from "next-intl";
import { cn } from "@/lib/utils";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Navigation'});
  return {
    title: `${t('budgets')} - ${APP_NAME}`,
  };
}

// Sample budgets data - replace with actual data fetching and i18n keys
const budgetsData = [
  { id: "budget_1", categoryKey: "groceries", limit: 400, spent: 250.75 },
  { id: "budget_2", categoryKey: "diningOut", limit: 200, spent: 180.50 },
  { id: "budget_3", categoryKey: "entertainment", limit: 150, spent: 75.00 },
  { id: "budget_4", categoryKey: "shopping", limit: 300, spent: 320.00 }, // Overspent
];

// TODO: Add translations for this page
// Example namespaces: BudgetsPage, Categories, Misc, Actions

export default async function BudgetsPage({params: {locale}}: {params: {locale: string}}) {
  // const tPage = await getTranslations({locale, namespace: 'BudgetsPage'});
  // const tCategories = await getTranslations({locale, namespace: 'Categories'});
  // const tMisc = await getTranslations({locale, namespace: 'Misc'});

  return (
    <div>
      <PageHeader
        title={"Budgets"} // Placeholder: tPage('title')
        description={"Set and track your spending limits for different categories."} // Placeholder: tPage('description')
        actions={
          <Button asChild>
            <Link href="/budgets/new"> {/* Assuming /budgets/new is a valid route */}
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Budget {/* Placeholder: tMisc('createBudget') */}
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgetsData.map((budget) => {
          const remaining = budget.limit - budget.spent;
          const progressValue = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0;
          const isOverspent = remaining < 0;
          
          return (
            <Card key={budget.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline flex items-center">
                      <Target className="mr-2 h-5 w-5 text-primary" />
                      {budget.categoryKey} {/* Placeholder: tCategories(budget.categoryKey) */}
                    </CardTitle>
                    <CardDescription>
                      Limit: <PrivateValue value={`$${budget.limit.toFixed(2)}`} /> {/* Placeholder: tMisc('limit') */}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress 
                    value={progressValue} 
                    className={cn("h-3", isOverspent && "bg-destructive")} 
                    indicatorClassName={cn(isOverspent && "bg-destructive-foreground")}
                />
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent:</span> {/* Placeholder: tMisc('spent') */}
                  <PrivateValue value={`$${budget.spent.toFixed(2)}`} className={cn(isOverspent && "text-destructive font-semibold")} />
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className={cn(isOverspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                    {isOverspent ? "Overspent:" : "Remaining:"} {/* Placeholder: tMisc('overspent') / tMisc('remaining') */}
                  </span>
                  <PrivateValue
                    value={`$${Math.abs(remaining).toFixed(2)}`}
                    className={cn(isOverspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
         <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-primary cursor-pointer">
            <Link href="/budgets/new" className="text-center p-6 block w-full h-full">
                <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                <p className="font-semibold">Create New Budget</p> {/* Placeholder: tMisc('createNewBudget') */}
            </Link>
        </Card>
      </div>

      <Card className="mt-8 shadow-sm bg-primary/10 border-primary/30">
        <CardHeader>
            <CardTitle className="font-headline text-primary flex items-center">
                <Sprout className="mr-2 h-6 w-6"/>
                Budgeting Tips {/* Placeholder: tPage('budgetingTipsTitle') */}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>Regularly review your budgets to ensure they align with your financial goals.</p> {/* Placeholder */}
            <p>Consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.</p> {/* Placeholder */}
            <p>Use the "rollover" feature (coming soon!) for categories where spending varies month to month.</p> {/* Placeholder */}
        </CardContent>
      </Card>
    </div>
  );
}
