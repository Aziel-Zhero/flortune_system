// src/app/(app)/calendar/page.tsx
"use client";

import { useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ptBR } from "date-fns/locale";
import type { EventClickArg, DateSelectArg, EventDropArg, EventInput } from '@fullcalendar/core';

import { PageHeader } from "@/components/shared/page-header";
import { Calendar as CalendarIconLucide } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

// Simulação de dados de transações que poderiam vir do seu backend
const sampleTransactions: EventInput[] = [
  { id: '1', title: 'Salário', start: new Date().toISOString().split('T')[0], allDay: true, color: 'hsl(var(--primary))' },
  { id: '2', title: 'Pagamento Aluguel', start: '2024-07-05', end: '2024-07-05', allDay: true, color: 'hsl(var(--destructive))' },
  { id: '3', title: 'Supermercado', start: '2024-07-10T16:00:00', end: '2024-07-10T17:00:00', color: 'hsl(var(--chart-2))' },
  { id: '4', title: 'Conta de Luz', start: '2024-07-15', allDay: true, color: 'hsl(var(--accent))' },
  { id: '5', title: 'Reunião de Equipe', start: '2024-07-22T14:00:00', end: '2024-07-22T15:00:00' },
];

export default function CalendarPage() {

  useEffect(() => {
    document.title = `Calendário Financeiro - ${APP_NAME}`;
  }, []);
  
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    toast({
      title: `Evento Clicado: "${clickInfo.event.title}"`,
      description: `Início: ${clickInfo.event.start?.toLocaleString()}`,
    });
  }, []);
  
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    let title = prompt('Por favor, insira um título para o seu novo evento:');
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // Limpa a seleção

    if (title) {
      calendarApi.addEvent({
        id: `evt_new_${Date.now()}`,
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
      toast({ title: 'Evento Criado!', description: `O evento "${title}" foi adicionado ao calendário.` });
    }
  }, []);

  const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
     toast({
      title: 'Evento Movido!',
      description: `O evento "${dropInfo.event.title}" foi movido para ${dropInfo.event.start?.toLocaleString()}. (Ação não será salva)`,
      variant: "destructive"
    });
    // Aqui você faria a chamada à API para salvar a mudança no backend.
    // Para reverter visualmente a mudança em caso de erro, você pode usar:
    // dropInfo.revert();
  }, []);


  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader
        title="Calendário Financeiro"
        description="Visualize e gerencie seus eventos e transações de forma interativa."
        icon={<CalendarIconLucide className="h-6 w-6 text-primary" />}
      />

      <div className="flex-1 p-1 -m-1 bg-card border rounded-lg shadow-sm overflow-hidden">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="dayGridMonth"
          locale={ptBR} // Para usar o idioma português
          weekends={true}
          events={sampleTransactions} // Carrega os eventos
          editable={true} // Permite arrastar e redimensionar
          selectable={true} // Permite selecionar datas
          selectMirror={true}
          dayMaxEvents={true}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop} // Handler para quando um evento é movido
          // --- Estilização para integrar com Tailwind/ShadCN ---
          height="100%"
          contentHeight="auto"
          dayHeaderClassNames="text-sm font-medium text-muted-foreground"
          viewClassNames="bg-card"
          eventClassNames="border-none rounded-md px-2 py-1 text-xs font-medium cursor-pointer"
          buttonText={{
              today:    'Hoje',
              month:    'Mês',
              week:     'Semana',
              day:      'Dia',
              list:     'Lista'
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          // Para que os popovers de eventos apareçam acima de outros elementos
          eventDidMount={(info) => {
            info.el.style.zIndex = '5'; 
          }}
        />
      </div>
    </div>
  );
}
