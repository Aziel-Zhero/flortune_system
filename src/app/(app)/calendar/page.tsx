"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react"; // Keep if client-side logic like date picking is needed

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div>
      <PageHeader
        title="Financial Calendar"
        description="View your upcoming bills, income, and financial events."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="p-3 w-full [&_button]:text-base [&_td]:p-1 md:[&_td]:p-2"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
              }}
            />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-lg">
              Events for {date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "selected date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for fetching and displaying events for the selected date */}
            <p className="text-muted-foreground text-sm mb-4">No events for this day. Select a day to see details.</p>
            {/* Example Event Listing - to be populated dynamically */}
            <div className="space-y-4">
              <div className="p-3 rounded-md border border-green-500 bg-green-50 dark:bg-green-900/30">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-green-700 dark:text-green-400">Salary Deposit</h4>
                  <Badge variant="outline" className="border-green-500 text-green-600">Income</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">$2,500.00</p>
              </div>
              <div className="p-3 rounded-md border border-red-500 bg-red-50 dark:bg-red-900/30">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-red-700 dark:text-red-400">Rent Payment</h4>
                  <Badge variant="outline" className="border-red-500 text-red-600">Expense</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">$1,200.00 due</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
