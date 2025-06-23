
// src/app/(app)/calendar/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import type { Transaction } from "@/types/database.types";
import { getTransactions } from "@/services/transaction.service";
import { toast } from "@/hooks/use-toast";
import { format, isSameDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { PrivateValue } from "@/components/shared/private-value";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await getTransactions(session.user.id);
      if (error) {
        toast({ title: "Erro ao buscar transações", description: error.message, variant: "destructive" });
        setTransactions([]);
      } else {
        setTransactions(data || []);
      }
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    document.title = `Calendário - ${APP_NAME}`;
    if (status === 'authenticated') {
      fetchTransactions();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, fetchTransactions]);

  const transactionsOnSelectedDay = useMemo(() => {
    if (!date) return [];
    return transactions.filter(tx => isSameDay(new Date(tx.date + "T00:00:00Z"), date));
  }, [date, transactions]);

  const daysWithTransactions = useMemo(() => {
    return transactions.map(tx => new Date(tx.date + "T00:00:00Z"));
  }, [transactions]);
  
  const dayHasTransactionModifier = { hasTransaction: daysWithTransactions };

  if (status === 'loading' || isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Calendário" description="Carregando transações..." icon={<CalendarDays className="h-6 w-6 text-primary"/>}/>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm"><CardContent className="p-4"><Skeleton className="h-[350px] w-full" /></CardContent></Card>
          <Card className="lg:col-span-1 shadow-sm"><CardHeader><Skeleton className="h-6 w-3/4 mb-1" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent className="space-y-4">{Array(3).fill(0).map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}</CardContent></Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário Financeiro"
        description="Selecione uma data para ver as transações do dia. Dias com um ponto têm atividade."
        icon={<CalendarDays className="h-6 w-6 text-primary" />}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2 shadow-lg">
          <CardContent className="p-2 md:p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md"
              locale={ptBR}
              modifiers={dayHasTransactionModifier}
              modifiersClassNames={{
                hasTransaction: 'day-with-transaction',
              }}
              components={{
                DayContent: ({ date, ...props }) => {
                  const hasTx = daysWithTransactions.some(txDate => isSameDay(txDate, date));
                  return (
                    <div className="relative h-full w-full flex items-center justify-center">
                      <span>{date.getDate()}</span>
                      {hasTx && <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                  );
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle className="font-headline text-lg md:text-xl">
              {date ? format(date, "'Transações de' PPP", { locale: ptBR }) : "Selecione um Dia"}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto">
            {date ? (
              transactionsOnSelectedDay.length > 0 ? (
                <ul className="space-y-3">
                  {transactionsOnSelectedDay.map(tx => (
                    <li key={tx.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <div className="flex-grow">
                        <p className="font-medium text-sm truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.category?.name || "Sem categoria"}</p>
                      </div>
                      <PrivateValue
                        value={tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        className={cn(
                          "font-medium text-sm ml-4",
                          tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                        )}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>Nenhuma transação encontrada para este dia.</p>
                </div>
              )
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                 <ArrowRightLeft className="mx-auto h-8 w-8 mb-2 opacity-50" />
                 <p>Selecione um dia no calendário para ver os detalhes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <style>{`
        .day-with-transaction {
          /* font-weight: bold; */
        }
      `}</style>
    </div>
  );
}
