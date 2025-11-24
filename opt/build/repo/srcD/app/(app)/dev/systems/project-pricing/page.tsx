// src/app/(app)/dev/systems/project-pricing/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, DollarSign, ClockIcon, Percent, AlertCircle, BarChartHorizontalBig } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useEffect, useState, type FormEvent } from "react";
import { PrivateValue } from "@/components/shared/private-value";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PricingFormState {
  hourlyRate: string;
  estimatedHours: string;
  complexity: 'low' | 'medium' | 'high';
  additionalFees: string;
  profitMargin: string;
}

const complexityFactors = { low: 1.0, medium: 1.25, high: 1.5 };

export default function ProjectPricingPage() {
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [formState, setFormState] = useState<PricingFormState>({
    hourlyRate: "",
    estimatedHours: "",
    complexity: "medium",
    additionalFees: "0",
    profitMargin: "20"
  });

  useEffect(() => {
    document.title = `Orçamento de Projeto Tech - ${APP_NAME}`;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (value: PricingFormState['complexity']) => {
    setFormState(prev => ({ ...prev, complexity: value }));
  };
  
  const handleReset = () => {
    setFormState({
        hourlyRate: "",
        estimatedHours: "",
        complexity: "medium",
        additionalFees: "0",
        profitMargin: "20",
    });
    setTotalPrice(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      const { hourlyRate, estimatedHours, complexity, additionalFees, profitMargin } = formState;

      const numHourlyRate = parseFloat(hourlyRate);
      const numEstimatedHours = parseFloat(estimatedHours);
      const numAdditionalFees = parseFloat(additionalFees);
      const numProfitMargin = parseFloat(profitMargin);

      if (isNaN(numHourlyRate) || numHourlyRate <= 0) throw new Error("Valor/hora deve ser positivo.");
      if (isNaN(numEstimatedHours) || numEstimatedHours <= 0) throw new Error("Horas estimadas devem ser positivas.");
      
      const baseCost = numHourlyRate * numEstimatedHours;
      const complexityFactor = complexityFactors[complexity];
      const costWithComplexity = baseCost * complexityFactor;
      const costPlusFees = costWithComplexity + numAdditionalFees;
      const profitAmount = costPlusFees * (numProfitMargin / 100);
      const finalPrice = costPlusFees + profitAmount;
      
      setTotalPrice(finalPrice);
      toast({ title: "Cálculo Realizado", description: "O preço do projeto foi estimado com sucesso."});
    } catch (error: any) {
      toast({ title: "Erro no Cálculo", description: error.message || "Não foi possível calcular o preço.", variant: "destructive"});
      setTotalPrice(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Orçamento de Projeto Tech"
        description="Calcule o preço estimado de um sistema baseado em escopo, tempo e complexidade."
        icon={<Calculator className="h-6 w-6 text-primary" />}
      />
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Parâmetros do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="hourlyRate">Seu Valor/Hora (R$)</Label>
                 <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="hourlyRate" name="hourlyRate" type="number" step="0.01" placeholder="Ex: 100" value={formState.hourlyRate} onChange={handleInputChange} className="pl-10" />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="estimatedHours">Horas Estimadas para o Projeto</Label>
                 <div className="relative">
                    <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="estimatedHours" name="estimatedHours" type="number" step="1" placeholder="Ex: 40" value={formState.estimatedHours} onChange={handleInputChange} className="pl-10" />
                 </div>
               </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complexity">Nível de Complexidade</Label>
               <Select onValueChange={handleSelectChange} value={formState.complexity}>
                  <SelectTrigger id="complexity"><SelectValue placeholder="Selecione a complexidade" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="low">Baixa (Fator x1.0)</SelectItem>
                      <SelectItem value="medium">Média (Fator x1.25)</SelectItem>
                      <SelectItem value="high">Alta (Fator x1.5)</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="additionalFees">Taxas Adicionais (R$)</Label>
                <div className="relative">
                   <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input id="additionalFees" name="additionalFees" type="number" step="0.01" placeholder="Ex: 150" value={formState.additionalFees} onChange={handleInputChange} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profitMargin">Margem de Lucro Desejada (%)</Label>
                <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="profitMargin" name="profitMargin" type="number" step="1" placeholder="Ex: 20" value={formState.profitMargin} onChange={handleInputChange} className="pl-10" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4">
             <div className="flex gap-2">
                <Button type="submit">Calcular Preço</Button>
                <Button type="button" variant="outline" onClick={handleReset}>Limpar</Button>
            </div>
            {totalPrice !== null && (
              <Card className="w-full bg-primary/5 border-primary/20 mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary font-headline text-md flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5"/>Preço Sugerido para o Projeto:</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    <PrivateValue value={totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                  </p>
                </CardContent>
              </Card>
            )}
             {totalPrice === null && (
                 <Alert variant="default" className="w-full mt-2">
                    <AlertCircle size={18} className="h-4 w-4" />
                    <AlertTitle>Aguardando Cálculo</AlertTitle>
                    <AlertDescription>Preencha os campos e clique em "Calcular Preço".</AlertDescription>
                </Alert>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
