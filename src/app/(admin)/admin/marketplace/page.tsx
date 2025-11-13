// src/app/(admin)/admin/marketplace/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Store, Check, PlusCircle, Gem, Edit, Trash2, AlertTriangle } from "lucide-react";
import { APP_NAME, PRICING_TIERS, type PricingTier, type PricingTierIconName } from "@/lib/constants";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductEditorDialog } from "@/components/admin/marketplace/product-editor-dialog";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return Gem;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Gem;
};

export default function MarketplacePage() {
  const [products, setProducts] = useState<PricingTier[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PricingTier | null>(null);
  const [productToDelete, setProductToDelete] = useState<PricingTier | null>(null);

  useEffect(() => {
    document.title = "Produtos (Marketplace) - Flortune";
    setIsClient(true);
    try {
      const storedProducts = localStorage.getItem("flortune-products");
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(PRICING_TIERS); // Carrega os padrões se não houver nada salvo
      }
    } catch (e) {
      console.error("Failed to load products from localStorage", e);
      setProducts(PRICING_TIERS);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("flortune-products", JSON.stringify(products));
    }
  }, [products, isClient]);

  const handleOpenEditor = (product: PricingTier | null) => {
    setEditingProduct(product);
    setIsEditorOpen(true);
  };
  
  const handleSaveProduct = (productData: PricingTier) => {
    if(editingProduct) {
        setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
        toast({ title: "Produto Atualizado!", description: `O plano "${productData.name}" foi salvo.`});
    } else {
        setProducts(prev => [...prev, productData]);
        toast({ title: "Produto Criado!", description: `O plano "${productData.name}" foi adicionado.`});
    }
    setIsEditorOpen(false);
  };
  
  const handleDeleteConfirm = () => {
    if(productToDelete) {
        setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
        toast({ title: "Produto Removido!", variant: "destructive"});
        setProductToDelete(null);
    }
  };

  const handleToggleActive = (productId: string, isActive: boolean) => {
    setProducts(prev => prev.map(p => p.id === productId ? {...p, active: isActive} : p));
  };


  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Produtos (Marketplace)"
          icon={<Store />}
          description="Gerencie os planos e produtos oferecidos aos usuários do Flortune."
          actions={<Button onClick={() => handleOpenEditor(null)}><PlusCircle className="mr-2 h-4 w-4"/>Criar Novo Produto</Button>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(tier => {
              const TierIcon = getPricingIcon(tier.icon as PricingTierIconName);
              const isPaidPlan = tier.priceMonthly !== 'Grátis';
              return (
                <Card key={tier.id} className={cn("flex flex-col transition-all", tier.featured && "border-primary ring-2 ring-primary", !tier.active && "opacity-60 bg-muted/50")}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", tier.featured ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <TierIcon className="h-6 w-6" />
                        </div>
                        <CardTitle className="font-headline text-lg">{tier.name}</CardTitle>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`active-switch-${tier.id}`} className="text-xs text-muted-foreground">Ativo</Label>
                          <Switch id={`active-switch-${tier.id}`} checked={tier.active} onCheckedChange={(checked) => handleToggleActive(tier.id, checked)} />
                        </div>
                      </div>
                    </div>
                    <CardDescription className="text-sm min-h-[60px]">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-4">
                      <span className="text-3xl font-bold">{tier.priceMonthly}</span>
                      <span className="text-muted-foreground text-sm">{isPaidPlan ? (tier.priceAnnotation || '/mês') : ''}</span>
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
                  <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-4">
                      <Button variant="ghost" size="sm" onClick={() => setProductToDelete(tier)}><Trash2 className="mr-2 h-4 w-4"/>Excluir</Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditor(tier)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
      </div>
      <ProductEditorDialog 
        isOpen={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                    Tem certeza que deseja excluir o plano "{productToDelete?.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className={buttonVariants({variant: "destructive"})}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
