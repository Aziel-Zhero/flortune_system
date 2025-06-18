
"use client"; 

import { useState, useEffect, useCallback } from "react";
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
  ListChecks
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

interface CalendarEvent {
  id: number;
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

const HOURLY_SLOT_HEIGHT = 80; // Increased height for time slots

// Sample financial events (simplified for relevance)
const sampleEvents: CalendarEvent[] = [
  { id: 1, title: "Pagamento Aluguel", startTime: "09:00", endTime: "09:30", color: "bg-red-500/80", date: "2024-08-19", description: "Vencimento do aluguel mensal", location: "Online"},
  { id: 2, title: "Salário", startTime: "00:00", endTime: "23:59", color: "bg-green-500", date: "2024-08-19", description: "Recebimento do salário", location: "Conta Bancária", isAllDay: true },
  { id: 3, title: "Supermercado", startTime: "16:00", endTime: "17:00", color: "bg-yellow-500", date: "2024-08-20", description: "Compras da semana", location: "Mercado Local"},
  { id: 4, title: "Conta de Luz", startTime: "10:00", endTime: "10:15", color: "bg-orange-500", date: "2024-08-21", description: "Vencimento da conta de energia elétrica", location: "App do Banco"},
  { id: 5, title: "Rendimento Investimento", startTime: "00:00", endTime: "23:59", color: "bg-emerald-500", date: "2024-08-22", description: "Crédito do rendimento mensal", location: "Corretora", isAllDay: true},
  { id: 6, title: "Assinatura Streaming", startTime: "11:00", endTime: "11:05", color: "bg-sky-500", date: "2024-08-23", description: "Débito da assinatura mensal", location: "Cartão de Crédito"},
];

const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (23:00)

const getWeekDates = (refDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDay = refDate.getDay(); 
  const firstDayOfWeek = new Date(refDate);
  firstDayOfWeek.setDate(refDate.getDate() - currentDay);
  firstDayOfWeek.setHours(0, 0, 0, 0); 

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    dates.push(day);
  }
  return dates;
};

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";

  const [currentRefDate, setCurrentRefDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>(() => getWeekDates(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]); 
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const assignEventsToCurrentWeek = useCallback((baseEvents: CalendarEvent[], currentWeekDates: Date[]) => {
    return baseEvents.map((event, index) => {
      // Distribute sample events somewhat realistically across the current week for demo
      // This logic ensures the 'date' property of sample events matches a date in the current week view.
      const dayOfWeekForEvent = new Date(event.date + "T00:00:00Z").getUTCDay(); // Original day of week
      let targetDate = currentWeekDates[dayOfWeekForEvent];
      
      // If the original event date's month/year is different from current week's,
      // try to place it on a similar day of week but within the current view.
      // This is a simplified demo logic. A real app would fetch events for the current date range.
      if (!targetDate || new Date(event.date).getUTCMonth() !== targetDate.getUTCMonth()) {
         targetDate = currentWeekDates[index % 7]; // Fallback to distribute across week
      }

      return {
        ...event,
        date: targetDate.toISOString().split('T')[0],
      };
    });
  }, []);

  useEffect(() => {
    document.title = `Calendário Financeiro - ${APP_NAME}`;
    setIsLoadingEvents(true);
    // Simulate fetching events for the current weekDates
    setTimeout(() => {
      setEvents(assignEventsToCurrentWeek(sampleEvents, weekDates));
      setIsLoadingEvents(false);
    }, 500); 
  }, [weekDates, assignEventsToCurrentWeek]);


  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleNextWeek = () => {
    const nextWeekDate = new Date(currentRefDate);
    nextWeekDate.setDate(currentRefDate.getDate() + 7);
    setCurrentRefDate(nextWeekDate);
    setWeekDates(getWeekDates(nextWeekDate));
  };

  const handlePrevWeek = () => {
    const prevWeekDate = new Date(currentRefDate);
    prevWeekDate.setDate(currentRefDate.getDate() - 7);
    setCurrentRefDate(prevWeekDate);
    setWeekDates(getWeekDates(prevWeekDate));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentRefDate(today);
    setWeekDates(getWeekDates(today));
  };

  const calculateEventStyle = (startTime: string, endTime: string, isAllDay?: boolean) => {
    if (isAllDay) {
      // All-day events have a fixed height bar at the top of the day column
      return { top: `0px`, height: `28px`, zIndex: 10 }; 
    }
    const startHour = parseInt(startTime.split(":")[0]);
    const startMinute = parseInt(startTime.split(":")[1]);
    const endHour = parseInt(endTime.split(":")[0]);
    const endMinute = parseInt(endTime.split(":")[1]);

    // Calculate position based on 7 AM start and HOURLY_SLOT_HEIGHT
    const topOffset = ((startHour - 7 + startMinute / 60) * HOURLY_SLOT_HEIGHT); 
    
    const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    // Scale event height: (duration in hours) * HOURLY_SLOT_HEIGHT
    const height = (durationMinutes / 60 * HOURLY_SLOT_HEIGHT); 

    return { top: `${topOffset}px`, height: `${Math.max(height, 20)}px`, zIndex: 10 }; // Min height 20px
  };

  const currentMonthYear = weekDates[0] 
    ? weekDates[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  const formatTime = (timeStr: string) => {
    if (!timeStr || timeStr.split(':').length !== 2) return '';
    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (isLoadingAuth || (isLoadingEvents && session)) { // Show skeleton if auth is loading OR (events loading AND session exists)
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Calendário Financeiro" description="Carregando eventos..." />
        <div className="flex-1 p-4">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Calendário Financeiro"
        description={currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)}
        icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>Hoje</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button size="sm" onClick={() => alert("Funcionalidade Adicionar Evento (placeholder)")}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Evento
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-hidden border bg-card rounded-lg shadow-sm flex flex-col">
        {/* Cabeçalho da Semana */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-card z-20">
          <div className="p-2 text-center text-xs text-muted-foreground border-r"></div> {/* Canto para horários */}
          {weekDates.map((date, i) => (
            <div key={i} className={cn("p-3 text-center border-r", i === 6 && "border-r-0")}> {/* Increased padding */}
              <div className="text-sm text-muted-foreground font-medium">{weekDays[date.getDay()]}</div>
              <div
                className={cn(
                  "text-2xl font-semibold mt-1", // Slightly larger date number
                  date.toDateString() === new Date().toDateString() ? "text-primary" : "text-foreground"
                )}
              >
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de Horários e Eventos */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Labels de Horário */}
            <div className="text-muted-foreground">
              {timeSlots.map((time, i) => (
                <div key={i} className="pr-2 text-right text-xs pt-1 flex items-start justify-end border-r" style={{ height: `${HOURLY_SLOT_HEIGHT}px` }}>
                  <span className="mt-[-4px]"> {/* Adjust for better vertical alignment with lines */}
                    {time > 12 ? `${time - 12} PM` : `${time} AM`}
                  </span>
                </div>
              ))}
            </div>

            {/* Colunas dos Dias */}
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className={cn("relative border-r", dayIndex === 6 && "border-r-0")}>
                {/* Linhas de Horário */}
                {timeSlots.map((_, timeIndex) => (
                  <div key={timeIndex} className="border-b" style={{ height: `${HOURLY_SLOT_HEIGHT}px` }}></div>
                ))}

                {/* Eventos All-Day - container for these events, appears above the timed grid */}
                 <div className="absolute top-0 left-0 right-0 z-10 p-1 space-y-0.5 border-b">
                  {events
                    .filter(event => new Date(event.date + "T00:00:00Z").toDateString() === date.toDateString() && event.isAllDay)
                    .map((event) => {
                      const eventStyle = calculateEventStyle(event.startTime, event.endTime, event.isAllDay);
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "rounded p-1 text-white text-xs shadow-md cursor-pointer overflow-hidden mr-1 flex items-center",
                            event.color
                          )}
                          style={{ height: eventStyle.height, zIndex: eventStyle.zIndex }} // Height here is fixed (28px)
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                        </div>
                      );
                  })}
                </div>
                
                {/* Eventos com Horário Específico - events are positioned absolutely within this container */}
                <div className="absolute top-0 left-0 right-0 bottom-0 mt-[32px]"> {/* Margin top to account for all-day event bar area */}
                  {events
                    .filter(event => new Date(event.date + "T00:00:00Z").toDateString() === date.toDateString() && !event.isAllDay)
                    .map((event) => {
                      const eventStyle = calculateEventStyle(event.startTime, event.endTime, event.isAllDay);
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute rounded p-1.5 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg overflow-hidden",
                            event.color
                          )}
                          style={{ ...eventStyle, left: "4px", right: "4px"}}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="opacity-80 text-[10px] truncate">{`${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}</div>
                        </div>
                      );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Evento */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(isOpen) => !isOpen && setSelectedEvent(null)}>
          <DialogContent className={cn("sm:max-w-md", selectedEvent.color.replace('bg-', 'border-') + "/50 border-2")}>
            <DialogHeader>
              <DialogTitle className={cn("font-headline text-xl", selectedEvent.color.replace('bg-', 'text-'))}>
                {selectedEvent.title}
              </DialogTitle>
              {selectedEvent.description && (
                <DialogDescription>{selectedEvent.description}</DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <p className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {selectedEvent.isAllDay ? "Dia todo" : `${formatTime(selectedEvent.startTime)} - ${formatTime(selectedEvent.endTime)}`}
                <span className="ml-2 text-muted-foreground">({new Date(selectedEvent.date + "T00:00:00Z").toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })})</span>
              </p>
              {selectedEvent.location && (
                <p className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {selectedEvent.location}
                </p>
              )}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <p className="flex items-start">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    <strong className="text-foreground/80">Participantes:</strong>
                    <br />
                    {selectedEvent.attendees.join(", ")}
                  </span>
                </p>
              )}
              {selectedEvent.organizer && (
                <p>
                  <strong className="text-foreground/80">Organizador:</strong> {selectedEvent.organizer}
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
               <Button type="button" variant="default" onClick={() => alert("Funcionalidade Editar Evento (placeholder)")}>
                  Editar
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
