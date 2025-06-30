// src/app/(app)/calendar/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ptBR } from "date-fns/locale";
import type { EventClickArg, DateSelectArg, EventInput, EventDropArg } from '@fullcalendar/core';

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSettings } from "@/contexts/app-settings-context";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Calendar as CalendarIconLucide,
  Plus,
  Trash2,
  AlertTriangle,
  Tag,
  CreditCard,
  DollarSign,
  Info
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  extendedProps: {
    type: 'lembrete' | 'pagamento' | 'recebimento' | 'evento';
    description?: string;
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

const initialEvents: CalendarEvent[] = [
  { id: '1', title: 'Salário Mensal', start: new Date().toISOString().split('T')[0], allDay: true, extendedProps: { type: 'recebimento', description: 'Recebimento do salário da empresa.'}, backgroundColor: getEventTypeConfig('recebimento').color, borderColor: getEventTypeConfig('recebimento').color },
  { id: '2', title: 'Pagar Aluguel', start: '2024-07-05', end: '2024-07-05', allDay: true, extendedProps: { type: 'pagamento', description: 'Vencimento do aluguel do apartamento.' }, backgroundColor: getEventTypeConfig('pagamento').color, borderColor: getEventTypeConfig('pagamento').color },
  { id: '3', title: 'Reunião de Equipe', start: '2024-07-10T14:00:00', end: '2024-07-10T15:00:00', allDay: false, extendedProps: { type: 'evento', description: 'Alinhamento semanal do projeto Flortune.'}, backgroundColor: getEventTypeConfig('evento').color, borderColor: getEventTypeConfig('evento').color },
];

export default function CalendarPage() {
  const { weatherData, isLoadingWeather, weatherError, weatherCity } = useAppSettings();
  const WeatherIcon = weatherData?.icon ? getWeatherIcon(weatherData.icon) : null;
  const [events, setEvents] = useState<EventInput[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({});

  useEffect(() => {
    document.title = `Calendário Financeiro - ${APP_NAME}`;
  }, []);
  
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event as unknown as CalendarEvent);
  }, []);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setFormData({ start: selectInfo.startStr, end: selectInfo.endStr, allDay: selectInfo.allDay, extendedProps: { type: 'evento' }});
    setIsFormOpen(true);
  }, []);
  
  const handleFormSave = () => {
    if(!formData.title) {
        toast({ title: "Título obrigatório", description: "Por favor, insira um título para o evento.", variant: "destructive" });
        return;
    }
    const newEvent: CalendarEvent = {
        id: formData.id || `evt_${Date.now()}`,
        title: formData.title,
        start: formData.start!,
        end: formData.end,
        allDay: formData.allDay || false,
        extendedProps: {
            type: formData.extendedProps?.type || 'evento',
            description: formData.extendedProps?.description || ''
        },
        backgroundColor: getEventTypeConfig(formData.extendedProps?.type || 'evento').color,
        borderColor: getEventTypeConfig(formData.extendedProps?.type || 'evento').color,
    };

    if(formData.id) { // Editing
        setEvents(prev => prev.map(e => e.id === formData.id ? newEvent : e));
        toast({ title: "Evento Atualizado!" });
    } else { // Creating
        setEvents(prev => [...prev, newEvent]);
        toast({ title: "Evento Criado!" });
    }
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
  
  const WeatherDisplay = () => (
     <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isLoadingWeather && <Skeleton className="h-5 w-24" />}
      {!isLoadingWeather && WeatherIcon && weatherData && (
        <>
          <WeatherIcon className="h-5 w-5" />
          <span>{weatherData.temperature}°C em {weatherData.city}</span>
        </>
      )}
      {!isLoadingWeather && weatherError && weatherCity && (
        <span className="text-destructive text-xs">Erro ao buscar clima.</span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Calendário Financeiro"
        description="Visualize e gerencie seus eventos e transações de forma interativa."
        icon={<CalendarIconLucide className="h-6 w-6 text-primary" />}
        actions={
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <WeatherDisplay />
                <Button onClick={() => { setFormData({ start: new Date().toISOString().split('T')[0], allDay: true, extendedProps: { type: 'evento' } }); setIsFormOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Evento
                </Button>
            </div>
        }
      />
      <div className="flex-1 p-1 -m-1 bg-card border rounded-lg shadow-sm overflow-hidden min-h-[600px]">
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
          height="100%"
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false, hour12: false }}
        />
      </div>
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.id ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Título</Label>
              <Input id="title" value={formData.title || ''} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Tipo</Label>
              <Select value={formData.extendedProps?.type || 'evento'} onValueChange={(v) => setFormData(p => ({...p, extendedProps: {...p.extendedProps, type: v as any}}))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>{eventTypes.map(t => <SelectItem key={t.value} value={t.value}><div className="flex items-center gap-2"><t.icon className="h-4 w-4"/> {t.label}</div></SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Descrição</Label>
              <Input id="description" value={formData.extendedProps?.description || ''} onChange={(e) => setFormData(p => ({...p, extendedProps: {...p.extendedProps, description: e.target.value}}))} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="button" onClick={handleFormSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <getEventTypeConfig.icon className="h-5 w-5" style={{color: getEventTypeConfig(selectedEvent.extendedProps.type).color }}/>
                    {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="pt-2">
                  <p>{selectedEvent.extendedProps.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedEvent.allDay ? `Todo o dia em ${format(parseISO(selectedEvent.start as string), "PPP", {locale: ptBR})}`
                    : `De ${format(parseISO(selectedEvent.start as string), "Pp", {locale: ptBR})} até ${selectedEvent.end ? format(parseISO(selectedEvent.end), "Pp", {locale: ptBR}) : ''}`}
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setSelectedEvent(null); setFormData(selectedEvent); setIsFormOpen(true);}}>Editar</Button>
                <Button type="button" variant="destructive" onClick={handleDeleteEvent}><Trash2 className="mr-2 h-4 w-4" /> Deletar</Button>
                <DialogClose asChild><Button type="button" variant="outline">Fechar</Button></DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper to get weather icon component
const weatherIconMapping: { [key: string]: React.ElementType } = {
  "01d": CalendarIconLucide, "01n": CalendarIconLucide,
  "02d": CalendarIconLucide, "02n": CalendarIconLucide,
  "03d": CalendarIconLucide, "03n": CalendarIconLucide,
  "04d": CalendarIconLucide, "04n": CalendarIconLucide,
  "09d": CalendarIconLucide, "09n": CalendarIconLucide,
  "10d": CalendarIconLucide, "10n": CalendarIconLucide,
  "11d": CalendarIconLucide, "11n": CalendarIconLucide,
  "13d": CalendarIconLucide, "13n": CalendarIconLucide,
  "50d": CalendarIconLucide, "50n": CalendarIconLucide,
  "default": CalendarIconLucide,
};
const getWeatherIcon = (iconCode: string) => weatherIconMapping[iconCode] || weatherIconMapping["default"];
