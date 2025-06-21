
// src/app/(app)/calendar/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  PlusCircle,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIconLucide,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color: string;
  description?: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
  date: Date;
  isAllDay?: boolean;
}

const sampleBaseEvents: Omit<CalendarEvent, 'id' | 'date'>[] = [
  { title: "Pagamento Aluguel", startTime: "00:00", endTime: "23:59", color: "bg-destructive/80 text-destructive-foreground", description: "Vencimento do aluguel mensal", location: "Online", isAllDay: true },
  { title: "Salário", startTime: "09:00", endTime: "09:30", color: "bg-primary text-primary-foreground", description: "Recebimento do salário", location: "Conta Bancária" },
  { title: "Supermercado", startTime: "16:00", endTime: "17:30", color: "bg-accent text-accent-foreground", description: "Compras da semana", location: "Mercado Local" },
  { title: "Conta de Luz", startTime: "10:00", endTime: "10:15", color: "bg-amber-500 text-white", description: "Vencimento da conta de energia elétrica", location: "App do Banco" },
  { title: "Reunião de Equipe", startTime: "14:00", endTime: "15:00", color: "bg-indigo-500 text-white", description: "Alinhamento semanal", location: "Escritório" },
];

const generateEventsForMonth = (refDate: Date): CalendarEvent[] => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const events: CalendarEvent[] = [];
    sampleBaseEvents.forEach((baseEvent, index) => {
        // Distribui os eventos em dias diferentes do mês para demonstração
        const eventDate = new Date(year, month, (index * 5 + 3) % 28 + 1); 
        events.push({
            ...baseEvent,
            id: `evt_${year}_${month}_${index}`,
            date: eventDate,
        });
    });
    return events;
};


export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  useEffect(() => {
    document.title = `Calendário - ${APP_NAME}`;
    setIsLoadingEvents(true);
    const simulatedFetchedEvents = generateEventsForMonth(currentMonth);
    setEvents(simulatedFetchedEvents);
    setIsLoadingEvents(false);
  }, [currentMonth]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
        .filter(event => isSameDay(event.date, selectedDate))
        .sort((a,b) => parseInt(a.startTime.replace(":", "")) - parseInt(b.startTime.replace(":", "")));
  }, [events, selectedDate]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    // Seleciona o primeiro dia do novo mês se a data selecionada anteriormente não estiver nele.
    if (!selectedDate || selectedDate.getMonth() !== month.getMonth()) {
        setSelectedDate(month);
    }
  }

  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr || timeStr.split(':').length !== 2) return '';
    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (isLoadingAuth || (isLoadingEvents && !!session)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Calendário" description="Carregando eventos..." icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}/>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="md:col-span-2 h-[400px] rounded-lg" />
            <Skeleton className="md:col-span-1 h-[400px] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Calendário de Eventos"
        description="Visualize e gerencie seus compromissos e eventos financeiros."
        icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}
        actions={
          <Button onClick={() => alert("Funcionalidade Adicionar Evento (placeholder)")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Evento
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
            <Card className="shadow-lg">
                <CardContent className="p-2 md:p-4">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        onMonthChange={handleMonthChange}
                        month={currentMonth}
                        className="w-full"
                        locale={ptBR}
                        components={{
                          DayContent: ({ date, ...props }) => {
                            const hasEvent = events.some(e => isSameDay(e.date, date));
                            return (
                                <div className="relative h-full w-full flex items-center justify-center">
                                    <span {...props.children?.props}>{date.getDate()}</span>
                                    {hasEvent && <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                                </div>
                            );
                          }
                        }}
                    />
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
             <Card className="shadow-lg sticky top-20">
                <CardHeader>
                    <CardTitle className="font-headline">
                        Eventos em {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : 'Nenhum dia selecionado'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[60vh] overflow-y-auto space-y-4">
                   {selectedDayEvents.length > 0 ? (
                       selectedDayEvents.map(event => (
                           <div key={event.id} className="flex items-start gap-3 p-3 rounded-md border-l-4" style={{borderColor: event.color.split(' ')[0].replace('bg-','--color-').replace('/',"").replace('text-','')}}>
                               <div className="flex-shrink-0 w-20 text-sm text-muted-foreground">
                                    {event.isAllDay ? "Dia Todo" : `${formatTimeForDisplay(event.startTime)}`}
                               </div>
                               <div className="flex-grow">
                                   <p className="font-semibold text-foreground">{event.title}</p>
                                   {event.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3"/>{event.location}</p>}
                               </div>
                           </div>
                       ))
                   ) : (
                       <div className="text-center text-muted-foreground py-8">
                           <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                           <p>Nenhum evento para este dia.</p>
                       </div>
                   )}
                </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}

    