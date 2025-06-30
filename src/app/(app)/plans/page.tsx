
// src/app/(app)/plans/page.tsx
"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Check, Gem, Leaf, BrainCircuit, Briefcase, Code } from "lucide-react";
import Link from "next/link";
import { APP_NAME, PRICING_TIERS, type PricingTierIconName } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import * as LucideIcons from "lucide-react";

const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return Gem;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Gem;
};

export default function PlansPage() {
  useEffect(() => {
    document.title = `Nossos Planos - ${APP_NAME}`;
  }, []);

  return (
    <div>
      <PageHeader
        title="Nossos Planos"
        description={`Escolha o plano ${APP_NAME} que melhor se adapta às suas necessidades e comece a cultivar um futuro financeiro mais próspero.`}
        icon={<Gem className="mr-2 h-6 w-6 text-primary" />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8 items-stretch">
        {PRICING_TIERS.map((tier) => {
          const TierIcon = getPricingIcon(tier.icon as PricingTierIconName);
          return (
            <Card
              key={tier.id}
              className={cn(
                "flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300",
                tier.featured ? "border-primary ring-2 ring-primary bg-primary/5" : "border-border"
              )}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg",
                      tier.featured ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                      <TierIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className={cn("font-headline text-xl", tier.featured ? "text-primary" : "text-foreground")}>
                    {tier.name}
                  </CardTitle>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-1">
                  <span className={cn("text-4xl font-bold tracking-tight", tier.featured ? "text-primary" : "text-foreground")}>
                    {tier.priceMonthly}
                  </span>
                  {tier.priceMonthly !== 'Grátis' && tier.priceAnnotation && (
                    <span className="text-sm font-normal text-muted-foreground">{tier.priceAnnotation}</span>
                  )}
                   {tier.priceMonthly !== 'Grátis' && !tier.priceAnnotation && (
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  )}
                </div>
                <CardDescription className="pt-2 text-sm min-h-[60px]">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul role="list" className="space-y-2.5 text-sm text-muted-foreground">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3 items-start">
                      <Check
                        className={cn("h-5 w-5 flex-none mt-0.5", tier.featured ? "text-primary" : "text-green-500")}
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    "w-full",
                    tier.featured ? buttonVariants({variant: "default"}) : buttonVariants({variant: "outline"})
                  )}
                >
                  <Link href={tier.href}>
                    {tier.priceMonthly === 'Grátis' ? 'Começar Agora' : tier.id.includes('corporativo') ? 'Contatar Vendas' : 'Assinar Plano'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card className="mt-12 bg-gradient-to-r from-primary/10 via-background to-accent/10 border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-center text-2xl">Dúvidas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-muted-foreground">
          <p><strong>Posso cancelar quando quiser?</strong> Sim, você pode cancelar sua assinatura a qualquer momento.</p>
          <p><strong>Como funciona o suporte?</strong> O plano Mestre Jardineiro e Corporativo oferecem suporte prioritário e dedicado, respectivamente.</p>
          <p><strong>Preciso de ajuda para escolher um plano?</strong> <Link href="#" className="text-primary hover:underline" onClick={(e) => {e.preventDefault(); alert("Página de contato em desenvolvimento.")}}>Entre em contato conosco!</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
