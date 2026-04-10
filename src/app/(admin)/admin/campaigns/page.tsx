
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShoppingBag, CalendarIcon, Percent, Save, AlertCircle, Eye, Send, Loader2 } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { DateRange } from "react-day-picker";
import { addDays, format, parseISO } from "date-fns";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useAppSettings, type CampaignTheme } from "@/contexts/app-settings-context";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getActiveCampaign, updateCampaign } from "@/services/campaign.service";

const campaignThemes: { value: CampaignTheme | 'none', label: string }[] = [
  { value: 'none', label: 'Nenhuma (Padrão)' },
  { value: 'black-friday', label: 'Black Friday' },
  { value: 'flash-sale', label: 'Promoção Relâmpago' },
  { value: 'super-promocao', label: 'Super Promoção' },
  { value: 'aniversario', label: 'Aniversário' },
];

export default function CampaignsPage() {
  const { activeCampaignTheme, setActiveCampaignTheme } = useAppSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>();
  const [discounts, setDiscounts] = useState<Record<string, number>>({});

  useEffect(() => {
    document.title = "Campanhas Promocionais - Flortune";
    loadCampaign();
  }, []);

  async function loadCampaign() {
    setIsLoading(true);
    const { data, error } = await getActiveCampaign();
    if (data) {
        setActiveCampaignTheme(data.theme as CampaignTheme);
        setDiscounts(data.discounts || {});
        if (data.start_date && data.end_date) {
            setDate({
                from: parseISO(data.start_date),
                to: parseISO(data.end_date)
            });
        }
    }
    setIsLoading(false);
  }
  
  const handleThemeChange = (value: string) => {
    const theme = value === 'none' ? null : value as CampaignTheme;
    setActiveCampaignTheme(theme);
  }

  const handleDiscountChange = (planId: string, value: string) => {
    setDiscounts(prev => ({
        ...prev,
        [planId]: parseInt(value) || 0
    }));
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const { error } = await updateCampaign({
        theme: activeCampaignTheme,
        start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : null,
        end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : null,
        discounts: discounts
    });

    if (error) {
        toast({ title: "Erro ao Salvar", description: error, variant: "destructive" });
    } else {
        toast({ title: "Campanha Atualizada!", description: "As configurações foram salvas no banco de dados." });
    }
    setIsSaving(false);
  }

  if (isLoading) {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1850px] mx-auto w-full">
      <PageHeader
        title="Campanhas Promocionais"
        icon={<ShoppingBag />}
        description="Configure descontos, temas e o período de campanhas promocionais reais."
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
                            <>{format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}</>
                        ) : (
                            format(date.from, "dd/MM/yy")
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
                   Ativar uma campanha altera os preços exibidos na Landing Page para todos os visitantes.
                </AlertDescription>
            </Alert>
        </CardContent>
         <CardFooter className="flex flex-wrap items-center gap-4">
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Salvar Alterações
            </Button>
             <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                    <Eye className="mr-2 h-4 w-4" />
                    Visualizar Landing Page
                </Link>
            </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Descontos por Plano</CardTitle>
            <CardDescription>Defina o desconto real em porcentagem para cada plano.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRICING_TIERS.filter(t => t.priceMonthly !== 'Grátis').map(tier => (
                <div key={tier.id} className="space-y-2 border p-4 rounded-lg">
                    <Label htmlFor={`discount-${tier.id}`} className="font-semibold">{tier.name}</Label>
                    <div className="relative">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id={`discount-${tier.id}`} 
                            type="number" 
                            placeholder="Ex: 25" 
                            className="pl-10" 
                            value={discounts[tier.id] || ''}
                            onChange={(e) => handleDiscountChange(tier.id, e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Preço Base: {tier.priceMonthly}</p>
                </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
