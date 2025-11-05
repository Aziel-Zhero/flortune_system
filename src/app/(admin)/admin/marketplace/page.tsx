// src/app/(admin)/admin/marketplace/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Store, Edit, Check, PlusCircle, Trash2 } from "lucide-react";
import { APP_NAME, PRICING_TIERS as INITIAL_PRICING_TIERS, type PricingTierIconName } from "@/lib/constants";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";


const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return Store;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Store;
};

// --- Tipos e Schema ---
interface Tier {
  id: string;
  name: string;
  href: string;
  priceMonthly: string;
  priceAnnotation?: string;
  description: string;
  features: string[];
  featured: boolean;
  icon: PricingTierIconName;
  active: boolean; // Novo campo
}

const tierSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  priceMonthly: z.string().min(1, "O preço é obrigatório."),
  priceAnnotation: z.string().optional(),
  features: z.string().min(1, "Adicione pelo menos uma funcionalidade."),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  icon: z.string().min(1, "Selecione um ícone.")
});
type TierFormData = z.infer<typeof tierSchema>;

const defaultTierIds = INITIAL_PRICING_TIERS.map(t => t.id);

export default function MarketplacePage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [deletingTier, setDeletingTier] = useState<Tier | null>(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<TierFormData>({
    resolver: zodResolver(tierSchema)
  });

  useEffect(() => {
    setIsClient(true);
    document.title = "Produtos (Marketplace) - Flortune";
    try {
      const storedTiers = localStorage.getItem("flortune-marketplace-tiers");
      if (storedTiers) {
        setTiers(JSON.parse(storedTiers));
      } else {
        const initialTiersWithStatus = INITIAL_PRICING_TIERS.map(tier => ({...tier, active: true}));
        setTiers(initialTiersWithStatus);
      }
    } catch (e) {
      console.error("Falha ao carregar tiers do localStorage", e);
      setTiers(INITIAL_PRICING_TIERS.map(tier => ({...tier, active: true})));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("flortune-marketplace-tiers", JSON.stringify(tiers));
    }
  }, [tiers, isClient]);

  const handleOpenModal = (tier: Tier | null) => {
    setEditingTier(tier);
    if (tier) {
      reset({
        ...tier,
        features: tier.features.join('\n'),
      });
    } else {
      reset({
        name: "",
        description: "",
        priceMonthly: "",
        priceAnnotation: "",
        features: "",
        featured: false,
        active: true,
        icon: "Gem"
      });
    }
    setIsModalOpen(true);
  }

  const handleSaveChanges: SubmitHandler<TierFormData> = (data) => {
    if (editingTier) {
      setTiers(currentTiers =>
        currentTiers.map(t =>
          t.id === editingTier.id
            ? {
                ...t,
                ...data,
                features: data.features.split('\n').filter(f => f.trim() !== ""),
                icon: data.icon as PricingTierIconName,
              }
            : t
        )
      );
      toast({ title: `Plano "${data.name}" Atualizado!` });
    } else {
      const newTier: Tier = {
        id: `tier_${Date.now()}`,
        href: `/signup?plan=${data.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...data,
        features: data.features.split('\n').filter(f => f.trim() !== ""),
        icon: data.icon as PricingTierIconName,
      };
      setTiers(prev => [newTier, ...prev]);
      toast({ title: "Novo Plano Criado!" });
    }
    setIsModalOpen(false);
  };
  
  const handleToggleActive = (tierId: string, active: boolean) => {
      setTiers(prevTiers => prevTiers.map(t => t.id === tierId ? {...t, active} : t));
      toast({title: `Plano ${active ? "ativado" : "desativado"} com sucesso.`});
  }

  const handleConfirmDelete = () => {
    if (deletingTier) {
      setTiers(prevTiers => prevTiers.filter(t => t.id !== deletingTier.id));
      toast({ title: "Plano Deletado", description: `O plano "${deletingTier.name}" foi removido.`, variant: "destructive" });
      setDeletingTier(null);
    }
  };


  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Produtos (Marketplace)"
          icon={<Store />}
          description="Gerencie os planos e produtos oferecidos aos usuários do Flortune."
          actions={<Button onClick={() => handleOpenModal(null)}><PlusCircle className="mr-2 h-4 w-4"/>Criar Novo Produto</Button>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tiers.map(tier => {
            const TierIcon = getPricingIcon(tier.icon as PricingTierIconName);
            const isDefault = defaultTierIds.includes(tier.id);
            return (
              <Card key={tier.id} className={cn("flex flex-col transition-opacity", !tier.active && "opacity-60")}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-headline text-lg">{tier.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={tier.active ? 'default' : 'secondary'} className={cn(!tier.active && "bg-gray-500", "hidden md:block")}>{tier.active ? "Ativo" : "Inativo"}</Badge>
                         <Switch
                            checked={tier.active}
                            onCheckedChange={(checked) => handleToggleActive(tier.id, checked)}
                            aria-label={tier.active ? "Desativar plano" : "Ativar plano"}
                         />
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
                <CardFooter className="gap-2">
                  <Button variant="outline" className="w-full" onClick={() => handleOpenModal(tier)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  {!isDefault && (
                    <Button variant="destructive-outline" size="icon" onClick={() => setDeletingTier(tier)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingTier ? "Editar Plano" : "Criar Novo Plano"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleSaveChanges)} className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="formName">Nome do Plano</Label>
              <Input id="formName" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="formDescription">Descrição</Label>
              <Textarea id="formDescription" {...register("description")} />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="formPrice">Preço (Ex: Grátis, R$19,90)</Label>
                    <Input id="formPrice" {...register("priceMonthly")} />
                    {errors.priceMonthly && <p className="text-sm text-destructive mt-1">{errors.priceMonthly.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="formPriceAnnotation">Anotação do Preço (Ex: /mês)</Label>
                    <Input id="formPriceAnnotation" {...register("priceAnnotation")} />
                </div>
             </div>
            <div className="space-y-2">
              <Label htmlFor="formFeatures">Funcionalidades (uma por linha)</Label>
              <Textarea
                id="formFeatures"
                {...register("features")}
                rows={6}
                placeholder="Funcionalidade 1&#10;Funcionalidade 2&#10;Funcionalidade 3"
              />
              {errors.features && <p className="text-sm text-destructive mt-1">{errors.features.message}</p>}
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Ícone</Label>
                    <Controller
                        name="icon"
                        control={control}
                        render={({ field }) => (
                            <select {...field} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                                {Object.keys(LucideIcons).filter(k => /^[A-Z]/.test(k)).map(iconName => (
                                    <option key={iconName} value={iconName}>{iconName}</option>
                                ))}
                            </select>
                        )}
                    />
                </div>
                <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2"><Controller name="featured" control={control} render={({ field }) => <Checkbox id="featured" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="featured">Plano em Destaque</Label></div>
                    <div className="flex items-center space-x-2"><Controller name="active" control={control} render={({ field }) => <Checkbox id="active" checked={field.value} onCheckedChange={field.onChange} />} /><Label htmlFor="active">Plano Ativo</Label></div>
                </div>
            </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTier} onOpenChange={(open) => !open && setDeletingTier(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>Tem certeza que deseja excluir o plano "{deletingTier?.name}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingTier(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
