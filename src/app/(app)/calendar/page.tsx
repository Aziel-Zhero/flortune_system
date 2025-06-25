'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

// IMPORTANTE: você precisa importar os estilos
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

export default function CalendarPage() {
  const [events] = useState([
    {
      id: '1',
      title: 'Salário',
      start: '2025-06-25',
      color: '#22c55e', // verde
    },
    {
      id: '2',
      title: 'Conta de luz',
      start: '2025-06-26',
      color: '#ef4444', // vermelho
    },
    {
      id: '3',
      title: 'Assinatura Netflix',
      start: '2025-06-28',
      color: '#3b82f6', // azul
    },
  ]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Calendário Financeiro</h1>

      <div className="bg-white rounded shadow p-4">
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
        />
      </div>
    </div>
  );
}
