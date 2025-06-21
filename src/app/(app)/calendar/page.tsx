
// src/app/(app)/calendar/page.tsx
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
  ExternalLink,
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
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isToday as fnsIsToday,
  getDay,
  set,
} from "date-fns";
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

const sampleBaseEvents: Omit<CalendarEvent, "id" | "date">[] = [
  {
    title: "Pagamento Aluguel",
    startTime: "00:00",
    endTime: "23:59",
    color: "bg-destructive/80 text-destructive-foreground",
    description: "Vencimento do aluguel mensal",
    location: "Online",
    isAllDay: true,
  },
  {
    title: "Salário",
    startTime: "00:00",
    endTime: "23:59",
    color: "bg-primary text-primary-foreground",
    description: "Recebimento do salário",
    location: "Conta Bancária",
    isAllDay: true,
  },
  {
    title: "Supermercado",
    startTime: "16:00",
    endTime: "17:30",
    color: "bg-accent text-accent-foreground",
    description: "Compras da semana",
    location: "Mercado Local",
  },
  {
    title: "Conta de Luz",
    startTime: "10:00",
    endTime: "10:15",
    color: "bg-amber-500 text-white",
    description: "Vencimento da conta de energia elétrica",
    location: "App do Banco",
  },
  {
    title: "Rendimento Investimento",
    startTime: "09:00",
    endTime: "09:05",
    color: "bg-emerald-500 text-white",
    description: "Crédito do rendimento mensal",
    location: "Corretora",
  },
  {
    title: "Assinatura Streaming",
    startTime: "11:00",
    endTime: "11:05",
    color: "bg-sky-500 text-white",
    description: "Débito da assinatura mensal",
    location: "Cartão de Crédito",
  },
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

  // Função para distribuir eventos de exemplo pela semana atual
  const assignEventsToCurrentWeek = useCallback(
    (baseEvts: Omit<CalendarEvent, "id" | "date">[], currentWeek: Date[]): CalendarEvent[] => {
      return baseEvts.map((eventBase, index) => {
        // Distribui os eventos pelos dias da semana, ciclicamente
        const dayIndex = (index * 2) % currentWeek.length;
        const targetDate = currentWeek[dayIndex];
        return {
          ...eventBase,
          id: `evt_sample_${targetDate.toISOString().split("T")[0]}_${index}`,
          date: targetDate.toISOString().split("T")[0],
        };
      });
    },
    []
  );

  useEffect(() => {
    document.title = `Calendário Semanal - ${APP_NAME}`;
    setIsLoadingEvents(true);
    // Simula o carregamento e atribuição de eventos à semana atual
    const simulatedFetchedEvents = assignEventsToCurrentWeek(sampleBaseEvents, weekDates);
    setEvents(simulatedFetchedEvents);
    setIsLoadingEvents(false);
  }, [weekDates, assignEventsToCurrentWeek]);

  const handleEventClick = (event: CalendarEvent) => setSelectedEvent(event);
  const handleNextWeek = () => setCurrentRefDate((prev) => addDays(prev, 7));
  const handlePrevWeek = () => setCurrentRefDate((prev) => subDays(prev, -7));
  const handleToday = () => setCurrentRefDate(new Date());

  useEffect(() => {
    setWeekDates(getWeekDates(currentRefDate));
  }, [currentRefDate]);

  const calculateEventStyle = (startTime: string, endTime: string, isAllDay?: boolean) => {
    const timelineStartHour = timeSlots[0]; // Ex: 7

    if (isAllDay) {
      return { top: `0px`, height: `24px`, zIndex: 10, isFullWidth: true };
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const topPosition = (startH - timelineStartHour + startM / 60) * slotHeight;
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
    let eventHeight = (durationMinutes / 60) * slotHeight;

    if (eventHeight < 20) eventHeight = 20; // Minimum height for visibility

    return { top: `${topPosition}px`, height: `${eventHeight}px`, zIndex: 10, isFullWidth: false };
  };

  const currentMonthYearLabel = useMemo(() => {
    // Mostra o mês da maioria dos dias da semana ou o mês do primeiro dia
    const monthCounts: Record<string, number> = {};
    weekDates.forEach((d) => {
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
    if (!timeStr || timeStr.split(":").length !== 2) return "";
    const [hour, minute] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoadingAuth || (isLoadingEvents && !!session)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Calendário Semanal"
          description="Carregando eventos..."
          icon={<CalendarIconLucide className="h-6 w-6 text-primary" />}
        />
        <Skeleton className="w-full h-[calc(100vh-200px)] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Calendário Financeiro"
        description={currentMonthYearLabel}
        icon={<CalendarIconLucide className="h-6 w-6 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevWeek} aria-label="Semana anterior">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek} aria-label="Próxima semana">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button size="sm" onClick={() => toast({ title: "Funcionalidade Futura", description: "A criação de eventos será implementada futuramente." })}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Evento
            </Button>
          </div>
        }
      />

      <div className="flex-1 grid grid-cols-[60px_repeat(7,1fr)] border bg-card rounded-lg shadow-sm overflow-hidden">
        {/* Static Header for Weekdays */}
        <div className="col-span-1 row-span-1 border-r border-b p-2 text-xs text-muted-foreground sticky top-0 bg-card z-20"></div>{" "}
        {/* Top-left corner */}
        {weekDates.map((date, i) => (
          <div
            key={`header-${i}`}
            className={cn("row-span-1 p-2 text-center border-b sticky top-0 bg-card z-20", i < 6 && "border-r")}
          >
            <div className="text-xs text-muted-foreground font-medium">{weekDayLabels[getDay(date)]}</div>
            <div className={cn("text-xl font-semibold mt-1", fnsIsToday(date) ? "text-primary" : "text-foreground")}>
              {format(date, "d")}
            </div>
          </div>
        ))}

        {/* Scrollable area for times and events */}
        <div className="col-start-1 col-span-8 row-start-2 overflow-y-auto relative">
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            {/* Time Gutter Column */}
            <div className="col-start-1 col-span-1 row-start-1 sticky left-0 bg-card z-10">
              {timeSlots.map((hour, hourIndex) => (
                <div
                  key={`timeslot-label-${hour}`}
                  className={cn(
                    "h-[60px] border-r text-right pr-2 text-xs pt-1 text-muted-foreground relative -top-[8px]",
                    hourIndex < timeSlots.length - 1 && "border-b"
                  )}
                >
                  <span>{hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</span>
                </div>
              ))}
            </div>

            {/* Event Grid Columns */}
            {weekDates.map((date, dayIndex) => (
              <div
                key={`day-col-${dayIndex}`}
                className={cn(
                  `col-start-${dayIndex + 2} col-span-1 row-start-1 relative`,
                  dayIndex < 6 && "border-r"
                )}
              >
                {/* Background Lines */}
                {timeSlots.map((hour, hourIndex) => (
                  <div
                    key={`line-${dayIndex}-${hour}`}
                    className={cn("h-[60px]", hourIndex < timeSlots.length - 1 && "border-b")}
                  ></div>
                ))}

                {/* Container for All-Day events */}
                <div className="absolute top-0 left-0 right-0 p-0.5 space-y-0.5 z-10 border-b-2 border-dashed mb-2">
                  {events
                    .filter((event) => isSameDay(parseISO(event.date), date) && event.isAllDay)
                    .slice(0, 1) // Limit to 1 all-day event for simplicity
                    .map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "rounded p-1 text-white text-[10px] shadow-sm cursor-pointer overflow-hidden mr-1 flex items-center",
                          event.color
                        )}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                      </div>
                    ))}
                </div>

                {/* Container for timed events */}
                <div className="absolute top-0 left-0 right-0 pt-[30px]">
                  {" "}
                  {/* pt-[30px] para deixar espaço para os eventos all-day */}
                  {events
                    .filter((event) => isSameDay(parseISO(event.date), date) && !event.isAllDay)
                    .map((event) => {
                      const style = calculateEventStyle(event.startTime, event.endTime);
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute rounded p-1.5 text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg overflow-hidden",
                            event.color
                          )}
                          style={{ ...style, left: "2px", right: "2px" }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="opacity-80 text-[10px] truncate">{`${formatTimeForDisplay(
                            event.startTime
                          )} - ${formatTimeForDisplay(event.endTime)}`}</div>
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
          <DialogContent
            className={cn(
              "sm:max-w-md",
              selectedEvent.color?.replace("bg-", "border-t-4 border-") || "border-t-4 border-primary"
            )}
          >
            <DialogHeader>
              <DialogTitle
                className={cn(
                  "font-headline text-xl",
                  selectedEvent.color?.includes("text-")
                    ? selectedEvent.color.split(" ").find((c) => c.startsWith("text-"))
                    : "text-primary"
                )}
              >
                {selectedEvent.title}
              </DialogTitle>
              {selectedEvent.description && <DialogDescription>{selectedEvent.description}</DialogDescription>}
            </DialogHeader>
            <div className="space-y-3 py-4 text-sm">
              <p className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {selectedEvent.isAllDay
                  ? "Dia todo"
                  : `${formatTimeForDisplay(selectedEvent.startTime)} - ${formatTimeForDisplay(selectedEvent.endTime)}`}
                <span className="ml-2 text-muted-foreground">
                  ({format(parseISO(selectedEvent.date), "PPP", { locale: ptBR })})
                </span>
              </p>
              {selectedEvent.location && (
                <p className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {selectedEvent.location}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => toast({ title: "Placeholder", description: "A integração com o Google Agenda será implementada." })}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Adicionar ao Google
              </Button>
              <DialogClose asChild>
                <Button type="button">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
