
// src/app/(app)/dev/calculators/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Briefcase, Sigma, Repeat, Clock, Percent, TrendingUp } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick?: () => void;
  children?: React.ReactNode;
  isImplemented?: boolean;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ title, description, icon: Icon, onClick, children, isImplemented = false }) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-md">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-lg md:text-xl">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm pt-1 min-h-[40px]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {isImplemented ? children : <p className="text-sm text-muted-foreground">Em breve...</p>}
      </CardContent>
      {isImplemented && onClick && (
         <CardFooter>
            <Button onClick={onClick} className="w-full">Calcular</Button>
         </CardFooter>
      )}
    </Card>
  );
};

// --- Calculadora de Precificação de Projetos ---
interface PricingFormState {
  hourlyRate: string;
  estimatedHours: string;
  complexity: "low" | "medium" | "high";
  fees: string;
  profitMargin: string;
}
const complexityFactors = { low: 1.0, medium: 1.25, high: 1.5 };

const ProjectPricingCalculator = () => {
  const [formState, setFormState] = useState<PricingFormState>({
    hourlyRate: "50",
    estimatedHours: "10",
    complexity: "medium",
    fees: "0",
    profitMargin: "20",
  });
  const [totalPrice, setTotalPrice] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (name: keyof PricingFormState, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value as PricingFormState['complexity'] }));
  };


  const calculatePrice = () => {
    const hr = parseFloat(formState.hourlyRate) || 0;
    const eh = parseFloat(formState.estimatedHours) || 0;
    const factor = complexityFactors[formState.complexity];
    const feeVal = parseFloat(formState.fees) || 0;
    const marginPercent = parseFloat(formState.profitMargin) || 0;

    if (hr <=0 || eh <= 0) {
        toast({ title: "Valores Inválidos", description: "Valor por hora e horas estimadas devem ser positivos.", variant: "destructive"});
        setTotalPrice(null);
        return;
    }
    
    const baseCost = hr * eh;
    const costWithComplexity = baseCost * factor;
    // Assumindo que taxas e margem de lucro são sobre o custo com complexidade
    // Se 'fees' for percentual, ex: '10%' vs '10', a lógica precisaria mudar. Aqui trato como valor fixo.
    // A margem de lucro é aplicada sobre o custo + taxas.
    const costPlusFees = costWithComplexity + feeVal;
    const profitAmount = costPlusFees * (marginPercent / 100);
    const finalPrice = costPlusFees + profitAmount;
    
    setTotalPrice(finalPrice);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="hourlyRate">Valor/Hora (R$)</Label>
          <Input type="number" id="hourlyRate" name="hourlyRate" value={formState.hourlyRate} onChange={handleInputChange} placeholder="50" />
        </div>
        <div>
          <Label htmlFor="estimatedHours">Horas Estimadas</Label>
          <Input type="number" id="estimatedHours" name="estimatedHours" value={formState.estimatedHours} onChange={handleInputChange} placeholder="10" />
        </div>
      </div>
      <div>
        <Label htmlFor="complexity">Complexidade</Label>
        <Select name="complexity" value={formState.complexity} onValueChange={(val) => handleSelectChange("complexity", val)}>
          <SelectTrigger><SelectValue placeholder="Selecione a complexidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa (x1.0)</SelectItem>
            <SelectItem value="medium">Média (x1.25)</SelectItem>
            <SelectItem value="high">Alta (x1.5)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fees">Taxas Adicionais (R$, fixo)</Label>
          <Input type="number" id="fees" name="fees" value={formState.fees} onChange={handleInputChange} placeholder="0" />
        </div>
        <div>
          <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
          <Input type="number" id="profitMargin" name="profitMargin" value={formState.profitMargin} onChange={handleInputChange} placeholder="20" />
        </div>
      </div>
      {totalPrice !== null && (
        <div className="mt-4 p-3 bg-primary/10 rounded-md text-center">
          <p className="text-sm text-muted-foreground">Preço Total Estimado:</p>
          <p className="text-2xl font-bold text-primary">
            {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      )}
       <Button onClick={calculatePrice} className="w-full mt-3">Calcular Preço</Button>
    </div>
  );
};


export default function CalculatorsPage() {
  useEffect(() => {
    document.title = `Calculadoras (DEV) - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Calculadoras e Ferramentas (DEV)"
        description="Coleção de ferramentas úteis para desenvolvedores e freelancers."
        icon={<Calculator className="h-6 w-6 text-primary" />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CalculatorCard
          title="Precificação de Projetos (Freelancer)"
          description="Calcule o preço de seus projetos com base em valor/hora, complexidade, taxas e margem."
          icon={Briefcase}
          isImplemented={true}
        >
          <ProjectPricingCalculator />
        </CalculatorCard>

        <CalculatorCard
          title="Conversor de Moeda"
          description="Converta valores entre diferentes moedas com cotações atualizadas (via API)."
          icon={Repeat}
        />
        <CalculatorCard
          title="Conversor de Tempo"
          description="Converta unidades de tempo (minutos, horas, dias, etc.) e formatos."
          icon={Clock}
        />
        <CalculatorCard
          title="Juros Compostos / Simples"
          description="Simule o crescimento de capital com juros simples ou compostos."
          icon={Sigma} // Usando Sigma como um substituto para algo mais financeiro
        />
        <CalculatorCard
          title="Calculadora de Uptime (SLA)"
          description="Calcule o tempo de inatividade permitido com base em uma porcentagem de SLA."
          icon={Percent}
        />
         <CalculatorCard
          title="Próxima Calculadora Incrível"
          description="Mais uma ferramenta útil será adicionada aqui em breve!"
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}
