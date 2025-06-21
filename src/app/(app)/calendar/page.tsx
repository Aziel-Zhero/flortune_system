
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
  ExternalLink
} from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
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
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isToday as fnsIsToday, getDay, set } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  color: string; // Tailwind bg color class
  description?: string;
  location?: string;
  isAllDay?: boolean;
}

const sampleBaseEvents: Omit<CalendarEvent, 'id' | 'date'>[] = [
  { title: "Pagamento Aluguel", startTime: "00:00", endTime: "23:59", color: "bg-red-500 text-white", description: "Vencimento do aluguel mensal", location: "Online", isAllDay: true},
  { title: "Salário", startTime: "00:00", endTime: "23:59", color: "bg-green-500 text-white", description: "Recebimento do salário", location: "Conta Bancária", isAllDay: true },
  { title: "Supermercado", startTime: "16:00", endTime: "17:30", color: "bg-yellow-500 text-yellow-900", description: "Compras da semana", location: "Mercado Local"},
  { title: "Conta de Luz", startTime: "10:00", endTime: "10:15", color: "bg-orange-500 text-white", description: "Vencimento da conta de energia elétrica", location: "App do Banco"},
];

const weekDayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (23:00)
const slotHeight = 60; 

const getWeekDates = (refDate: Date): Date[] => {
  const start = startOfWeek(refDate, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: endOfWeek(refDate, { weekStartsOn: 0 }) });
};

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>(() => getWeekDates(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]); 
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const assignEventsToCurrentWeek = useCallback((baseEvts: Omit<CalendarEvent, 'id'|'date'>[], currentWeek: Date[]): CalendarEvent[] => {
    return baseEvts.map((eventBase, index) => {
      const dayIndex = (index + getDay(currentWeek[0]) + 3) % 7; 
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
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));
  const handlePrevWeek = () => setCurrentDate(prev => subDays(prev, 7));
  const handleToday = () => setCurrentDate(new Date());

  useEffect(() => {
    setWeekDates(getWeekDates(currentDate));
  }, [currentDate]);

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
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];
    const startMonth = format(start, "MMMM", { locale: ptBR });
    const endMonth = format(end, "MMMM", { locale: ptBR });
    const startYear = format(start, "yyyy");
    const endYear = format(end, "yyyy");
    
    let label = startMonth;
    if (startMonth !== endMonth) label += ` / ${endMonth}`;
    label += ` ${startYear}`;
    if (startYear !== endYear) label += ` / ${endYear}`;
    
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [weekDates]);

  const formatTimeForDisplay = (timeStr: string) => timeStr;

  const eventsForSelectedDay = useMemo(() => {
    return events
      .filter(event => isSameDay(parseISO(event.date), selectedDay))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, selectedDay]);

  if (isLoadingAuth) {
    return <div className="flex flex-col h-full"><PageHeader title="Calendário Semanal" description="Carregando..." /><Skeleton className="w-full h-[calc(100vh-200px)]" /></div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Calendário Semanal"
        description={currentMonthYearLabel}
        icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>Hoje</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}><ChevronLeft className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}><ChevronRight className="h-5 w-5" /></Button>
            <Button size="sm" onClick={() => toast({title: "Placeholder", description: "A criação de eventos será implementada futuramente."})}><Plus className="mr-2 h-4 w-4" /> Criar Evento</Button>
          </div>
        }
      />
      
      <div className="flex flex-1 gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col border bg-card rounded-lg shadow-sm">
          {/* Weekday Header */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 bg-card z-20 border-b">
            <div className="border-r"></div>
            {weekDates.map((date) => (
              <div key={date.toString()} className={cn("p-2 text-center border-r last:border-r-0", isSameDay(date, selectedDay) && "bg-primary/10")} onClick={() => setSelectedDay(date)}>
                <div className="text-xs text-muted-foreground font-medium">{weekDayLabels[getDay(date)]}</div>
                <div className={cn("text-xl font-semibold mt-1", fnsIsToday(date) ? "text-primary" : "text-foreground")}>{format(date, "d")}</div>
              </div>
            ))}
          </div>

          {/* Timeslot Gutter and Event Grid */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {/* Time Gutter */}
              <div className="col-start-1 col-span-1 row-start-1">
                {timeSlots.map(hour => (
                  <div key={`gutter-${hour}`} className="h-[60px] border-r border-b text-right pr-2 pt-1 text-xs text-muted-foreground relative -top-[8px]">{`${hour}:00`}</div>
                ))}
              </div>
              {/* Event Columns */}
              {weekDates.map((date, dayIndex) => (
                <div key={`day-col-${dayIndex}`} className="col-start-${dayIndex + 2} col-span-1 row-start-1 relative border-r last:border-r-0">
                  {/* Background lines */}
                  {timeSlots.map(hour => <div key={`line-${dayIndex}-${hour}`} className="h-[60px] border-b"></div>)}
                  
                  {/* All-day events */}
                  <div className="absolute top-0 left-0 right-0 p-0.5 space-y-0.5 pointer-events-auto z-10 border-b-2 border-dashed">
                     {events.filter(event => isSameDay(parseISO(event.date), date) && event.isAllDay).slice(0, 2).map(event => (
                        <div key={event.id} onClick={() => handleEventClick(event)} className={cn("p-1 text-[10px] rounded-sm cursor-pointer truncate", event.color)}>Dia todo: {event.title}</div>
                     ))}
                  </div>

                  {/* Timed events */}
                  {events.filter(event => isSameDay(parseISO(event.date), date) && !event.isAllDay).map(event => {
                    const style = calculateEventStyle(event.startTime, event.endTime);
                    return (
                      <div key={event.id} onClick={() => handleEventClick(event)} className={cn("absolute p-1.5 text-xs shadow-md cursor-pointer transition-all overflow-hidden rounded", event.color)} style={{ ...style, left: "4px", right: "4px"}}>
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-80 text-[10px] truncate">{formatTimeForDisplay(event.startTime)} - {formatTimeForDisplay(event.endTime)}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar for Events of Selected Day */}
        <Card className="hidden lg:flex lg:flex-col w-full max-w-xs shadow-sm">
           <CardHeader>
             <CardTitle>Eventos de {format(selectedDay, "dd/MM")}</CardTitle>
             <CardDescription>{format(selectedDay, "eeee", {locale: ptBR})}</CardDescription>
           </CardHeader>
           <CardContent className="flex-1 overflow-y-auto">
             {isLoadingEvents ? <Skeleton className="h-20 w-full" /> : 
              eventsForSelectedDay.length > 0 ? (
                <ul className="space-y-3">
                  {eventsForSelectedDay.map(event => (
                     <li key={event.id} className="text-sm p-2 rounded-md border-l-4" style={{borderColor: event.color.startsWith('bg-') ? `hsl(var(--${event.color.substring(3, event.color.indexOf('-'))}))` : event.color }}>
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-muted-foreground text-xs">{event.isAllDay ? "Dia todo" : `${event.startTime} - ${event.endTime}`}</p>
                        {event.location && <p className="text-muted-foreground text-xs flex items-center gap-1"><MapPin size={10}/>{event.location}</p>}
                     </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-8">Nenhum evento agendado para este dia.</p>
              )}
           </CardContent>
        </Card>
      </div>

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
          <DialogContent className={cn("sm:max-w-md border-t-4", selectedEvent.color?.replace('bg-', 'border-') || "border-primary")}>
            <DialogHeader><DialogTitle className="font-headline text-xl">{selectedEvent.title}</DialogTitle><DialogDescription>{selectedEvent.description}</DialogDescription></DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <p className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" />{selectedEvent.isAllDay ? "Dia todo" : `${formatTimeForDisplay(selectedEvent.startTime)} - ${formatTimeForDisplay(selectedEvent.endTime)}`} <span className="ml-2 text-muted-foreground">({format(parseISO(selectedEvent.date), "PPP", { locale: ptBR })})</span></p>
              {selectedEvent.location && (<p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-muted-foreground" />{selectedEvent.location}</p>)}
            </div>
            <DialogFooter>
               <Button type="button" variant="outline" onClick={() => toast({title:"Placeholder", description:"Integração com Google Agenda será implementada."})}><ExternalLink className="mr-2 h-4 w-4"/>Adicionar ao Google</Button>
              <DialogClose asChild><Button type="button">Fechar</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
