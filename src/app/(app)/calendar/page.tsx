
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isToday as fnsIsToday, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getTransactions } from "@/services/transaction.service";
import type { Transaction } from "@/types/database.types";
import { toast } from "@/hooks/use-toast";
import { PrivateValue } from "@/components/shared/private-value";

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
  date: string; // YYYY-MM-DD
  isAllDay?: boolean;
  amount?: number;
  type?: 'income' | 'expense';
}

const weekDayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (23:00)
const slotHeight = 60; // pixels, for h-[60px]

const getWeekDates = (refDate: Date): Date[] => {
  const start = startOfWeek(refDate, { weekStartsOn: 0 }); // Domingo como início da semana
  return eachDayOfInterval({ start, end: endOfWeek(refDate, { weekStartsOn: 0 }) });
};

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";
  const user = session?.user;

  const [currentRefDate, setCurrentRefDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>(() => getWeekDates(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const fetchAndMapTransactions = useCallback(async () => {
    if (!user?.id) {
        setIsLoadingEvents(false);
        setEvents([]);
        return;
    }
    setIsLoadingEvents(true);
    try {
        const { data: transactions, error } = await getTransactions(user.id);
        if (error) {
            toast({ title: "Erro ao buscar transações", description: error.message, variant: "destructive" });
            setEvents([]);
            return;
        }

        const mappedEvents: CalendarEvent[] = (transactions || []).map((tx: Transaction) => ({
            id: tx.id,
            title: tx.description,
            date: tx.date,
            startTime: "00:00",
            endTime: "23:59",
            color: tx.type === 'income' ? "bg-primary/80 text-primary-foreground" : "bg-destructive/80 text-destructive-foreground",
            isAllDay: true,
            description: tx.notes || `Transação de ${tx.type === 'income' ? 'receita' : 'despesa'}.`,
            amount: tx.amount,
            type: tx.type
        }));
        setEvents(mappedEvents);

    } catch (err) {
        toast({ title: "Erro inesperado", description: "Não foi possível carregar os eventos do calendário.", variant: "destructive"});
    } finally {
        setIsLoadingEvents(false);
    }
  }, [user?.id]);


  useEffect(() => {
    document.title = `Calendário Semanal - ${APP_NAME}`;
    if (user?.id && !isLoadingAuth) {
        fetchAndMapTransactions();
    } else if (!isLoadingAuth && !user?.id) {
        setIsLoadingEvents(false);
        setEvents([]);
    }
  }, [user, isLoadingAuth, fetchAndMapTransactions]);

  const handleEventClick = (event: CalendarEvent) => setSelectedEvent(event);
  const handleNextWeek = () => setCurrentRefDate(prev => addDays(prev, 7));
  const handlePrevWeek = () => setCurrentRefDate(prev => addDays(prev, -7));
  const handleToday = () => setCurrentRefDate(new Date());

  useEffect(() => {
    setWeekDates(getWeekDates(currentRefDate));
  }, [currentRefDate]);

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
        {/* Cabeçalho Estático dos Dias da Semana */}
        <div className="col-span-1 row-span-1 border-r border-b p-2 text-xs text-muted-foreground sticky top-0 bg-card z-20"></div> {/* Canto superior esquerdo */}
        {weekDates.map((date, i) => (
          <div key={`header-${i}`} className={cn("row-start-1 p-2 text-center border-b sticky top-0 bg-card z-20", i < 6 && "border-r")}>
            <div className="text-xs text-muted-foreground font-medium">{weekDayLabels[getDay(date)]}</div>
            <div className={cn("text-xl font-semibold mt-1", fnsIsToday(date) ? "text-primary" : "text-foreground")}>
              {format(date, "d")}
            </div>
          </div>
        ))}
        
        {/* Container para eventos All-Day */}
        <div className="col-start-1 row-start-2 border-r border-b min-h-[30px] sticky left-0 bg-card z-10"></div>
        <div className="col-start-2 col-span-7 row-start-2 grid grid-cols-7 border-b relative pointer-events-none">
            {weekDates.map((date, dayIndex) => (
                <div key={`allday-col-${dayIndex}`} className={cn("relative p-0.5", dayIndex < 6 && "border-r")}>
                    <div className="absolute top-0 left-0 right-0 space-y-0.5 pointer-events-auto h-[70px] overflow-y-auto">
                        {events
                        .filter(event => isSameDay(parseISO(event.date), date) && event.isAllDay)
                        .map((event) => (
                            <div
                                key={event.id}
                                className={cn(
                                "rounded p-1 text-[10px] shadow-sm cursor-pointer overflow-hidden mr-1 flex items-center mb-0.5",
                                event.color
                                )}
                                onClick={() => handleEventClick(event)}
                            >
                                <div className="font-medium truncate">{event.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {/* Gutter de Horários e Células de Eventos */}
        <div className="col-start-1 row-start-3 overflow-y-scroll relative">
            {timeSlots.map((hour) => (
                <div key={`gutter-${hour}`} className={cn("h-[60px] text-right pr-2 text-xs pt-1 text-muted-foreground")}>
                  <span>{hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</span>
                </div>
            ))}
        </div>
        <div className="col-start-2 col-span-7 row-start-3 overflow-y-scroll">
            <div className="grid grid-cols-7 relative">
                {/* Linhas de Horário de Fundo */}
                {timeSlots.map((hour) => (
                    <div key={`line-${hour}`} className="col-span-7 h-[60px] border-b"></div>
                ))}

                {/* Colunas para posicionar eventos */}
                {weekDates.map((date, dayIndex) => (
                  <div key={`events-col-${dayIndex}`} className="absolute top-0 h-full col-span-1" style={{left: `calc(${dayIndex} * 100% / 7)`}}>
                    {events
                      .filter(event => isSameDay(parseISO(event.date), date) && !event.isAllDay)
                      .map(event => {
                        // Esta lógica de posicionamento é para eventos que têm hora, omitida por enquanto
                        // já que estamos tratando tudo como all-day.
                        return null;
                      })}
                  </div>
                ))}
            </div>
        </div>
      </div>
      
      {!isLoadingEvents && events.length === 0 && (
         <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
              <p>Nenhum evento (transação) encontrado.</p>
              <p className="text-xs">Adicione transações para vê-las no calendário.</p>
        </div>
      )}


      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
          <DialogContent className={cn("sm:max-w-md", selectedEvent.color?.replace('bg-', 'border-t-4 border-') || "border-t-4 border-primary")}>
            <DialogHeader>
              <DialogTitle className={cn("font-headline text-xl", selectedEvent.color?.includes('text-') ? selectedEvent.color.split(' ').find(c => c.startsWith('text-')) : 'text-primary')}>
                {selectedEvent.title}
              </DialogTitle>
              {selectedEvent.description && (<DialogDescription>{selectedEvent.description}</DialogDescription>)}
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
                <p className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Dia todo em {format(parseISO(selectedEvent.date), "PPP", { locale: ptBR })}</span>
                </p>
                {selectedEvent.amount !== undefined && (
                   <p className="flex items-center font-semibold">
                     <span className={cn("mr-2 h-4 w-4", selectedEvent.type === 'income' ? 'text-emerald-500' : 'text-destructive' )}>$</span>
                     <PrivateValue value={selectedEvent.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                   </p>
                )}
            </div>
            <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center w-full">
              <Button type="button" variant="secondary" onClick={() => alert("Funcionalidade Adicionar ao Google Agenda (placeholder)")}>Adicionar ao Google Agenda</Button>
              <div className="flex gap-2">
                 <DialogClose asChild><Button type="button" variant="outline">Fechar</Button></DialogClose>
                 <Button type="button" variant="default" onClick={() => alert("Funcionalidade Editar Evento (placeholder)")}>Editar</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
