// src/app/(admin)/admin/marketplace/page.tsx
"use client";

import { useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Check, PlusCircle } from "lucide-react";
import { APP_NAME, PRICING_TIERS, type PricingTierIconName } from "@/lib/constants";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return Store;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Store;
};

export default function MarketplacePage() {
  useEffect(() => {
    document.title = "Produtos (Marketplace) - Flortune";
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Produtos (Marketplace)"
        icon={<Store />}
        description="Gerencie os planos e produtos oferecidos aos usuários do Flortune."
        actions={<Button><PlusCircle className="mr-2 h-4 w-4"/>Criar Novo Produto</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map(tier => {
            const TierIcon = getPricingIcon(tier.icon as PricingTierIconName);
            return (
              <Card key={tier.id} className={cn("flex flex-col", tier.featured && "border-primary ring-2 ring-primary")}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-lg">{tier.name}</CardTitle>
                    <TierIcon className="h-6 w-6 text-muted-foreground"/>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{tier.priceMonthly}</span>
                    <span className="text-muted-foreground text-sm">{tier.priceMonthly !== 'Grátis' ? (tier.priceAnnotation || '/mês') : ''}</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-1 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
    </div>
  );
}
