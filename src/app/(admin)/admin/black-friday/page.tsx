// src/app/(admin)/admin/black-friday/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShoppingBag, CalendarIcon, Percent, Save, AlertCircle } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useAppSettings } from "@/contexts/app-settings-context";

export default function BlackFridayPage() {
  const { isBlackFridayActive, toggleBlackFriday } = useAppSettings();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const handleSaveChanges = () => {
    toast({
        title: "Alterações Salvas (Simulação)",
        description: "As configurações da campanha de Black Friday foram salvas.",
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campanha de Black Friday"
        icon={<ShoppingBag />}
        description="Configure os descontos e o período da campanha promocional."
      />

      <Card>
        <CardHeader>
            <CardTitle>Configurações Gerais da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 rounded-md border p-4">
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Ativar Campanha de Black Friday</p>
                    <p className="text-sm text-muted-foreground">Habilita a exibição de preços promocionais e o tema escuro na landing page.</p>
                </div>
                <Switch checked={isBlackFridayActive} onCheckedChange={toggleBlackFriday} aria-label="Ativar Campanha"/>
            </div>
             <div className="space-y-2">
                <Label>Período da Campanha</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Escolha um período</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                   Ativar esta campanha irá alterar os preços exibidos na página de planos. Certifique-se de que os descontos estão corretos antes de salvar.
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Descontos por Plano</CardTitle>
            <CardDescription>Defina o desconto em porcentagem para cada plano durante o período da campanha.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRICING_TIERS.filter(t => t.priceMonthly !== 'Grátis').map(tier => (
                <div key={tier.id} className="space-y-2 border p-4 rounded-lg">
                    <Label htmlFor={`discount-${tier.id}`} className="font-semibold">{tier.name}</Label>
                    <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id={`discount-${tier.id}`} type="number" placeholder="Ex: 25" className="pl-10" />
                    </div>
                    <p className="text-xs text-muted-foreground">Preço Original: {tier.priceMonthly}</p>
                </div>
            ))}
        </CardContent>
        <CardFooter>
            <Button onClick={handleSaveChanges} disabled={!isBlackFridayActive}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações da Campanha
            </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
