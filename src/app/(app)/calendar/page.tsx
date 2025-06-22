// src/app/(app)/calendar/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  day: number; // 0 for Sun, 1 for Mon, etc.
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  color: string; // Tailwind bg color class e.g., "bg-green-200/50"
  borderColor: string; // Tailwind border color class e.g., "border-green-500"
}

// Sample events based on the provided image
const sampleEvents: CalendarEvent[] = [
    { id: "1", title: "Product Design Course", day: 2, startTime: "09:30", endTime: "12:00", color: "bg-emerald-200/50 dark:bg-emerald-800/30", borderColor: "border-emerald-500"},
    { id: "2", title: "Usability testing", day: 4, startTime: "09:00", endTime: "11:00", color: "bg-purple-200/50 dark:bg-purple-800/30", borderColor: "border-purple-500"},
    { id: "3", title: "Frontend developement", day: 5, startTime: "10:00", endTime: "13:00", color: "bg-sky-200/50 dark:bg-sky-800/30", borderColor: "border-sky-500"},
    { id: "4", title: "Conversational Interview", day: 2, startTime: "12:30", endTime: "14:00", color: "bg-purple-200/50 dark:bg-purple-800/30", borderColor: "border-purple-500"},
    { id: "5", title: "App Design", day: 4, startTime: "13:00", endTime: "15:30", color: "bg-emerald-200/50 dark:bg-emerald-800/30", borderColor: "border-emerald-500"},
];

const timeSlots = Array.from({ length: 8 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`); // 09:00 to 16:00

export default function PlanCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    return eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
  }, [currentDate]);

  const handlePrevWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  const calculateEventStyle = (startTime: string, endTime: string): React.CSSProperties => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const timelineStartHour = 9; // Grid starts at 09:00

    const top = ((startH - timelineStartHour) + (startM / 60)) * 4; // 4rem per hour (h-16)
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const height = (durationMinutes / 60) * 4; // 4rem per hour

    return {
      top: `${top}rem`,
      height: `${height}rem`,
    };
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Calendário" icon={<CalendarIcon />} />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start flex-1">
        {/* Left Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(day) => day && setCurrentDate(day)}
                className="w-full"
                locale={ptBR}
                modifiers={{
                    selectedWeek: date => 
                        isSameDay(startOfWeek(currentDate, { weekStartsOn: 1 }), startOfWeek(date, { weekStartsOn: 1 }))
                }}
                modifiersClassNames={{
                    selectedWeek: "bg-primary/10 rounded-none",
                }}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg font-headline">Categories</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><Checkbox id="cat-pd" defaultChecked /><Label htmlFor="cat-pd">Product Design</Label></div><span className="text-muted-foreground">5h00</span></div>
                <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><Checkbox id="cat-se" defaultChecked /><Label htmlFor="cat-se">Software Engineering</Label></div><span className="text-muted-foreground">3h00</span></div>
                <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><Checkbox id="cat-ur" /><Label htmlFor="cat-ur">User Research</Label></div><span className="text-muted-foreground">1h00</span></div>
                <div className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><Checkbox id="cat-mkt" defaultChecked /><Label htmlFor="cat-mkt">Marketing</Label></div><span className="text-muted-foreground">0h00</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg font-headline">Prioritize</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-between"><span>Einsenhower Matrix</span><ChevronRight className="h-4 w-4"/></Button>
                <Button variant="ghost" className="w-full justify-between"><span>Eat The Frog First</span><ChevronRight className="h-4 w-4"/></Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main Calendar View */}
        <main>
          <Card className="min-h-[800px]">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handlePrevWeek}><ChevronLeft className="h-5 w-5" /></Button>
                    <h2 className="text-lg md:text-xl font-semibold whitespace-nowrap">
                        {format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d")} - {format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={handleNextWeek}><ChevronRight className="h-5 w-5" /></Button>
                </div>
                 <Button><Plus className="mr-2 h-4 w-4"/> Create</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="grid grid-cols-[auto_repeat(7,1fr)] min-w-[800px]">
                {/* Time Gutter */}
                <div className="col-start-1 row-start-1"></div>
                
                {/* Day Headers */}
                {weekDates.map((day, i) => (
                  <div key={day.toString()} className="col-start- auto text-center py-2 border-b">
                    <p className="text-xs text-muted-foreground">{format(day, 'EEE', { locale: ptBR }).toUpperCase()}</p>
                    <p className={cn("text-2xl font-medium", isSameDay(day, new Date()) && "text-primary")}>{format(day, 'd')}</p>
                  </div>
                ))}
                
                {/* Grid Lines and Time Labels */}
                <div className="col-start-1 row-start-2 pr-2 text-right">
                    {timeSlots.map(time => (
                        <div key={time} className="h-16 relative -top-3">
                            <span className="text-xs text-muted-foreground">{time}</span>
                        </div>
                    ))}
                </div>

                {/* Event Columns */}
                {weekDates.map((day, i) => (
                    <div key={`col-${i}`} className="col-start-auto row-start-2 border-l relative">
                        {timeSlots.map(time => (
                            <div key={`${time}-line`} className="h-16 border-t"></div>
                        ))}
                        {/* Render events for this day */}
                        {sampleEvents
                         .filter(event => event.day === day.getDay())
                         .map(event => (
                            <div
                                key={event.id}
                                className={cn(
                                    "absolute p-2 rounded-lg border-l-4 text-xs z-10 mx-1",
                                    event.color,
                                    event.borderColor,
                                )}
                                style={calculateEventStyle(event.startTime, event.endTime)}
                            >
                                <p className="font-semibold text-foreground/90">{event.title}</p>
                                <p className="text-muted-foreground">{event.startTime} - {event.endTime}</p>
                            </div>
                         ))
                        }
                    </div>
                ))}

              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
