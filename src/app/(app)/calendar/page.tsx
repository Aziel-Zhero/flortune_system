
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

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color: string; // Tailwind background color class e.g., "bg-blue-500"
  description?: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
  date: string; // YYYY-MM-DD,
  isAllDay?: boolean;
}

const sampleBaseEvents: Omit<CalendarEvent, 'id' | 'date'>[] = [
  { title: "Pagamento Aluguel", startTime: "00:00", endTime: "23:59", color: "bg-destructive/80 text-destructive-foreground", description: "Vencimento do aluguel mensal", location: "Online", isAllDay: true},
  { title: "Salário", startTime: "00:00", endTime: "23:59", color: "bg-primary text-primary-foreground", description: "Recebimento do salário", location: "Conta Bancária", isAllDay: true },
  { title: "Supermercado", startTime: "16:00", endTime: "17:30", color: "bg-accent text-accent-foreground", description: "Compras da semana", location: "Mercado Local"},
  { title: "Conta de Luz", startTime: "10:00", endTime: "10:15", color: "bg-amber-500 text-white", description: "Vencimento da conta de energia elétrica", location: "App do Banco"},
  { title: "Rendimento Investimento", startTime: "09:00", endTime: "09:05", color: "bg-emerald-500 text-white", description: "Crédito do rendimento mensal", location: "Corretora"},
  { title: "Assinatura Streaming", startTime: "11:00", endTime: "11:05", color: "bg-sky-500 text-white", description: "Débito da assinatura mensal", location: "Cartão de Crédito"},
  { title: "Reunião de Equipe", startTime: "14:00", endTime: "15:00", color: "bg-indigo-500 text-white", description: "Alinhamento semanal", location: "Escritório"},
  { title: "Consulta Médica", startTime: "08:30", endTime: "09:30", color: "bg-purple-500 text-white", description: "Check-up anual", location: "Clínica Saúde"},
];

const weekDayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (23:00)
const slotHeight = 60; // pixels, para h-[60px]

