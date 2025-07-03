// src/app/(app)/transactions/new/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect } from "react";
import { TransactionForm } from "../transaction-form";
import { useRouter } from "next/navigation";

export default function NewTransactionPage() {
  const router = useRouter();
  useEffect(() => {
    document.title = `Nova Transação - ${APP_NAME}`;
  }, []);

  const handleTransactionCreated = () => {
    router.push("/transactions");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nova Transação"
        description="Registre uma nova receita ou despesa."
        icon={<PlusCircle className="h-6 w-6 text-primary" />}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalhes da Transação</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para adicionar uma nova movimentação financeira.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm onTransactionCreated={handleTransactionCreated} isModal={false} />
        </CardContent>
      </Card>
    </div>
  );
}
