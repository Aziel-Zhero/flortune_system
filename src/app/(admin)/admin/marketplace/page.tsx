// src/app/(admin)/admin/marketplace/page.tsx
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

// Definindo tipo para o Tier para facilitar
type Tier = typeof PRICING_TIERS[number];

export default function MarketplacePage() {
  const [tiers, setTiers] = useState<Tier[]>(PRICING_TIERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);

  // Campos do formulário
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formFeatures, setFormFeatures] = useState("");

  const handleEdit = (tier: Tier) => {
    setEditingTier(tier);
    setFormName(tier.name);
    setFormDescription(tier.description);
    setFormPrice(tier.priceMonthly);
    setFormFeatures(tier.features.join('\n'));
    setIsModalOpen(true);
  }

  const handleSaveChanges = () => {
    if (!editingTier) return;

    setTiers(currentTiers =>
      currentTiers.map(t =>
        t.id === editingTier.id
          ? {
              ...t,
              name: formName,
              description: formDescription,
              priceMonthly: formPrice,
              features: formFeatures.split('\n').filter(f => f.trim() !== ""),
            }
          : t
      )
    );

    toast({
        title: `Plano "${formName}" Atualizado!`,
        description: "As informações do plano foram salvas com sucesso (simulação).",
    });
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Produtos (Marketplace)"
          icon={<Store />}
          description="Gerencie os planos e produtos oferecidos aos usuários do Flortune."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tiers.map(tier => {
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
                  <Button variant="outline" className="w-full" onClick={() => handleEdit(tier)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Plano
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Editar Plano: {editingTier?.name}</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias nas informações do plano.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="formName">Nome do Plano</Label>
              <Input id="formName" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formDescription">Descrição</Label>
              <Textarea id="formDescription" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formPrice">Preço (Ex: Grátis, R$19,90)</Label>
              <Input id="formPrice" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formFeatures">Funcionalidades (uma por linha)</Label>
              <Textarea
                id="formFeatures"
                value={formFeatures}
                onChange={(e) => setFormFeatures(e.target.value)}
                rows={8}
                placeholder="Funcionalidade 1&#10;Funcionalidade 2&#10;Funcionalidade 3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveChanges}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
