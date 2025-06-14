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
import type { Metadata } from 'next';
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Análise Financeira - ${APP_NAME}`,
};

export default function AnalysisPage() {
  return (
    <div>
      <PageHeader
        title="Análise Financeira"
        description="Obtenha insights sobre seus padrões de gastos e receitas."
        actions={
          <Select defaultValue="monthly">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
              <SelectItem value="quarterly">Trimestral</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-primary" />
              Gastos por Categoria
            </CardTitle>
            <CardDescription>Detalhamento de suas despesas em diferentes categorias.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <Image src="https://placehold.co/400x300.png" alt="Gráfico de Barras de Gastos" width={400} height={300} data-ai-hint="data chart"/>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Fontes de Renda
            </CardTitle>
            <CardDescription>Distribuição de sua renda de várias fontes.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
             <Image src="https://placehold.co/300x300.png" alt="Gráfico de Pizza de Renda" width={300} height={300} data-ai-hint="data chart"/>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Tendência do Fluxo de Caixa
            </CardTitle>
            <CardDescription>Sua renda vs. despesas ao longo do tempo.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <Image src="https://placehold.co/600x300.png" alt="Gráfico de Linha do Fluxo de Caixa" width={600} height={300} data-ai-hint="data chart graph"/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
