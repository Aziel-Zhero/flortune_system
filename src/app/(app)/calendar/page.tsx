// src/app/(app)/calendar/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ptBR } from "date-fns/locale";
import type { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar as CalendarIconLucide,
  Plus,
  Trash2,
  Tag,
  CreditCard,
  DollarSign,
  Info,
  Circle
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { format, parseISO, startOfMonth, endOfMonth, isEqual } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  extendedProps: {
    type: 'lembrete' | 'pagamento' | 'recebimento' | 'evento';
    description?: string;
    source: 'manual' | 'transaction';
  };
}

const eventTypes = [
  { value: "evento", label: "Evento", icon: Info, color: "hsl(var(--chart-3))" },
  { value: "lembrete", label: "Lembrete", icon: Tag, color: "hsl(var(--chart-2))" },
  { value: "pagamento", label: "Pagamento", icon: CreditCard, color: "hsl(var(--destructive))" },
  { value: "recebimento", label: "Recebimento", icon: DollarSign, color: "hsl(var(--primary))" },
];

const getEventTypeConfig = (typeValue: string) => {
  return eventTypes.find(t => t.value === typeValue) || eventTypes[0];
};


// --- MOCK DATA ---
const sampleEvents: CalendarEvent[] = [
    { id: 'tx-1', title: 'Salário', start: '2024-07-01', allDay: true, extendedProps: { type: 'recebimento', description: 'R$ 7.500,00 - Salário', source: 'transaction' }, backgroundColor: getEventTypeConfig('recebimento').color, borderColor: getEventTypeConfig('recebimento').color },
    { id: 'tx-2', title: 'Aluguel', start: '2024-07-05', allDay: true, extendedProps: { type: 'pagamento', description: 'R$ 1.800,00 - Moradia', source: 'transaction' }, backgroundColor: getEventTypeConfig('pagamento').color, borderColor: getEventTypeConfig('pagamento').color },
    { id: 'manual-1', title: 'Reunião de Equipe', start: '2024-07-10T14:00:00', end: '2024-07-10T15:00:00', allDay: false, extendedProps: { type: 'evento', description: 'Discussão do projeto X', source: 'manual' }, backgroundColor: getEventTypeConfig('evento').color, borderColor: getEventTypeConfig('evento').color },
    { id: 'manual-2', title: 'Pagar fatura do cartão', start: '2024-07-15', allDay: true, extendedProps: { type: 'lembrete', description: 'Cartão final 1234', source: 'manual' }, backgroundColor: getEventTypeConfig('lembrete').color, borderColor: getEventTypeConfig('lembrete').color },
];
// --- END MOCK DATA ---

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
  const [isLoading, setIsLoading] = useState(false); // Changed to false as we use mock data
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({});
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  useEffect(() => {
    // Carregar eventos manuais do localStorage se existirem
    try {
        const storedManualEvents = JSON.parse(localStorage.getItem('flortune-manual-events') || '[]');
        // Combina os mocks com os eventos salvos, evitando duplicatas
        const combined = [...sampleEvents.filter(se => !storedManualEvents.some((me: CalendarEvent) => me.id === se.id)), ...storedManualEvents];
        setEvents(combined);
    } catch (e) {
        console.error("Failed to load manual events from localStorage", e);
        setEvents(sampleEvents); // Fallback to mock data
    }
  }, []);

  useEffect(() => {
    document.title = `Calendário Financeiro - ${APP_NAME}`;
  }, []);
  
  const manualEvents = useMemo(() => events.filter(e => e.extendedProps.source === 'manual'), [events]);
  useEffect(() => {
    // Salva apenas os eventos manuais no localStorage
    localStorage.setItem('flortune-manual-events', JSON.stringify(manualEvents));
  }, [manualEvents]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event as unknown as CalendarEvent);
  }, []);

  const handleDateClick = useCallback((arg: { date: Date, allDay: boolean, jsEvent: UIEvent }) => {
    setSelectedDay(arg.date);
  }, []);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setFormData({ start: selectInfo.startStr, end: selectInfo.endStr, allDay: selectInfo.allDay, extendedProps: { type: 'evento', source: 'manual' }});
    setIsFormOpen(true);
  }, []);
  
  const handleFormSave = () => {
    if(!formData.title) {
        toast({ title: "Título obrigatório", description: "Por favor, insira um título para o evento.", variant: "destructive" });
        return;
    }
    const eventType = formData.extendedProps?.type || 'evento';
    const newEvent: CalendarEvent = {
        id: formData.id || `evt_${Date.now()}`,
        title: formData.title,
        start: formData.start!,
        end: formData.end,
        allDay: formData.allDay || false,
        extendedProps: {
            type: eventType,
            description: formData.extendedProps?.description || '',
            source: 'manual',
        },
        backgroundColor: getEventTypeConfig(eventType).color,
        borderColor: getEventTypeConfig(eventType).color,
    };

    setEvents(prev => {
        const otherEvents = prev.filter(e => e.id !== newEvent.id);
        return [...otherEvents, newEvent];
    });

    toast({ title: formData.id ? "Evento Atualizado!" : "Evento Criado!" });
    setIsFormOpen(false);
    setFormData({});
  }

  const handleDeleteEvent = () => {
    if(selectedEvent) {
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
      toast({ title: "Evento Deletado!", variant: "destructive" });
      setSelectedEvent(null);
    }
  }
  
  const eventsForSidebar = useMemo(() => {
    const start = startOfMonth(selectedDay || currentDate);
    const end = endOfMonth(selectedDay || currentDate);
    
    return events
        .filter(e => {
            if (!e.start) return false;
            const eventStart = parseISO(e.start as string);
            if (selectedDay) return isEqual(eventStart, selectedDay);
            return eventStart >= start && eventStart <= end;
        })
        .sort((a,b) => new Date(a.start as string).getTime() - new Date(b.start as string).getTime());
  }, [events, currentDate, selectedDay]);

  return (
    <div className="flex flex-col md:flex-row h-full gap-6">
      <div className="flex-1 flex flex-col min-h-[70vh] md:min-h-0">
        <PageHeader
          title="Calendário Financeiro"
          description="Visualize e gerencie seus eventos de forma interativa."
          icon={<CalendarIconLucide className="h-6 w-6 text-primary" />}
        />
        <div className="flex-1 p-1 -m-1 bg-card border rounded-lg shadow-sm overflow-hidden">
            {isLoading ? (
                <div className="p-4 space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-[500px] w-full" />
                </div>
            ) : (
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
                    initialView="dayGridMonth"
                    locale={ptBR}
                    weekends={true}
                    events={events}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    eventClick={handleEventClick}
                    select={handleDateSelect}
                    dateClick={handleDateClick}
                    datesSet={(arg) => setCurrentDate(arg.view.currentStart)}
                    height="100%"
                    buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
                    slotLabelFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false, hour12: false }}
                />
            )}
        </div>
      </div>
      <Card className="w-full md:w-80 lg:w-96 flex flex-col shadow-sm">
        <CardHeader>
            <CardTitle className="font-headline text-lg">
                {selectedDay ? `Eventos de ${format(selectedDay, "d 'de' MMMM", {locale: ptBR})}` : `Eventos de ${format(currentDate, "MMMM", {locale: ptBR})}`}
            </CardTitle>
            {selectedDay && <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setSelectedDay(null)}>Ver mês inteiro</Button>}
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                {eventsForSidebar.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento neste período.</p> : eventsForSidebar.map(event => {
                    const eventConfig = getEventTypeConfig(event.extendedProps.type);
                    return(
                        <div key={event.id} className="flex items-start gap-3 p-2 rounded-md border-l-4" style={{borderColor: eventConfig.color}}>
                            <div className="mt-1"><eventConfig.icon className="h-4 w-4" style={{color: eventConfig.color}}/></div>
                            <div>
                                <p className="font-semibold text-sm">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{event.extendedProps.description}</p>
                                <p className="text-xs text-muted-foreground/80">{event.start ? format(parseISO(event.start as string), "dd/MM/yy") : 'Data indefinida'}</p>
                            </div>
                        </div>
                    );
                })}
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter>
            <Button className="w-full" onClick={() => { setFormData({ start: new Date().toISOString().split('T')[0], allDay: true, extendedProps: { type: 'evento', source: 'manual' } }); setIsFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo Evento Manual
            </Button>
        </CardFooter>
      </Card>
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{formData.id ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="title" className="text-right">Título</Label><Input id="title" value={formData.title || ''} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} className="col-span-3" /></div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="type" className="text-right">Tipo</Label>
              <Select value={formData.extendedProps?.type || 'evento'} onValueChange={(v) => setFormData(p => ({...p, extendedProps: {...p.extendedProps, type: v as any}}))}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent>{eventTypes.filter(t => t.value === 'evento' || t.value === 'lembrete').map(t => <SelectItem key={t.value} value={t.value}><div className="flex items-center gap-2"><t.icon className="h-4 w-4"/> {t.label}</div></SelectItem>)}</SelectContent></Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="description" className="text-right">Descrição</Label><Textarea id="description" value={formData.extendedProps?.description || ''} onChange={(e) => setFormData(p => ({...p, extendedProps: {...p.extendedProps, description: e.target.value}}))} className="col-span-3" /></div>
          </div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="button" onClick={handleFormSave}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Circle className="h-4 w-4" style={{color: selectedEvent.backgroundColor as string}}/>{selectedEvent.title}</DialogTitle>
                <DialogDescription className="pt-2">
                  <p>{selectedEvent.extendedProps.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{selectedEvent.allDay ? `Todo o dia em ${selectedEvent.start ? format(parseISO(selectedEvent.start as string), "PPP", {locale: ptBR}) : ''}` : `De ${selectedEvent.start ? format(parseISO(selectedEvent.start as string), "Pp", {locale: ptBR}) : ''} até ${selectedEvent.end ? format(parseISO(selectedEvent.end), "Pp", {locale: ptBR}) : ''}`}</p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>{selectedEvent.extendedProps.source === 'manual' && <Button type="button" variant="ghost" onClick={() => { setSelectedEvent(null); setFormData(selectedEvent); setIsFormOpen(true);}}>Editar</Button>} {selectedEvent.extendedProps.source === 'manual' && <Button type="button" variant="destructive" onClick={handleDeleteEvent}><Trash2 className="mr-2 h-4 w-4" /> Deletar</Button>} <DialogClose asChild><Button type="button" variant="outline">Fechar</Button></DialogClose></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
