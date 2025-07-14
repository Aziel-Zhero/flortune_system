// src/app/(app)/budgets/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { BudgetForm } from "../budget-form";
import { useRouter } from "next/navigation";

export default function NewBudgetPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = `Novo Orçamento - ${APP_NAME}`;
  }, []);

  const handleFormSuccess = () => {
    router.push("/budgets");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Novo Orçamento"
        description="Defina um novo limite de gastos para uma categoria específica em um período."
        icon={<Target className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalhes do Orçamento</CardTitle>
          <CardDescription>
            Escolha uma categoria de despesa, defina o valor limite e o período do orçamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetForm onFormSuccess={handleFormSuccess} isModal={false} />
        </CardContent>
      </Card>
    </div>
  );
}
