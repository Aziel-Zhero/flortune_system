
"use client";

import { useState, useEffect } from "react";
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
  onOpenChange: (open: boolean) => void;
}

export function WeatherSettingsDialog({ isOpen, onOpenChange }: WeatherSettingsDialogProps) {
  const { weatherCity, setWeatherCity, loadWeatherForCity, isLoadingWeather } = useAppSettings();
  const [cityInput, setCityInput] = useState(weatherCity || "");

  useEffect(() => {
    // Sync local state if the context's city changes from outside
    if (isOpen) {
      setCityInput(weatherCity || "");
    }
  }, [isOpen, weatherCity]);

  const handleSave = () => {
    const trimmed = cityInput.trim();
    if (trimmed) {
      setWeatherCity(trimmed);
      loadWeatherForCity(trimmed);
      toast({ title: "Cidade salva!", description: `Buscando clima para ${trimmed}.` });
    } else {
      setWeatherCity(null);
      toast({ title: "Cidade removida", description: "A exibição do clima foi desativada." });
    }
    onOpenChange(false);
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
            Insira o nome da sua cidade para ver o clima na barra lateral. Deixe em branco para desativar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoadingWeather}>
              {isLoadingWeather ? "Carregando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
