import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PrivateValue } from "@/components/shared/private-value";
import { PlusCircle, Target, Edit3, Trash2, Sprout } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Metadata } from 'next';
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Orçamentos - ${APP_NAME}`,
};

// Sample budgets data
const budgetsData = [
  { id: "budget_1", category: "Alimentação", limit: 400, spent: 250.75 },
  { id: "budget_2", category: "Restaurantes", limit: 200, spent: 180.50 },
  { id: "budget_3", category: "Entretenimento", limit: 150, spent: 75.00 },
  { id: "budget_4", category: "Compras", limit: 300, spent: 320.00 }, // Overspent
];

export default function BudgetsPage() {
  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Defina e acompanhe seus limites de gastos para diferentes categorias."
        actions={
          <Button asChild>
            <Link href="/budgets/new"> {/* Supondo que /budgets/new seja uma rota válida */}
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Orçamento
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
                      {budget.category}
                    </CardTitle>
                    <CardDescription>
                      Limite: <PrivateValue value={`R$${budget.limit.toFixed(2)}`} />
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
                  <span className="text-muted-foreground">Gasto:</span>
                  <PrivateValue value={`R$${budget.spent.toFixed(2)}`} className={cn(isOverspent && "text-destructive font-semibold")} />
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className={cn(isOverspent ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                    {isOverspent ? "Excedido:" : "Restante:"}
                  </span>
                  <PrivateValue
                    value={`R$${Math.abs(remaining).toFixed(2)}`}
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
                <p className="font-semibold">Criar Novo Orçamento</p>
            </Link>
        </Card>
      </div>

      <Card className="mt-8 shadow-sm bg-primary/10 border-primary/30">
        <CardHeader>
            <CardTitle className="font-headline text-primary flex items-center">
                <Sprout className="mr-2 h-6 w-6"/>
                Dicas de Orçamento
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-foreground/80">
            <p>Revise seus orçamentos regularmente para garantir que estejam alinhados com seus objetivos financeiros.</p>
            <p>Considere a regra 50/30/20: 50% para necessidades, 30% para desejos e 20% para poupança.</p>
            <p>Use o recurso de "rollover" (em breve!) para categorias onde os gastos variam de mês a mês.</p>
        </CardContent>
      </Card>
    </div>
  );
}
