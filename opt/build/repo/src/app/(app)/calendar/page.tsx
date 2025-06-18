
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
  Calendar as CalendarIconLucide, // Renomeado para evitar conflito
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

const sampleEvents: CalendarEvent[] = [
  { id: 1, title: "Supermercado Semanal", startTime: "09:00", endTime: "10:00", color: "bg-accent", date: "2024-08-19", description: "Compra de mantimentos", location: "Mercado Local"},
  { id: 2, title: "Pagamento Aluguel", startTime: "10:00", endTime: "10:30", color: "bg-destructive/70", date: "2024-08-19", description: "Vencimento do aluguel mensal", location: "Online"},
  { id: 3, title: "Salário", startTime: "00:00", endTime: "23:59", color: "bg-primary", date: "2024-08-19", description: "Recebimento do salário", location: "Conta Bancária", isAllDay: true },
  { id: 4, title: "Consulta Dentista", startTime: "14:00", endTime: "15:00", color: "bg-secondary", date: "2024-08-21", description: "Check-up anual", location: "Clínica Sorriso"},
  { id: 5, title: "Aniversário da Flora", startTime: "19:00", endTime: "22:00", color: "bg-pink-500", date: "2024-08-23", description: "Jantar de comemoração", location: "Restaurante Flor & Sabor"},
];

const weekDays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (23:00)

const getWeekDates = (refDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDay = refDate.getDay(); 
  const firstDayOfWeek = new Date(refDate);
  firstDayOfWeek.setDate(refDate.getDate() - currentDay);
  firstDayOfWeek.setHours(0, 0, 0, 0); // Normalizar para o início do dia

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
    // Para demonstração, vamos distribuir os eventos de exemplo ao longo da semana atual.
    // Em um app real, você buscaria os eventos para o intervalo de datas visível.
    return baseEvents.map((event, index) => {
      const dayOfWeekIndex = index % 7; // Distribui os eventos
      const targetDate = new Date(currentWeekDates[dayOfWeekIndex]);
      return {
        ...event,
        date: targetDate.toISOString().split('T')[0],
      };
    });
  }, []);

  useEffect(() => {
    document.title = `Calendário Financeiro - ${APP_NAME}`;
    setIsLoadingEvents(true);
    // Simula o fetch de eventos para a semana atual
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
      return { top: `0px`, height: `28px`, zIndex: 10 }; // Altura reduzida para all-day
    }
    const startHour = parseInt(startTime.split(":")[0]);
    const startMinute = parseInt(startTime.split(":")[1]);
    const endHour = parseInt(endTime.split(":")[0]);
    const endMinute = parseInt(endTime.split(":")[1]);

    // Grid de horários começa às 7h
    const topOffset = ((startHour - 7 + startMinute / 60) * 60); // 60px por hora
    const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const height = (durationMinutes); // 1px por minuto

    return { top: `${topOffset}px`, height: `${Math.max(height, 20)}px`, zIndex: 10 }; // Altura mínima de 20px
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


  if (isLoadingAuth || isLoadingEvents) {
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
    <div className="flex flex-col h-full overflow-hidden"> {/* Garante que ocupe a altura */}
      <PageHeader
        title="Calendário Financeiro"
        description={currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)}
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
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-card z-20"> {/* Aumentado o espaço para horários */}
          <div className="p-2 text-center text-xs text-muted-foreground border-r"></div> {/* Canto para horários */}
          {weekDates.map((date, i) => (
            <div key={i} className={cn("p-2 text-center border-r", i === 6 && "border-r-0")}>
              <div className="text-xs text-muted-foreground font-medium">{weekDays[date.getDay()]}</div>
              <div
                className={cn(
                  "text-xl font-semibold mt-1",
                  date.toDateString() === new Date().toDateString() ? "text-primary" : "text-foreground"
                )}
              >
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de Horários e Eventos */}
        <div className="flex-1 overflow-y-auto relative"> {/* Adicionado relative aqui */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)]"> {/* Aumentado o espaço para horários */}
            {/* Labels de Horário */}
            <div className="text-muted-foreground">
              {timeSlots.map((time, i) => (
                <div key={i} className="h-[60px] border-b border-r pr-2 text-right text-xs pt-1 flex items-start justify-end"> {/* Flex para alinhar */}
                  <span>{time > 12 ? `${time - 12} PM` : `${time} AM`}</span>
                </div>
              ))}
            </div>

            {/* Colunas dos Dias */}
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className={cn("relative border-r", dayIndex === 6 && "border-r-0")}>
                {/* Linhas de Horário */}
                {timeSlots.map((_, timeIndex) => (
                  <div key={timeIndex} className="h-[60px] border-b"></div>
                ))}

                {/* Eventos All-Day (acima das linhas de horário) */}
                 <div className="absolute top-0 left-0 right-0 z-10 p-1 space-y-0.5">
                  {events
                    .filter(event => new Date(event.date + "T00:00:00").toDateString() === date.toDateString() && event.isAllDay)
                    .map((event) => {
                      const eventStyle = calculateEventStyle(event.startTime, event.endTime, event.isAllDay);
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "rounded p-1 text-white text-xs shadow-md cursor-pointer overflow-hidden mr-1 flex items-center",
                            event.color
                          )}
                          style={{ height: eventStyle.height, zIndex: eventStyle.zIndex }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                        </div>
                      );
                  })}
                </div>
                
                {/* Eventos com Horário Específico */}
                <div className="absolute top-0 left-0 right-0 bottom-0 mt-[30px]"> {/* Adicionado mt para eventos não all-day */}
                  {events
                    .filter(event => new Date(event.date + "T00:00:00").toDateString() === date.toDateString() && !event.isAllDay)
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
                <span className="ml-2 text-muted-foreground">({new Date(selectedEvent.date + "T00:00:00").toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })})</span>
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

    