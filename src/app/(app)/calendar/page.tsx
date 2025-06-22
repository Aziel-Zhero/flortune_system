
// src/app/(app)/calendar/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIconLucide, AlertTriangle, PlusCircle } from "lucide-react";
import { PrivateValue } from "@/components/shared/private-value";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction } from "@/types/database.types";
import { getTransactions } from "@/services/transaction.service";
import { toast } from "@/hooks/use-toast";

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";
  const user = session?.user;

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
        setIsLoadingEvents(false);
        setTransactions([]);
        return;
    }
    setIsLoadingEvents(true);
    try {
        const { data, error } = await getTransactions(user.id);
        if (error) {
            toast({ title: "Erro ao buscar transações", description: error.message, variant: "destructive" });
        } else {
            setTransactions(data || []);
        }
    } catch (err) {
        toast({ title: "Erro inesperado", description: "Não foi possível carregar os eventos.", variant: "destructive"});
    } finally {
        setIsLoadingEvents(false);
    }
  }, [user?.id]);

  useEffect(() => {
    document.title = `Calendário - ${APP_NAME}`;
    if (user?.id && !isLoadingAuth) {
        fetchTransactions();
    } else if (!isLoadingAuth) {
        setIsLoadingEvents(false);
    }
  }, [user, isLoadingAuth, fetchTransactions]);

  const eventsForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter(event => isSameDay(parseISO(event.date), selectedDay)).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedDay, transactions]);
  
  const daysWithEvents = useMemo(() => {
      return transactions.map(tx => startOfDay(parseISO(tx.date)));
  }, [transactions]);

  if (isLoadingAuth || isLoadingEvents) {
    return (
        <div className="space-y-6">
            <PageHeader title="Calendário" description="Carregando seus eventos financeiros..." icon={<CalendarIconLucide />} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm"><CardContent className="p-3"><Skeleton className="h-[350px] w-full" /></CardContent></Card>
                <Card className="lg:col-span-1 shadow-sm"><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
            </div>
        </div>
    );
  }

  return (
    <div>
        <PageHeader 
            title="Calendário Financeiro" 
            description="Selecione um dia para ver suas transações."
            icon={<CalendarIconLucide />}
            actions={<Button onClick={() => alert("Adicionar evento (placeholder)")}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar Evento</Button>}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card className="shadow-lg">
                    <Calendar
                        mode="single"
                        selected={selectedDay}
                        onSelect={setSelectedDay}
                        className="p-3 w-full"
                        classNames={{
                            day: "h-12 w-12 text-base",
                            head_cell: "text-muted-foreground rounded-md w-12 font-normal text-sm",
                            cell: "w-full",
                        }}
                        modifiers={{
                            hasEvent: daysWithEvents,
                        }}
                        modifiersClassNames={{
                            hasEvent: 'day-with-event',
                        }}
                        locale={ptBR}
                    />
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card className="shadow-lg min-h-[400px]">
                    <CardHeader>
                        <CardTitle className="font-headline text-lg">
                            Eventos para {selectedDay ? format(selectedDay, "PPP", { locale: ptBR }) : '...'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {eventsForSelectedDay.length > 0 ? (
                            <ul className="space-y-3">
                                {eventsForSelectedDay.map(event => (
                                    <li key={event.id} className={cn("p-3 rounded-md flex items-start gap-3 border-l-4", event.type === 'income' ? 'border-primary bg-primary/10' : 'border-destructive bg-destructive/10')}>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{event.description}</p>
                                            <p className="text-xs text-muted-foreground">{event.category?.name || 'Sem Categoria'}</p>
                                        </div>
                                        <PrivateValue 
                                            value={event.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            className={cn("font-medium text-sm", event.type === 'income' ? 'text-primary' : 'text-destructive')}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <AlertTriangle className="mx-auto h-10 w-10 mb-2 opacity-50"/>
                                <p>Nenhuma transação neste dia.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        <style jsx global>{`
            .day-with-event {
                position: relative;
            }
            .day-with-event::after {
                content: '';
                position: absolute;
                bottom: 6px;
                left: 50%;
                transform: translateX(-50%);
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: hsl(var(--primary));
            }
            .rdp-day_selected.day-with-event::after {
                 background-color: hsl(var(--primary-foreground));
            }
        `}</style>
    </div>
  );
}
