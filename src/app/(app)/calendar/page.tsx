"use client"; 

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // For Portuguese date formatting
import { APP_NAME } from "@/lib/constants";

// Sample data for events - replace with actual data fetching
const events: { [key: string]: Array<{ id: string; title: string; type: 'income' | 'expense'; amount: number; currency: string; status?: string }> } = {
  "2024-08-15": [ 
    { id: "1", title: "Depósito de Salário", type: "income", amount: 2500.00, currency: "BRL" },
    { id: "2", title: "Pagamento do Aluguel", type: "expense", amount: 1200.00, currency: "BRL", status: "devido" },
  ],
  // Add more dates and events as needed
};

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    document.title = `Calendário Financeiro - ${APP_NAME}`;
  }, []);

  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';
  const eventsForSelectedDate = events[selectedDateString] || [];

  return (
    <div>
      <PageHeader
        title="Calendário Financeiro"
        description="Veja suas próximas contas, receitas e eventos financeiros."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-0 flex justify-center">
            <ShadCalendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-3 [&_button]:text-base [&_td]:p-1 md:[&_td]:p-2"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
              }}
              locale={ptBR} 
            />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-lg">
              Eventos para {date ? format(date, 'PPP', { locale: ptBR }) : "data selecionada"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {eventsForSelectedDate.map(event => (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-md border ${
                        event.type === 'income' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-red-500 bg-red-50 dark:bg-red-900/30"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className={`font-semibold ${
                          event.type === 'income' ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                      }`}>
                        {event.title}
                      </h4>
                      <Badge variant="outline" className={`${
                          event.type === 'income' ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"
                      }`}>
                        {event.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.amount.toLocaleString('pt-BR', { style: 'currency', currency: event.currency })}
                      {event.status && <span className="ml-2 text-xs">({event.status})</span>}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhum evento para este dia. Selecione um dia para ver os detalhes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
