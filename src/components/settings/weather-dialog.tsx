
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Thermometer } from "lucide-react";
import { useAppSettings } from "@/contexts/app-settings-context";
import { toast } from "@/hooks/use-toast";

interface WeatherSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function WeatherSettingsDialog({ isOpen, onOpenChange }: WeatherSettingsDialogProps) {
  const { weatherCity, setWeatherCity, isLoadingWeather } = useAppSettings();
  const [cityInput, setCityInput] = useState(weatherCity || "");

  const handleSave = () => {
    if (cityInput.trim()) {
      setWeatherCity(cityInput.trim());
      toast({ title: "Cidade Salva!", description: `Clima para ${cityInput.trim()} será exibido.` });
      onOpenChange(false);
    } else {
      toast({ title: "Cidade Inválida", description: "Por favor, insira um nome de cidade.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center">
            <Thermometer className="mr-2 h-5 w-5 text-primary" />
            Configurar Clima
          </DialogTitle>
          <DialogDescription>
            Insira o nome da sua cidade para ver o clima na barra lateral.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="city-input">Nome da Cidade</Label>
            <Input
              id="city-input"
              placeholder="Ex: São Paulo, BR"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={isLoadingWeather}>
            {isLoadingWeather ? "Carregando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
