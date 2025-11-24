// src/app/(admin)/admin/campaigns/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShoppingBag, CalendarIcon, Percent, Save, AlertCircle, Eye, Send } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useAppSettings, type CampaignTheme } from "@/contexts/app-settings-context";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const campaignThemes: { value: CampaignTheme | 'none', label: string }[] = [
  { value: 'none', label: 'Nenhuma (Padrão)' },
  { value: 'black-friday', label: 'Black Friday' },
  { value: 'flash-sale', label: 'Promoção Relâmpago' },
  { value: 'super-promocao', label: 'Super Promoção' },
  { value: 'aniversario', label: 'Aniversário' },
];

export default function CampaignsPage() {
  const { activeCampaignTheme, setActiveCampaignTheme } = useAppSettings();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  
  const handleThemeChange = (value: string) => {
    const theme = value === 'none' ? null : value as CampaignTheme;
    setActiveCampaignTheme(theme);
  }

  const handleSaveChanges = () => {
    toast({
        title: "Alterações Salvas (Simulação)",
        description: "As configurações da campanha promocional foram salvas.",
    });
  }
  
  const handleNotifyUsers = () => {
    toast({
        title: "Notificando Usuários (Simulação)",
        description: "Uma notificação sobre a campanha atual seria enviada para os usuários.",
    });
  };

  useEffect(() => {
    document.title = "Campanhas Promocionais - Flortune";
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campanhas Promocionais"
        icon={<ShoppingBag />}
        description="Configure descontos, temas e o período de campanhas promocionais."
      />

      <Card>
        <CardHeader>
            <CardTitle>Configurações Gerais da Campanha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="campaign-theme-selector">Tema da Campanha Ativa</Label>
                <Select
                  value={activeCampaignTheme || 'none'}
                  onValueChange={handleThemeChange}
                >
                    <SelectTrigger id="campaign-theme-selector" className="w-full md:w-[300px]">
                        <SelectValue placeholder="Selecione um tema..." />
                    </SelectTrigger>
                    <SelectContent>
                        {campaignThemes.map(theme => (
                            <SelectItem key={theme.value || 'none'} value={theme.value || 'none'}>{theme.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <p className="text-sm text-muted-foreground">Selecionar um tema altera a aparência da página inicial para refletir a campanha.</p>
            </div>
             <div className="space-y-2">
                <Label>Período da Campanha</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full md:w-[300px] justify-start text-left font-normal",
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
                   Ativar uma campanha e definir descontos irá alterar os preços exibidos na página de planos. Certifique-se de que tudo está correto.
                </AlertDescription>
            </Alert>
        </CardContent>
         <CardFooter className="flex flex-wrap items-center gap-4">
            <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
            </Button>
            <Button onClick={handleNotifyUsers} variant="secondary">
                <Send className="mr-2 h-4 w-4" />
                Notificar Usuários
            </Button>
             <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar Página
                </Link>
            </Button>
        </CardFooter>
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
      </Card>

    </div>
  );
}
