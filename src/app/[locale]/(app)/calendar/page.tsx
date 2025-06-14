
"use client"; // Calendar interaction requires client components

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as ShadCalendar } from "@/components/ui/calendar"; // Renamed to avoid conflict
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useTranslations } from "next-intl"; // For client-side translations
import { format } from 'date-fns'; // For date formatting
// To get current locale for date-fns if needed: import { useLocale } from 'next-intl';
// import { ptBR, enUS, es, fr, ja, zhCN } from 'date-fns/locale';
// const localesMap = { pt: ptBR, en: enUS, es, fr, ja, zh: zhCN };

export default function CalendarPage() {
  const t = useTranslations('CalendarPage'); // Assuming 'CalendarPage' namespace exists
  // const currentLocale = useLocale(); // For date-fns locale
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Placeholder data for events - replace with actual data fetching
  const events = {
    "2024-08-15": [ // Example date
      { id: "1", title: "Salary Deposit", type: "income", amount: 2500.00, currency: "USD" },
      { id: "2", title: "Rent Payment", type: "expense", amount: 1200.00, currency: "USD", status: "due" },
    ],
  };

  const selectedDateString = date ? format(date, 'yyyy-MM-dd') : '';
  const eventsForSelectedDate = events[selectedDateString as keyof typeof events] || [];

  return (
    <div>
      <PageHeader
        title={"Financial Calendar"} // Placeholder: t('title')
        description={"View your upcoming bills, income, and financial events."} // Placeholder: t('description')
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
              // locale={localesMap[currentLocale]} // For date-fns localization in calendar
            />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-lg">
              {/* Placeholder: t('eventsForDate', {date: date ? format(date, 'PPP', { locale: localesMap[currentLocale] }) : t('selectedDateFallback')}) */}
              Events for {date ? format(date, 'PPP') : "selected date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length > 0 ? (
              <div className="space-y-4">
                {eventsForSelectedDate.map(event => (
                  <div 
                    key={event.id}
                    className={cn(
                        "p-3 rounded-md border",
                        event.type === 'income' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-red-500 bg-red-50 dark:bg-red-900/30"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className={cn(
                          "font-semibold",
                          event.type === 'income' ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                      )}>
                        {event.title} {/* Placeholder: t(`eventTitles.${event.titleKey}`) */}
                      </h4>
                      <Badge variant="outline" className={cn(
                          event.type === 'income' ? "border-emerald-500 text-emerald-600" : "border-red-500 text-red-600"
                      )}>
                        {event.type} {/* Placeholder: t(`eventTypes.${event.type}`) */}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.amount.toLocaleString(undefined, { style: 'currency', currency: event.currency })}
                      {event.status && <span className="ml-2 text-xs">({event.status})</span>}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {/* Placeholder: t('noEventsForDay') */}
                No events for this day. Select a day to see details.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
