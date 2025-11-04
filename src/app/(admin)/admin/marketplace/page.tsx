// src/app/(admin)/admin/marketplace/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Edit, Check } from "lucide-react";
import { APP_NAME, PRICING_TIERS, type PricingTierIconName } from "@/lib/constants";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return Store;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Store;
};

export default function MarketplacePage() {

  const handleEdit = (planName: string) => {
    toast({
        title: `Edição de Plano (Simulação)`,
        description: `A funcionalidade para editar o plano "${planName}" seria aberta.`,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Marketplace de Produtos"
        icon={<Store />}
        description="Gerencie os planos e produtos oferecidos aos usuários do Flortune."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {PRICING_TIERS.map(tier => {
          const TierIcon = getPricingIcon(tier.icon as PricingTierIconName);
          return (
            <Card key={tier.id} className="flex flex-col">
              <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-lg">{tier.name}</CardTitle>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-foreground", tier.featured ? "bg-primary/20 text-primary" : "bg-muted")}>
                        <TierIcon className="h-6 w-6" />
                    </div>
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
                      <Check className="h-4 w-4 mt-1 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleEdit(tier.name)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Plano
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
