import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Target, Edit3, Trash2, Sprout } from "lucide-react";
import Link from "next/link";

// Sample budgets data
const budgets = [
  { id: "budget_1", category: "Groceries", limit: 400, spent: 250.75, remaining: 149.25 },
  { id: "budget_2", category: "Dining Out", limit: 200, spent: 180.50, remaining: 19.50 },
  { id: "budget_3", category: "Entertainment", limit: 150, spent: 75.00, remaining: 75.00 },
  { id: "budget_4", category: "Shopping", limit: 300, spent: 320.00, remaining: -20.00 }, // Overspent
];

export default function BudgetsPage() {
  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set and track your spending limits for different categories."
        actions={
          <Button asChild>
            <Link href="/budgets/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Budget
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const progressValue = Math.min((budget.spent / budget.limit) * 100, 100);
          const isOverspent = budget.spent > budget.limit;
          return (
            <Card key={budget.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline flex items-center">
                      <Target className="mr-2 h-5 w-5 text-primary" />
                      {budget.category}
                    </CardTitle>
                    <CardDescription>
                      Limit: <PrivateValue value={`$${budget.limit.toFixed(2)}`} />
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                     <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progressValue} className={cn("h-3", isOverspent && "bg-red-500")} />
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent:</span>
                  <PrivateValue value={`$${budget.spent.toFixed(2)}`} className={cn(isOverspent && "text-red-600 font-semibold")} />
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className={cn(isOverspent ? "text-red-600" : "text-emerald-600")}>
                    {isOverspent ? "Overspent:" : "Remaining:"}
                  </span>
                  <PrivateValue
                    value={`$${Math.abs(budget.remaining).toFixed(2)}`}
                    className={cn(isOverspent ? "text-red-600" : "text-emerald-600")}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
         <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-primary cursor-pointer">
            <Link href="/budgets/new" className="text-center p-6">
                <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                <p className="font-semibold">Create New Budget</p>
            </Link>
        </Card>
      </div>

      <Card className="mt-8 shadow-sm bg-primary/10 border-primary/30">
        <CardHeader>
            <CardTitle className="font-headline text-primary flex items-center">
                <Sprout className="mr-2 h-6 w-6"/>
                Budgeting Tips
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>Regularly review your budgets to ensure they align with your financial goals.</p>
            <p>Consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.</p>
            <p>Use the "rollover" feature (coming soon!) for categories where spending varies month to month.</p>
        </CardContent>
      </Card>
    </div>
  );
}
