// src/app/(app)/calendar/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  PlusCircle,
  ExternalLink,
  Clock,
  MapPin,
  ListChecks
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format,
  isSameDay,
  parseISO,
  startOfMonth
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color: string; // Tailwind border color class
  description?: string;
  location?: string;
}

// Eventos de exemplo
const sampleEvents: CalendarEvent[] = [
  { id: '1', title: "Pagamento Aluguel", date: "2024-07-05", startTime: "09:00", endTime: "09:30", color: "border-destructive", description: "Vencimento do aluguel mensal.", location: "App do Banco" },
  { id: '2', title: "Salário", date: "2024-07-05", startTime: "10:00", endTime: "11:00", color: "border-primary", description: "Recebimento do salário.", location: "Conta Bancária" },
  { id: '3', title: "Supermercado", date: "2024-07-10", startTime: "16:00", endTime: "17:30", color: "border-accent", description: "Compras da semana.", location: "Mercado Local" },
  { id: '4', title: "Reunião de Equipe", date: "2024-07-10", startTime: "14:00", endTime: "15:00", color: "border-blue-500", description: "Alinhamento semanal.", location: "Escritório" },
  { id: '5', title: "Consulta Médica", date: "2024-07-22", startTime: "08:30", endTime: "09:30", color: "border-purple-500", description: "Check-up anual.", location: "Clínica Saúde" },
];


export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);

  useEffect(() => {
    document.title = `Calendário - ${APP_NAME}`;
  }, []);

  const eventsForSelectedDay = useMemo(() => {
    return date ? events.filter(event => isSameDay(parseISO(event.date), date)).sort((a,b) => a.startTime.localeCompare(b.startTime)) : [];
  }, [date, events]);
  
  const daysWithEvents = useMemo(() => {
    const dates = events.map(event => parseISO(event.date));
    return dates;
  }, [events]);

  const EventDot = () => <div className="h-1.5 w-1.5 bg-primary rounded-full absolute bottom-1.5 left-1/2 -translate-x-1/2"></div>;

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Calendário" description="Carregando seus eventos..." icon={<CalendarIcon className="h-6 w-6 text-primary"/>}/>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-[500px] w-full" />
            <Skeleton className="lg:col-span-1 h-[500px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
        <PageHeader
            title="Calendário de Eventos"
            description="Visualize e gerencie suas transações, metas e tarefas de forma integrada."
            icon={<CalendarIcon className="h-6 w-6 text-primary"/>}
            actions={
                <Button onClick={() => toast({ title: "Funcionalidade Futura", description: "A criação de eventos será implementada em breve." })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Evento
                </Button>
            }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            <Card className="shadow-lg lg:col-span-2">
                 <CardContent className="p-2 sm:p-4">
                     <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        month={month}
                        onMonthChange={setMonth}
                        className="p-0 [&_td]:w-full"
                        classNames={{
                             day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                             day_today: "bg-accent text-accent-foreground",
                        }}
                        components={{
                            DayContent: (props) => (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {props.date.getDate()}
                                    {daysWithEvents.some(d => isSameDay(props.date, d)) && <EventDot />}
                                </div>
                            )
                        }}
                     />
                 </CardContent>
            </Card>
            <Card className="shadow-lg lg:col-span-1">
                <CardHeader>
                    <CardTitle className="font-headline text-lg">
                        {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
                    </CardTitle>
                    <CardDescription>Eventos agendados para este dia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 overflow-y-auto max-h-[400px]">
                    {date && eventsForSelectedDay.length > 0 ? (
                        eventsForSelectedDay.map(event => (
                            <div key={event.id} className={cn("p-3 rounded-lg border-l-4", event.color)}>
                                <p className="font-semibold text-sm">{event.title}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" />{event.startTime} - {event.endTime}</p>
                                {event.location && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3 w-3" />{event.location}</p>}
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 mt-1 text-xs"
                                    onClick={() => toast({ title: "Funcionalidade Futura", description: "A integração com o Google Agenda será implementada." })}
                                >
                                    <ExternalLink className="mr-1 h-3 w-3" /> Adicionar ao Google
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <ListChecks className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2"/>
                            <p>Nenhum evento para o dia selecionado.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
