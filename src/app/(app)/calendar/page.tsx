
// src/app/(app)/calendar/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Calendar as CalendarIconLucide, 
  ListChecks,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO, 
  isToday as fnsIsToday,
  getDay // <<< IMPORTAÇÃO CORRIGIDA
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction } from "@/types/database.types";
import { getTransactions } from "@/services/transaction.service";
import { toast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color: string;
  description?: string;
  date: string; // YYYY-MM-DD
  isAllDay?: boolean;
}

const weekDayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (23:00)
const slotHeight = 60; // pixels, para h-[60px]

const getWeekDates = (refDate: Date): Date[] => {
  const start = startOfWeek(refDate, { weekStartsOn: 0 }); // Domingo
  return eachDayOfInterval({ start, end: endOfWeek(refDate, { weekStartsOn: 0 }) });
};

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";

  const [currentRefDate, setCurrentRefDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>(() => getWeekDates(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]); 
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchAndMapTransactions = useCallback(async () => {
    if (!session?.user?.id) {
        setIsLoadingEvents(false);
        return;
    }
    setIsLoadingEvents(true);
    try {
        const { data, error } = await getTransactions(session.user.id);
        if (error) {
            toast({ title: "Erro ao buscar eventos", description: error.message, variant: "destructive" });
            setEvents([]);
            return;
        }

        const mappedEvents: CalendarEvent[] = (data || []).map(tx => ({
            id: tx.id,
            title: tx.description,
            startTime: "00:00",
            endTime: "23:59",
            color: tx.type === 'income' ? "bg-primary/80 text-primary-foreground" : "bg-destructive/80 text-destructive-foreground",
            description: tx.notes || `Valor: ${tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
            date: tx.date,
            isAllDay: true
        }));
        setEvents(mappedEvents);

    } catch (err) {
        toast({ title: "Erro inesperado", description: "Não foi possível carregar as transações para o calendário.", variant: "destructive"});
    } finally {
        setIsLoadingEvents(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    document.title = `Calendário Semanal - ${APP_NAME}`;
    if(status === 'authenticated') {
        fetchAndMapTransactions();
    } else if (status === 'unauthenticated') {
        setIsLoadingEvents(false);
    }
  }, [status, fetchAndMapTransactions]);

  const handleEventClick = (event: CalendarEvent) => setSelectedEvent(event);
  const handleNextWeek = () => setCurrentRefDate(prev => addDays(prev, 7));
  const handlePrevWeek = () => setCurrentRefDate(prev => addDays(prev, -7));
  const handleToday = () => setCurrentRefDate(new Date());

  useEffect(() => {
    setWeekDates(getWeekDates(currentRefDate));
  }, [currentRefDate]);

  const calculateEventStyle = (startTime: string, endTime: string, isAllDay?: boolean) => {
    if (isAllDay) {
      return { top: `0px`, height: `24px`, zIndex: 10, isFullWidth: true }; 
    }
    const timelineStartHour = timeSlots[0];
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const topPosition = ((startH - timelineStartHour) + (startM / 60)) * slotHeight;
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    let eventHeight = (durationMinutes / 60) * slotHeight;
    if (eventHeight < 20) eventHeight = 20;

    return { top: `${topPosition}px`, height: `${eventHeight}px`, zIndex: 10, isFullWidth: false };
  };

  const currentMonthYearLabel = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    weekDates.forEach(d => {
      const monthName = format(d, "MMMM yyyy", { locale: ptBR });
      monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
    });
    let majorityMonth = format(weekDates[0], "MMMM yyyy", { locale: ptBR });
    let maxCount = 0;
    for (const month in monthCounts) {
      if (monthCounts[month] > maxCount) {
        maxCount = monthCounts[month];
        majorityMonth = month;
      }
    }
    return majorityMonth.charAt(0).toUpperCase() + majorityMonth.slice(1);
  }, [weekDates]);
  
  if (isLoadingAuth || isLoadingEvents) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Calendário Semanal" description="Carregando eventos..." icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}/>
        <Skeleton className="w-full h-[calc(100vh-200px)] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Calendário Financeiro"
        description={currentMonthYearLabel}
        icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>Hoje</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek} aria-label="Semana anterior">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek} aria-label="Próxima semana">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button size="sm" onClick={() => alert("Funcionalidade Adicionar Evento (placeholder)")}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Evento
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 grid grid-cols-[60px_repeat(7,1fr)] border bg-card rounded-lg shadow-sm overflow-hidden">
        {/* Cabeçalho Estático */}
        <div className="col-span-1 row-span-1 border-r border-b p-2 sticky top-0 bg-card z-20"></div>
        {weekDates.map((date, i) => (
          <div key={`header-${i}`} className={cn("row-span-1 p-2 text-center border-b sticky top-0 bg-card z-20", i < 6 && "border-r")}>
            <div className="text-xs text-muted-foreground font-medium">{weekDayLabels[getDay(date)]}</div>
            <div className={cn("text-xl font-semibold mt-1", fnsIsToday(date) ? "text-primary" : "text-foreground")}>
              {format(date, "d")}
            </div>
          </div>
        ))}
        {/* Area de scroll */}
        <div className="col-start-1 col-span-8 row-start-2 overflow-y-auto" style={{height: 'calc(100vh - 250px)'}}>
            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
                {/* Gutter de Horários */}
                <div className="col-start-1 row-start-1">
                {timeSlots.map((hour) => (
                    <div key={`timeslot-label-${hour}`} className={cn("h-[60px] border-r text-right pr-2 text-xs pt-1 text-muted-foreground relative -top-[10px]")}>
                        <span>{hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</span>
                    </div>
                ))}
                </div>
                {/* Colunas dos Dias */}
                {weekDates.map((date, dayIndex) => (
                    <div key={`day-col-${dayIndex}`} className={cn("col-start-${dayIndex + 2} row-start-1 relative", dayIndex < 6 && "border-r")}>
                        {/* Linhas de Hora */}
                        {timeSlots.map((hour) => (<div key={`timeslot-line-${dayIndex}-${hour}`} className="h-[60px] border-b"></div>))}
                        
                        {/* Container para eventos All-Day */}
                        <div className="absolute top-0 left-0 right-0 p-0.5 space-y-0.5 z-10">
                            {events
                            .filter(event => isSameDay(parseISO(event.date), date) && event.isAllDay)
                            .slice(0,3) // Limitar a 3 eventos all-day para não poluir
                            .map((event, index) => {
                                return (
                                <div
                                    key={event.id}
                                    style={{ top: `${index * 26}px`}}
                                    className={cn( "absolute left-1 right-1 rounded p-1 text-[10px] shadow-sm cursor-pointer overflow-hidden flex items-center", event.color )}
                                    onClick={() => handleEventClick(event)}
                                >
                                    <div className="font-medium truncate">{event.title}</div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
          <DialogContent className={cn("sm:max-w-md", selectedEvent.color?.replace('bg-', 'border-t-4 border-') || "border-t-4 border-primary")}>
            <DialogHeader>
              <DialogTitle className={cn("font-headline text-xl text-foreground")}>
                {selectedEvent.title}
              </DialogTitle>
              {selectedEvent.description && (<DialogDescription>{selectedEvent.description}</DialogDescription>)}
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <p className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {selectedEvent.isAllDay ? "Dia todo" : "Horário específico (a ser implementado)"}
                <span className="ml-2 text-muted-foreground">({format(parseISO(selectedEvent.date), "PPP", { locale: ptBR })})</span>
              </p>
            </div>
            <DialogFooter className="sm:justify-between gap-2">
                 <Button type="button" variant="outline" onClick={() => alert("Funcionalidade Adicionar ao Google Agenda (placeholder)")}>
                    Adicionar ao Google Agenda
                 </Button>
                 <DialogClose asChild><Button type="button" variant="secondary">Fechar</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

    