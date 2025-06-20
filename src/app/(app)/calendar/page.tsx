
"use client"; 

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIconLucide, 
  Filter,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, getDate, getDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string; // Changed to string for potential UUIDs later
  title: string;
  date: string; // YYYY-MM-DD
  color?: string; // e.g., "bg-blue-500 text-white"
  startTime?: string; // HH:MM for non-all-day events
  endTime?: string;   // HH:MM for non-all-day events
  isAllDay?: boolean;
  type?: "help-needed" | "needs-met" | "occasion"; // For filtering
}

// Sample financial events - enriched
const sampleEvents: CalendarEvent[] = [
  { id: "evt1", title: "Pagar Aluguel", date: "2024-07-05", color: "bg-red-500 text-white", type: "needs-met", isAllDay: true },
  { id: "evt2", title: "Salário", date: "2024-07-01", color: "bg-green-500 text-white", type: "needs-met", isAllDay: true },
  { id: "evt3", title: "Supermercado", date: "2024-07-10", startTime: "16:00", endTime: "17:00", color: "bg-yellow-500 text-yellow-900", type: "help-needed" },
  { id: "evt4", title: "Aniversário da Mãe", date: "2024-07-15", color: "bg-pink-500 text-white", type: "occasion", isAllDay: true},
  { id: "evt5", title: "Conta de Luz", date: "2024-07-20", color: "bg-orange-500 text-white", type: "needs-met", isAllDay: true },
  { id: "evt6", title: "Reunião Flortune", date: "2024-07-22", startTime: "10:00", endTime: "11:30", color: "bg-blue-500 text-white", type: "help-needed" },
];