const getWeekDates = (refDate: Date): Date[] => {
  const start = startOfWeek(refDate, { weekStartsOn: 0 }); // Domingo como início da semana
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

  const assignEventsToCurrentWeek = useCallback((baseEvts: Omit<CalendarEvent, 'id'|'date'>[], currentWeek: Date[]): CalendarEvent[] => {
    return baseEvts.map((eventBase, index) => {
      const dayIndex = index % currentWeek.length;
      const targetDate = currentWeek[dayIndex];
      return {
        ...eventBase,
        id: `evt_sample_${targetDate.toISOString().split('T')[0]}_${index}`,
        date: targetDate.toISOString().split('T')[0],
      };
    });
  }, []);

  useEffect(() => {
    document.title = `Calendário Semanal - ${APP_NAME}`;
    setIsLoadingEvents(true);
    const simulatedFetchedEvents = assignEventsToCurrentWeek(sampleBaseEvents, weekDates);
    setEvents(simulatedFetchedEvents);
    setIsLoadingEvents(false); 
  }, [weekDates, assignEventsToCurrentWeek]);

  const handleEventClick = (event: CalendarEvent) => setSelectedEvent(event);
  const handleNextWeek = () => setCurrentRefDate(prev => addDays(prev, 7));
  const handlePrevWeek = () => setCurrentRefDate(prev => addDays(prev, -7));
  const handleToday = () => setCurrentRefDate(new Date());

  useEffect(() => {
    setWeekDates(getWeekDates(currentRefDate));
  }, [currentRefDate]);

  const calculateEventStyle = (startTime: string, endTime: string) => {
    const timelineStartHour = timeSlots[0];
    
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const topPosition = ((startH - timelineStartHour) + (startM / 60)) * slotHeight;
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    let eventHeight = (durationMinutes / 60) * slotHeight;
    
    if (eventHeight < 20) eventHeight = 20;

    return { top: `${topPosition}px`, height: `${eventHeight}px`, zIndex: 10 };
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
        <PageHeader title="Calendário Semanal" description="Carregando eventos..." icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}/>
        <Skeleton className="w-full h-[calc(100vh-200px)] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
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
      
      <div className="flex-1 grid grid-cols-1 grid-rows-[auto_1fr] border bg-card rounded-lg shadow-sm overflow-hidden">
        {/* Cabeçalho Estático dos Dias da Semana */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-20 bg-card">
          <div className="border-r border-b p-2"></div> {/* Canto superior esquerdo */}
          {weekDates.map((date, i) => (
            <div key={`header-${i}`} className={cn("row-span-1 p-2 text-center border-b", i < 6 && "border-r")}>
              <div className="text-xs text-muted-foreground font-medium">{weekDayLabels[getDay(date)]}</div>
              <div className={cn("text-xl font-semibold mt-1", fnsIsToday(date) ? "text-primary" : "text-foreground")}>
                {format(date, "d")}
              </div>
            </div>
          ))}
        </div>
        {/* Corpo Rolável */}
        <div className="overflow-y-auto">
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Gutter de Horários e Células de Evento */}
            {timeSlots.map((hour) => (
              <React.Fragment key={`timeslot-row-${hour}`}>
                {/* Célula do Gutter de Horário */}
                <div className="border-r text-right pr-2 text-xs pt-1 text-muted-foreground relative -top-2">
                  <span>{hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</span>
                </div>
                {/* Células dos Dias para este Horário */}
                {weekDates.map((date, dayIndex) => (
                  <div
                    key={`cell-${dayIndex}-${hour}`}
                    className={cn( "h-[60px] border-b", dayIndex < 6 && "border-r")}
                  />
                ))}
              </React.Fragment>
            ))}

            {/* Container Absoluto para Eventos */}
            <div className="col-start-2 col-span-7 row-start-1 row-span-full grid grid-cols-7 relative">
              {weekDates.map((date, dayIndex) => (
                <div key={`event-col-${dayIndex}`} className={cn("relative", dayIndex < 6 && "border-r")}>
                   {/* All-day Events */}
                   <div className="sticky top-0 bg-card z-10 p-0.5 space-y-0.5">
                     {events
                        .filter(event => isSameDay(parseISO(event.date), date) && event.isAllDay)
                        .slice(0, 2) // Limitar para não poluir
                        .map((event, index) => (
                            <div
                                key={event.id}
                                className={cn("rounded p-1 text-[10px] shadow-sm cursor-pointer overflow-hidden mr-1 flex items-center", event.color)}
                                onClick={() => handleEventClick(event)}
                            >
                                <div className="font-medium truncate">{event.title}</div>
                            </div>
                        ))
                     }
                   </div>
                   {/* Timed Events */}
                   {events
                    .filter(event => isSameDay(parseISO(event.date), date) && !event.isAllDay)
                    .map(event => {
                      const style = calculateEventStyle(event.startTime, event.endTime);
                      return (
                        <div
                          key={event.id}
                          className={cn("absolute rounded p-1.5 text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg overflow-hidden", event.color)}
                          style={{ ...style, left: "2px", right: "2px"}}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="opacity-80 text-[10px] truncate">{`${formatTimeForDisplay(event.startTime)} - ${formatTimeForDisplay(event.endTime)}`}</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
          <DialogContent className={cn("sm:max-w-md border-t-4", selectedEvent.color?.replace('bg-', 'border-') || "border-primary")}>
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">{selectedEvent.title}</DialogTitle>
              {selectedEvent.description && (<DialogDescription>{selectedEvent.description}</DialogDescription>)}
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <p className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" />{selectedEvent.isAllDay ? "Dia todo" : `${formatTimeForDisplay(selectedEvent.startTime)} - ${formatTimeForDisplay(selectedEvent.endTime)}`} <span className="ml-2 text-muted-foreground">({format(parseISO(selectedEvent.date), "PPP", { locale: ptBR })})</span></p>
              {selectedEvent.location && (<p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />{selectedEvent.location}</p>)}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (<p className="flex items-start"><Users className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" /><span><strong className="text-foreground/80">Participantes:</strong><br />{selectedEvent.attendees.join(", ")}</span></p>)}
              {selectedEvent.organizer && (<p><strong className="text-foreground/80">Organizador:</strong> {selectedEvent.organizer}</p>)}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Fechar</Button></DialogClose>
              <Button type="button" variant="default" onClick={() => alert("Funcionalidade Editar Evento (placeholder)")}>Editar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
