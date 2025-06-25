
'use client';

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

// IMPORTANT: FullCalendar CSS must be imported for it to work
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

interface CalendarEvent {
  title: string;
  start: string; // YYYY-MM-DD
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
              title: tx.description,
              start: tx.date, // Assumes tx.date is 'YYYY-MM-DD'
              allDay: true,
              backgroundColor: tx.type === 'income' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
              borderColor: tx.type === 'income' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
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
            <PageHeader title="Calendário Financeiro" description="Visualize seus eventos e transações." icon={<CalendarIcon/>}/>
            <Skeleton className="w-full h-[600px] rounded-lg" />
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full">
        <PageHeader title="Calendário Financeiro" description="Visualize seus eventos e transações." icon={<CalendarIcon/>}/>
      <Card>
        <CardContent className="p-2 sm:p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={ptBrLocale}
            events={events}
            height="auto" // Adjusts height automatically
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            eventDidMount={(info) => {
                // You can add tooltips here if needed in the future
                return info.el;
            }}
            // You can add more interactive callbacks here
            // dateClick={(info) => alert('Clicked on: ' + info.dateStr)}
            // eventClick={(info) => alert('Event: ' + info.event.title)}
          />
        </CardContent>
      </Card>
       <style jsx global>{`
        /* Custom styles to better integrate with shadcn/ui */
        :root {
            --fc-border-color: hsl(var(--border));
            --fc-today-bg-color: hsl(var(--accent));
            --fc-list-event-dot-width: 8px;
        }
        .fc {
            font-size: 0.875rem; /* text-sm */
        }
        .fc .fc-toolbar-title {
            font-size: 1.25rem; /* text-xl */
            font-weight: 600;
            font-family: var(--font-headline), sans-serif;
        }
        .fc .fc-button {
            background-color: hsl(var(--secondary));
            color: hsl(var(--secondary-foreground));
            border: 1px solid hsl(var(--border));
            box-shadow: none;
            text-transform: capitalize;
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
        .fc .fc-button-primary:disabled {
             background-color: hsl(var(--primary));
             opacity: 0.5;
        }
        .fc-daygrid-day.fc-day-today {
            background-color: hsl(var(--accent) / 0.2);
        }
        .fc-event {
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
