import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, TrendingUp } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AnalysisPage() {
  return (
    <div>
      <PageHeader
        title="Financial Analysis"
        description="Gain insights into your spending and income patterns."
        actions={
          <Select defaultValue="monthly">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-primary" />
              Spending by Category
            </CardTitle>
            <CardDescription>Breakdown of your expenses across different categories.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            {/* Placeholder for Bar Chart */}
            <Image src="https://placehold.co/400x300.png?text=Spending+Bar+Chart" alt="Spending Bar Chart Placeholder" width={400} height={300} data-ai-hint="data chart"/>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Income Sources
            </CardTitle>
            <CardDescription>Distribution of your income from various sources.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            {/* Placeholder for Pie Chart */}
             <Image src="https://placehold.co/300x300.png?text=Income+Pie+Chart" alt="Income Pie Chart Placeholder" width={300} height={300} data-ai-hint="data chart"/>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Cash Flow Trend
            </CardTitle>
            <CardDescription>Your income vs. expenses over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            {/* Placeholder for Line Chart */}
            <Image src="https://placehold.co/600x300.png?text=Cash+Flow+Line+Chart" alt="Cash Flow Line Chart Placeholder" width={600} height={300} data-ai-hint="data chart graph"/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
