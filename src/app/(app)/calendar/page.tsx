'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

import { useState } from 'react';

// IMPORTANTE: importar os estilos do FullCalendar
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

export default function CalendarPage() {
  const [events] = useState([
    { id: '1', title: 'Pagamento Luz', date: '2025-06-24', color: '#4ade80' },
    { id: '2', title: 'Salário', date: '2025-06-25', color: '#60a5fa' },
    { id: '3', title: 'Cartão de Crédito', date: '2025-06-27', color: '#f87171' },
  ]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Calendário Financeiro</h1>
      <div className="bg-white rounded-lg shadow p-2">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          height="auto"
        />
      </div>
    </div>
  );
}
