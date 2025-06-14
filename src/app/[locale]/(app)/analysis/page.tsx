
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
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { APP_NAME } from "@/lib/constants";

export async function generateMetadata({params: {locale}}: {params: {locale: string}}): Promise<Metadata> {
  const t = await getTranslations({locale, namespace: 'Navigation'});
  return {
    title: `${t('analysis')} - ${APP_NAME}`,
  };
}

// TODO: Add translations for this page
// Example namespaces: AnalysisPage, ChartLabels, TimePeriods

export default async function AnalysisPage({params: {locale}}: {params: {locale: string}}) {
  // const tPage = await getTranslations({locale, namespace: 'AnalysisPage'});
  // const tChart = await getTranslations({locale, namespace: 'ChartLabels'});
  // const tTime = await getTranslations({locale, namespace: 'TimePeriods'});

  return (
    <div>
      <PageHeader
        title={"Financial Analysis"} // Placeholder: tPage('title')
        description={"Gain insights into your spending and income patterns."} // Placeholder: tPage('description')
        actions={
          <Select defaultValue="monthly">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={"Select period"} /> {/* Placeholder: tTime('selectPeriod') */}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem> {/* Placeholder: tTime('weekly') */}
              <SelectItem value="monthly">Monthly</SelectItem> {/* Placeholder: tTime('monthly') */}
              <SelectItem value="quarterly">Quarterly</SelectItem> {/* Placeholder: tTime('quarterly') */}
              <SelectItem value="yearly">Yearly</SelectItem> {/* Placeholder: tTime('yearly') */}
            </SelectContent>
          </Select>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-primary" />
              Spending by Category {/* Placeholder: tChart('spendingByCategory') */}
            </CardTitle>
            <CardDescription>Breakdown of your expenses across different categories.</CardDescription> {/* Placeholder: tChart('spendingByCategoryDesc') */}
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <Image src="https://placehold.co/400x300.png" alt="Spending Bar Chart Placeholder" width={400} height={300} data-ai-hint="data chart"/>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Income Sources {/* Placeholder: tChart('incomeSources') */}
            </CardTitle>
            <CardDescription>Distribution of your income from various sources.</CardDescription> {/* Placeholder: tChart('incomeSourcesDesc') */}
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
             <Image src="https://placehold.co/300x300.png" alt="Income Pie Chart Placeholder" width={300} height={300} data-ai-hint="data chart"/>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Cash Flow Trend {/* Placeholder: tChart('cashFlowTrend') */}
            </CardTitle>
            <CardDescription>Your income vs. expenses over time.</CardDescription> {/* Placeholder: tChart('cashFlowTrendDesc') */}
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <Image src="https://placehold.co/600x300.png" alt="Cash Flow Line Chart Placeholder" width={600} height={300} data-ai-hint="data chart graph"/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
