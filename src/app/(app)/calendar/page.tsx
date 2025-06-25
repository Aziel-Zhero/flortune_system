
"use client";

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { PageHeader } from '@/components/shared/page-header';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getTransactions } from '@/services/transaction.service';
import type { Transaction } from '@/types/database.types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface CalendarEvent {
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    amount: number;
    type: 'income' | 'expense';
    category?: string | null;
  }
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = `Calendário - Flortune`;
    if (status === "authenticated" && session.user?.id) {
      setIsLoading(true);
      getTransactions(session.user.id)
        .then(({ data, error }) => {
          if (error) {
            toast({ title: "Erro ao buscar transações", description: error.message, variant: "destructive" });
            return;
          }
          if (data) {
            const formattedEvents = data.map((tx: Transaction) => ({
              title: `${tx.type === 'income' ? '+' : '-'} ${tx.amount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} - ${tx.description}`,
              start: tx.date,
              allDay: true,
              backgroundColor: tx.type === 'income' ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))',
              borderColor: tx.type === 'income' ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))',
              extendedProps: {
                amount: tx.amount,
                type: tx.type,
                category: tx.category?.name
              }
            }));
            setEvents(formattedEvents);
          }
        })
        .finally(() => setIsLoading(false));
    } else if (status === "unauthenticated") {
        setIsLoading(false);
    }
  }, [status, session]);


  if (isLoading) {
      return (
          <div>
            <PageHeader title="Calendário Financeiro" description="Visualize seus eventos e transações." icon={<CalendarIcon className="h-6 w-6 text-primary"/>}/>
            <Skeleton className="w-full h-[600px] rounded-lg" />
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full">
        <PageHeader title="Calendário Financeiro" description="Visualize seus eventos e transações mensais." icon={<CalendarIcon className="h-6 w-6 text-primary"/>}/>
      <Card>
        <CardContent className="p-1 sm:p-2 md:p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={ptBrLocale}
            events={events}
            height="auto" 
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            eventDidMount={(info) => {
                info.el.style.fontSize = '0.75rem';
                info.el.style.padding = '2px 4px';
                return info.el;
            }}
          />
        </CardContent>
      </Card>
      <style jsx global>{`
        :root {
            --fc-border-color: hsl(var(--border));
            --fc-today-bg-color: hsl(var(--accent) / 0.1);
            --fc-list-event-dot-width: 8px;
        }
        .fc {
            font-size: 0.875rem; 
        }
        .fc .fc-toolbar-title {
            font-size: 1.25rem; 
            font-weight: 600;
        }
        .fc .fc-button {
            background-color: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            border: 1px solid hsl(var(--border));
            box-shadow: none;
            text-transform: capitalize;
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
        }
        .fc .fc-button:hover {
            background-color: hsl(var(--secondary) / 0.9);
        }
        .fc .fc-button-primary {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border-color: hsl(var(--primary));
        }
        .fc .fc-button-primary:hover {
            background-color: hsl(var(--primary) / 0.9);
        }
        .fc-daygrid-day.fc-day-today {
            background-color: hsl(var(--accent) / 0.15);
        }
        .fc-event {
            border-radius: 4px;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
}
