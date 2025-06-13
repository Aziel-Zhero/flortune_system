import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react"; // Keep if client-side logic like date picking is needed

// This component should be client-side if it uses hooks like useState for date selection
// For now, let's make it a server component and add client component for interaction later
export default function CalendarPage() {
  // const [date, setDate] = useState<Date | undefined>(new Date()); // Requires "use client"

  return (
    <div>
      <PageHeader
        title="Financial Calendar"
        description="View your upcoming bills, income, and financial events."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-0">
            {/* For interactive calendar, this part would be a client component */}
            <Calendar
              mode="single"
              // selected={date} // requires "use client" and state management
              // onSelect={setDate} // requires "use client" and state management
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
            <CardTitle className="font-headline text-lg">Events for {/* Display selected date here */}</CardTitle>
          </CardHeader>
          <CardContent>
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
