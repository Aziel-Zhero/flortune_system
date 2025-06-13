
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Trophy, Edit3, Trash2, CalendarClock, DollarSign } from "lucide-react";
import { Link } from "next-intl"; // Use next-intl Link
import Image from "next/image";
import { cn } from "@/lib/utils";
// TODO: Import getTranslations for server-side translation
// import {getTranslations} from 'next-intl/server';


// Sample goals data
const goals = [
  { id: "goal_1", name: "Emergency Fund", targetAmount: 5000, currentAmount: 3500, deadline: "2024-12-31", icon: "ShieldCheck" },
  { id: "goal_2", name: "Vacation to Bali", targetAmount: 3000, currentAmount: 1200, deadline: "2025-06-30", icon: "Plane" },
  { id: "goal_3", name: "New Laptop", targetAmount: 1500, currentAmount: 1500, deadline: "2024-09-30", icon: "Laptop" }, // Achieved
];

export default async function GoalsPage({params: {locale}}: {params: {locale: string}}) {
  // const t = await getTranslations({locale, namespace: 'GoalsPage'}); // Example

  return (
    <div>
      <PageHeader
        title="Financial Goals" // Placeholder: t('title')
        description="Set, track, and achieve your financial aspirations." // Placeholder: t('description')
        actions={
          <Button asChild>
            <Link href="/goals/new"> {/* Ensure this link becomes locale-aware if "new" is a page */}
              <PlusCircle className="mr-2 h-4 w-4" />
              Set New Goal {/* Placeholder: t('setNewGoal') */}
            </Link>
          </Button>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const progressValue = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isAchieved = goal.currentAmount >= goal.targetAmount;
          return (
            <Card key={goal.id} className={cn("shadow-sm hover:shadow-md transition-shadow", isAchieved && "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500")}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Image 
                          src={`https://placehold.co/64x64/${isAchieved ? '90EE90' : 'A0AEC0'}/${isAchieved ? '2F855A' : '4A5568'}.png`}
                          width={48} 
                          height={48} 
                          alt={goal.name} 
                          className="rounded-lg"
                          data-ai-hint="achievement goal"
                        />
                        <div>
                            <CardTitle className={cn("font-headline", isAchieved && "text-emerald-700 dark:text-emerald-300")}>
                            {isAchieved && <Trophy className="inline mr-2 h-5 w-5 text-yellow-500" />}
                            {goal.name} {/* Placeholder */}
                            </CardTitle>
                            <CardDescription className="flex items-center text-xs">
                                <CalendarClock className="mr-1 h-3 w-3"/> Target: {goal.deadline} {/* Placeholder */}
                            </CardDescription>
                        </div>
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
                <Progress value={progressValue} className={cn("h-3", isAchieved ? "bg-emerald-500" : "bg-primary")} />
                <div className="mt-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">Saved:</span> {/* Placeholder */}
                  <PrivateValue value={`$${goal.currentAmount.toFixed(2)}`} className={cn(isAchieved && "text-emerald-600 font-semibold")} />
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Target:</span> {/* Placeholder */}
                  <PrivateValue value={`$${goal.targetAmount.toFixed(2)}`} />
                </div>
                {isAchieved && <p className="text-center mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Goal Achieved! 🎉</p>} {/* Placeholder */}
              </CardContent>
            </Card>
          );
        })}
         <Card className="shadow-sm border-dashed border-2 hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-primary cursor-pointer">
            <Link href="/goals/new" className="text-center p-6"> {/* Ensure this link is locale-aware */}
                <PlusCircle className="h-10 w-10 mx-auto mb-2"/>
                <p className="font-semibold">Set New Financial Goal</p> {/* Placeholder */}
            </Link>
        </Card>
      </div>
    </div>
  );
}
