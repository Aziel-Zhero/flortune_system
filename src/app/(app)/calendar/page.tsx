"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIconLucide } from "lucide-react";
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
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  color: string;
  description?: string;
  location?: string;
  attendees?: string[];
  organizer?: string;
  date: string;
  isAllDay?: boolean;
}

const sampleBaseEvents: Omit<CalendarEvent, 'id' | 'date'>[] = [
  { title: "Pagamento Aluguel", startTime: "00:00", endTime: "23:59", color: "bg-red-600 text-white", description: "Vencimento do aluguel mensal", location: "Online", isAllDay: true },
  { title: "Salário", startTime: "00:00", endTime: "23:59", color: "bg-emerald-500 text-white", description: "Recebimento do salário", location: "Conta Bancária", isAllDay: true },
  { title: "Supermercado", startTime: "16:00", endTime: "17:30", color: "bg-yellow-500 text-white", description: "Compras da semana", location: "Mercado Local" },
  { title: "Conta de Luz", startTime: "10:00", endTime: "10:15", color: "bg-orange-500 text-white", description: "Vencimento da conta de energia elétrica", location: "App do Banco" },
  { title: "Rendimento Investimento", startTime: "09:00", endTime: "09:05", color: "bg-teal-500 text-white", description: "Crédito do rendimento mensal", location: "Corretora" },
  { title: "Consulta Médica", startTime: "08:30", endTime: "09:30", color: "bg-purple-500 text-white", description: "Check-up anual", location: "Clínica Saúde" },
];

const weekDayLabels = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const timeSlots = Array.from({ length: 17 }, (_, i) => i + 7);
const slotHeight = 60;

const getWeekDates = (refDate: Date): Date[] => {
  const start = startOfWeek(refDate, { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: endOfWeek(refDate, { weekStartsOn: 0 }) });
};

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";

  const [currentRefDate, setCurrentRefDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>(getWeekDates(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [openNewEventDialog, setOpenNewEventDialog] = useState(false);

  const assignEventsToCurrentWeek = useCallback((baseEvts: Omit<CalendarEvent, 'id' | 'date'>[], currentWeek: Date[]): CalendarEvent[] => {
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

  useEffect(() => {
    setWeekDates(getWeekDates(currentRefDate));
  }, [currentRefDate]);

  const calculateEventStyle = (startTime: string, endTime: string, isAllDay?: boolean) => {
    const timelineStartHour = timeSlots[0];
    if (isAllDay) return { top: `0px`, height: `24px`, zIndex: 10, isFullWidth: true };

    const [startH, startM] = startTime.split(":" ).map(Number);
    const [endH, endM] = endTime.split(":" ).map(Number);
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
    return Object.entries(monthCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }, [weekDates]);

  const formatTimeForDisplay = (timeStr: string) => {
    const [hour, minute] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoadingAuth || (isLoadingEvents && !!session)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Calendário Semanal" description="Carregando eventos..." icon={<CalendarIconLucide className="h-6 w-6 text-primary" />} />
        <Skeleton className="w-full h-[calc(100vh-200px)]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Calendário Semanal"
        description={`Eventos financeiros de ${currentMonthYearLabel}`}
        icon={<CalendarIconLucide className="h-6 w-6 text-primary" />}
        action={<Button onClick={() => setOpenNewEventDialog(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Evento</Button>}
      />

      <div className="flex items-center justify-between p-4">
        <Button variant="outline" size="sm" onClick={handlePrevWeek}><ChevronLeft className="h-5 w-5" /></Button>
        <span className="font-semibold text-xl">{currentMonthYearLabel}</span>
        <Button variant="outline" size="sm" onClick={handleNextWeek}><ChevronRight className="h-5 w-5" /></Button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[768px] relative">
          <div className="grid grid-cols-7 bg-muted text-sm font-medium">
            {weekDates.map((d, i) => (
              <div key={i} className="text-center py-2">
                {weekDayLabels[i]} <br /><span className="text-xs">{format(d, 'dd')}</span>
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: `${slotHeight * timeSlots.length}px` }}>
            {events.map(event => {
              const { top, height, isFullWidth } = calculateEventStyle(event.startTime, event.endTime, event.isAllDay);
              const dayColumn = getDay(parseISO(event.date));
              return (
                <div
                  key={event.id}
                  className={cn("absolute px-2 text-xs rounded shadow-md cursor-pointer", event.color)}
                  style={{ top, height, left: `${dayColumn * (100 / 7)}%`, width: `${100 / 7}%`, zIndex: 10 }}
                  onClick={() => handleEventClick(event)}>
                  {event.title}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => open || setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              <div className="mt-2">{selectedEvent?.description}</div>
              <div className="mt-2 text-xs">Local: {selectedEvent?.location}</div>
              {selectedEvent?.attendees && (
                <div className="mt-1 text-xs">Atendentes: {selectedEvent.attendees.join(", ")}</div>
              )}
              <div className="mt-2 text-xs">{formatTimeForDisplay(selectedEvent?.startTime ?? '')} - {formatTimeForDisplay(selectedEvent?.endTime ?? '')}</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline" size="sm">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openNewEventDialog} onOpenChange={setOpenNewEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
            <DialogDescription>Funcionalidade de criação de evento será implementada...</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
