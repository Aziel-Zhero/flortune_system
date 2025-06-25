"use client";

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // for click and select
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { useSession } from 'next-auth/react';
import { getTransactions } from '@/services/transaction.service';
import type { Transaction } from '@/types/database.types';
import { PageHeader } from '@/components/shared/page-header';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { EventClickArg } from '@fullcalendar/core';

// Define the structure for FullCalendar events
interface MappedEvent {
  id: string;
  title: string;
  start: string; // YYYY-MM-DD
  allDay: boolean;
  color?: string;
  borderColor?: string;
  extendedProps?: any;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<MappedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch transactions and map them to FullCalendar events
  useEffect(() => {
    if (status === 'authenticated' && session.user?.id) {
      setIsLoading(true);
      getTransactions(session.user.id)
        .then(({ data, error }) => {
          if (error) {
            toast({
              title: "Erro ao carregar transações",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          if (data) {
            const mappedEvents = data.map((tx: Transaction): MappedEvent => ({
              id: tx.id,
              title: tx.description,
              start: tx.date,
              allDay: true,
              color: tx.type === 'income' ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))',
              borderColor: tx.type === 'income' ? 'hsl(var(--chart-1) / 0.5)' : 'hsl(var(--destructive) / 0.5)',
              extendedProps: tx
            }));
            setEvents(mappedEvents);
          }
        })
        .finally(() => setIsLoading(false));
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status, session]);

  // Handle click on an event
  const handleEventClick = (clickInfo: EventClickArg) => {
    const props = clickInfo.event.extendedProps;
    const amount = props.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A';
    
    toast({
        title: clickInfo.event.title,
        description: `Valor: ${amount} | Categoria: ${props.category?.name || 'N/A'}. Notas: ${props.notes || 'Nenhuma.'}`
    });
  };

  // Show skeleton while loading
  if (isLoading) {
      return (
          <div>
            <PageHeader title="Calendário" description="Carregando seus eventos financeiros..." icon={<CalendarIcon />}/>
            <Skeleton className="w-full h-[70vh] rounded-lg" />
          </div>
      )
  }

  // Render the calendar
  return (
    <div className="flex flex-col h-full gap-4">
      <PageHeader title="Calendário Financeiro" description="Visualize suas transações por mês, semana ou dia." icon={<CalendarIcon />} />
      <div className="flex-1 text-sm p-1 md:p-4 bg-card text-card-foreground rounded-lg shadow-sm calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          locale={ptBrLocale}
          editable={false} // Read-only for now
          selectable={true}
          eventClick={handleEventClick}
          height="auto"
          contentHeight="auto"
          // Add some classes to better integrate with Tailwind/Shadcn
          viewClassNames="bg-background"
          eventClassNames="p-1 border-none text-primary-foreground rounded-sm cursor-pointer text-xs font-medium"
          buttonText={{
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia'
          }}
        />
        <style jsx global>{`
          .calendar-container .fc-button {
            background-color: hsl(var(--primary));
            border-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            opacity: 0.9;
            transition: opacity 0.2s ease-in-out;
            font-size: 0.875rem;
            text-transform: capitalize;
          }
          .calendar-container .fc-button:hover {
            opacity: 1;
            background-color: hsl(var(--primary) / 0.9);
          }
          .calendar-container .fc-button-primary:not(:disabled).fc-button-active,
          .calendar-container .fc-button-primary:not(:disabled):active {
            background-color: hsl(var(--accent));
            border-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
          }
          .calendar-container .fc-daygrid-day-number {
            color: hsl(var(--foreground));
            padding: 4px;
          }
          .calendar-container .fc-col-header-cell-cushion {
             color: hsl(var(--muted-foreground));
             text-decoration: none;
          }
          .calendar-container .fc-day-today {
            background-color: hsl(var(--primary) / 0.1) !important;
          }
          .calendar-container .fc-event-main {
            padding: 2px 4px;
          }
          .calendar-container .fc-h-event {
            border: 1px solid var(--fc-event-border-color, #a1a1aa) !important;
          }
        `}</style>
      </div>
    </div>
  );
}