export default function CalendarPage() {
  const { data: session, status } = useSession();
  const isLoadingAuth = status === "loading";

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true); // Placeholder for actual event fetching

  // Filter states (UI only for now)
  const [filterHelpNeeded, setFilterHelpNeeded] = useState(true);
  const [filterNeedsMet, setFilterNeedsMet] = useState(true);
  const [filterOccasions, setFilterOccasions] = useState(true);
  const [eventSearch, setEventSearch] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined);


  useEffect(() => {
    document.title = `Calendário - ${APP_NAME}`;
    // Simulate fetching events for the current month
    setIsLoadingEvents(true);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // In a real app, you'd fetch events for this range
    const currentMonthEvents = sampleEvents.filter(event => {
        const eventDate = parseISO(event.date);
        return eventDate >= monthStart && eventDate <= monthEnd;
    });
    setEvents(currentMonthEvents);
    setTimeout(() => setIsLoadingEvents(false), 300); // Simulate delay
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const daysInMonthGrid = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (isLoadingAuth || (isLoadingEvents && !!session)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Calendário" description="Carregando eventos..." icon={<CalendarIconLucide/>}/>
        <Skeleton className="w-full h-[600px] rounded-lg" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Calendário"
        description={format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        icon={<CalendarIconLucide className="h-6 w-6 text-primary"/>}
        actions={
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => alert("Visualização Dia (Placeholder)")}>Dia</Button>
            <Button variant="outline" size="sm" onClick={() => alert("Visualização Semana (Placeholder)")}>Semana</Button>
            <Button variant="default" size="sm">Mês</Button>
            <Button variant="outline" size="sm" onClick={() => alert("Visualização Ano (Placeholder)")}>Ano</Button>
            <Button variant="outline" size="sm" onClick={handleToday} className="ml-2">Hoje</Button>
            <Button size="sm" onClick={() => alert("Criar Evento (Placeholder)")} className="ml-auto sm:ml-2">
              <Plus className="mr-1.5 h-4 w-4" /> Criar Evento
            </Button>
          </div>
        }
      />
      
      <div className="flex flex-1 gap-4 overflow-hidden mt-2">
        {/* Main Calendar Grid */}
        <div className="flex-1 flex flex-col bg-card border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Mês anterior">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold font-headline">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Próximo mês">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 border-b">
            {weekDays.map(day => (
              <div key={day} className="py-2 px-1 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 grid-rows-6 flex-1 overflow-y-auto">
            {daysInMonthGrid.map((day, index) => {
              const eventsForDay = events.filter(event => isSameDay(parseISO(event.date), day));
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "p-1.5 border-r border-b text-xs min-h-[80px] sm:min-h-[100px] flex flex-col",
                    !isSameMonth(day, currentMonth) && "bg-muted/30 text-muted-foreground/60",
                    isSameDay(day, new Date()) && "bg-primary/10",
                    index % 7 === 6 && "border-r-0" // No right border for last column
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className={cn("font-medium", isSameDay(day, selectedDate) && "text-primary font-bold")}>
                    {getDate(day)}
                  </span>
                  <div className="mt-1 space-y-0.5 flex-grow overflow-y-auto text-[10px] sm:text-xs">
                    {eventsForDay.slice(0, 2).map(event => ( // Show max 2 events initially
                      <div key={event.id} className={cn("p-0.5 rounded-sm truncate", event.color || "bg-blue-100 text-blue-800")}>
                        {event.title}
                      </div>
                    ))}
                    {eventsForDay.length > 2 && (
                      <div className="text-muted-foreground text-[9px] sm:text-[10px] cursor-pointer hover:underline">
                        + {eventsForDay.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar Panel */}
        <Card className="hidden md:flex md:flex-col w-full max-w-xs lg:max-w-sm shadow-sm overflow-y-auto">
          <CardHeader className="p-4 border-b">
            <div className="h-24 bg-primary/10 rounded-md flex flex-col items-center justify-center text-center p-2">
              <p className="text-sm text-primary/80">{format(selectedDate, "eeee", { locale: ptBR })}</p>
              <p className="text-3xl font-bold text-primary">{format(selectedDate, "dd", { locale: ptBR })}</p>
              <p className="text-sm text-primary/80">{format(selectedDate, "MMMM, yyyy", { locale: ptBR })}</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Intervalo de Datas</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="date" className="text-xs p-1.5 h-8" value={dateRangeStart ? format(dateRangeStart, 'yyyy-MM-dd') : ''} onChange={e => setDateRangeStart(e.target.value ? parseISO(e.target.value) : undefined)} />
                <span className="text-muted-foreground">-</span>
                <Input type="date" className="text-xs p-1.5 h-8" value={dateRangeEnd ? format(dateRangeEnd, 'yyyy-MM-dd') : ''} onChange={e => setDateRangeEnd(e.target.value ? parseISO(e.target.value) : undefined)} />
                <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={() => alert("Filtrar por Data (Placeholder)")}>Ir</Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium flex items-center"><Filter className="h-3.5 w-3.5 mr-1.5"/>Filtros</Label>
              <div className="space-y-1.5 mt-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox id="filterHelp" checked={filterHelpNeeded} onCheckedChange={(checked) => setFilterHelpNeeded(Boolean(checked))} />
                  <Label htmlFor="filterHelp" className="font-normal text-muted-foreground">Ajuda Necessária</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="filterMet" checked={filterNeedsMet} onCheckedChange={(checked) => setFilterNeedsMet(Boolean(checked))} />
                  <Label htmlFor="filterMet" className="font-normal text-muted-foreground">Necessidades Atendidas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="filterOccasions" checked={filterOccasions} onCheckedChange={(checked) => setFilterOccasions(Boolean(checked))} />
                  <Label htmlFor="filterOccasions" className="font-normal text-muted-foreground">Ocasiões</Label>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="eventSearch" className="text-sm font-medium flex items-center"><Search className="h-3.5 w-3.5 mr-1.5"/>Buscar Evento</Label>
              <Input id="eventSearch" placeholder="Buscar por nome..." className="mt-1 h-9" value={eventSearch} onChange={e => setEventSearch(e.target.value)}/>
            </div>
            <CardDescription className="text-xs text-center text-muted-foreground pt-2">
              A lógica de filtragem e busca será implementada futuramente.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
