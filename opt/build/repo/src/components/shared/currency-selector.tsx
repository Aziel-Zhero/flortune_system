// src/components/shared/currency-selector.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Euro, CircleDollarSign } from "lucide-react";

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CurrencySelector({ value, onChange, className }: CurrencySelectorProps) {
  return (
    <div className={className}>
      <Label htmlFor="currency-selector" className="text-xs text-muted-foreground">Moeda para Cálculo</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="currency-selector" className="w-full md:w-[180px] h-9">
          <SelectValue placeholder="Selecione a moeda" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="BRL">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4" /> BRL (Real Brasileiro)
            </div>
          </SelectItem>
          <SelectItem value="USD">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> USD (Dólar Americano)
            </div>
          </SelectItem>
          <SelectItem value="EUR">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4" /> EUR (Euro)
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
