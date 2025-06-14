
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Trophy, Edit3, Trash2, CalendarClock, ShieldCheck, Plane, Laptop } from "lucide-react"; // Added icons
import { Link } from "next-intl";
import Image from "next/image"; // Using next/image for placeholders
import { cn } from "@/lib/utils";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Navigation'});
  return {
    title: `${t('goals')} - ${APP_NAME}`,
  };
}

// Sample goals data - replace with actual data fetching and i18n keys
const goalsData = [
  { id: "goal_1", nameKey: "emergencyFund", targetAmount: 5000, currentAmount: 3500, deadline: "2024-12-31", icon: ShieldCheck, iconHint: "shield security" },
  { id: "goal_2", nameKey: "vacationToBali", targetAmount: 3000, currentAmount: 1200, deadline: "2025-06-30", icon: Plane, iconHint: "travel plane" },
  { id: "goal_3", nameKey: "newLaptop", targetAmount: 1500, currentAmount: 1500, deadline: "2024-09-30", icon: Laptop, iconHint: "tech computer" }, // Achieved
];

// TODO: Add translations for this page
// Example namespaces: GoalsPage, GoalNames, Misc, Actions

export default async function GoalsPage({params: {locale}}: {params: {locale: string}}) {
  // const tPage = await getTranslations({locale, namespace: 'GoalsPage'});
  // const tGoalNames = await getTranslations({locale, namespace: 'GoalNames'});
  // const tMisc = await getTranslations({locale, namespace: 'Misc'});

  return (
    <div>
      <PageHeader
        title={"Financial Goals"} // Placeholder: tPage('title')
        description={"Set, track, and achieve your financial aspirations."} // Placeholder: tPage('description')
        actions={
          <Button asChild>
            <Link href="/goals/new"> {/* Assuming /goals/new is a valid route */}
              <PlusCircle className="mr-2 h-4 w-4" />
              Set New Goal {/* Placeholder: tMisc('setNewGoal') */}
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goalsData.map((goal) => {
          const progressValue = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
          const isAchieved = goal.currentAmount >= goal.targetAmount;
          const GoalIcon = goal.icon;

          return (
            <Card key={goal.id} className={cn("shadow-sm hover:shadow-md transition-shadow", isAchieved && "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500")}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-lg",
                            isAchieved ? "bg-emerald-100 dark:bg-emerald-800" : "bg-muted"
                        )}>
                            <GoalIcon className={cn("h-6 w-6", isAchieved ? "text-emerald-600 dark:text-emerald-400" : "text-primary")} />
                        </div>
                        <div>
                            <CardTitle className={cn("font-headline", isAchieved && "text-emerald-700 dark:text-emerald-300")}>
                            {isAchieved && <Trophy className="inline mr-1.5 h-5 w-5 text-yellow-500" />}
                            {goal.nameKey} {/* Placeholder: tGoalNames(goal.nameKey) */}
                            </CardTitle>
                            <CardDescription className="flex items-center text-xs text-muted-foreground">
                                <CalendarClock className="mr-1 h-3 w-3"/> Target: {goal.deadline} {/* Placeholder */}
                            </CardDescription>
                        </div>
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
                    className={cn("h-3 mb-3", isAchieved ? "bg-emerald-200 dark:bg-emerald-700" : "bg-primary/20 dark:bg-primary/30")}
                    indicatorClassName={cn(isAchieved ? "bg-emerald-500 dark:bg-emerald-400" : "bg-primary")}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saved:</span> {/* Placeholder */}
                  <PrivateValue value={`$${goal.currentAmount.toFixed(2)}`} className={cn(isAchieved && "text-emerald-600 dark:text-emerald-400 font-semibold")} />
                </div>
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                  <span>Target:</span> {/* Placeholder */}
                  <PrivateValue value={`$${goal.targetAmount.toFixed(2)}`} />
                </div>
                {isAchieved && (
                    <p className="text-center mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 p-2 bg-emerald-100 dark:bg-emerald-800/50 rounded-md">
                        Goal Achieved! 🎉 {/* Placeholder */}
                    </p>
                )}
              </CardContent>
            </Card>
          );
        })}
         <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-primary cursor-pointer">
            <Link href="/goals/new" className="text-center p-6 block w-full h-full">
                <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                <p className="font-semibold">Set New Financial Goal</p> {/* Placeholder */}
            </Link>
        </Card>
      </div>
    </div>
  );
}
