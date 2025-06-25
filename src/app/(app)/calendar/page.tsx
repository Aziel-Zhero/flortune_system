// src/app/page.tsx

"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import Calendar from "@/components/Calendar";
import { Skeleton } from "@/components/ui/skeleton";

const sampleBaseEvents = [
  { title: "Pagamento Aluguel", start: "2025-06-25T00:00:00", end: "2025-06-25T23:59:00", color: "#e11d48", description: "Vencimento do aluguel mensal", location: "Online" },
  { title: "Salário", start: "2025-06-30T00:00:00", end: "2025-06-30T23:59:00", color: "#3b82f6", description: "Recebimento do salário", location: "Conta Bancária" },
  { title: "Supermercado", start: "2025-06-26T16:00:00", end: "2025-06-26T17:30:00", color: "#10b981", description: "Compras da semana", location: "Mercado Local" },
  // Adicione mais eventos conforme necessário
];

export default function Page() {
  const [events, setEvents] = useState(sampleBaseEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setEvents(sampleBaseEvents); // Aqui seria o carregamento real dos eventos
      setIsLoading(false);
    }, 500);
  }, []);

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleEventClick = (event: any) => {
    alert(`Evento clicado: ${event.event.title}`);
  };

  if (isLoading) {
    return <Skeleton className="w-full h-[calc(100vh-200px)] rounded-lg" />;
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Calendário Financeiro" description="Visualize os eventos do seu calendário" />
      
      <Calendar
        events={events}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onEventClick={handleEventClick}
      />
    </div>
  );
}
