
// src/app/(app)/goals/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { FinancialGoalForm } from "../goal-form";
import { useRouter } from "next/navigation";

export default function NewGoalPageWrapper() {
  const router = useRouter();
  useEffect(() => {
    document.title = `Nova Meta Financeira - ${APP_NAME}`;
  }, []);

  const handleGoalCreated = () => {
    router.push("/goals"); // Redireciona para a lista de metas após criar
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nova Meta Financeira"
        description="Defina um novo objetivo para suas finanças e acompanhe seu progresso."
        icon={<Trophy className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalhes da Meta</CardTitle>
          <CardDescription>
            Descreva sua meta, o valor que deseja alcançar e, opcionalmente, um prazo e ícone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinancialGoalForm onGoalCreated={handleGoalCreated} isModal={false} />
        </CardContent>
      </Card>
    </div>
  );
}

    