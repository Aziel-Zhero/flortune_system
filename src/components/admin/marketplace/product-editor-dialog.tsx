// src/components/admin/marketplace/product-editor-dialog.tsx
"use client";

import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { PricingTier } from "@/lib/constants";
import { Gem } from "lucide-react";

interface ProductEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: PricingTier | null;
  onSave: (data: PricingTier) => void;
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "O nome do plano é obrigatório."),
  description: z.string().min(10, "A descrição é obrigatória."),
  priceMonthly: z.string().min(1, "O preço é obrigatório."),
  priceAnnotation: z.string().optional(),
  features: z.string().min(1, "Adicione pelo menos uma funcionalidade."),
  icon: z.string().default("Gem"),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  href: z.string().url("A URL do link de compra deve ser válida."),
  stripePriceId: z.string().optional().nullable(),
});

type ProductFormData = z.infer<typeof productSchema>;

const iconOptions = Object.keys(LucideIcons).filter(key => /^[A-Z]/.test(key));

export function ProductEditorDialog({ isOpen, onOpenChange, product, onSave }: ProductEditorDialogProps) {
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });
  
  useEffect(() => {
    if (isOpen && product) {
      reset({
        ...product,
        features: product.features.join('\n'), // Convert array to string for textarea
      });
    } else if (isOpen && !product) {
      reset({
        id: `tier_${Date.now()}`,
        name: "",
        description: "",
        priceMonthly: "",
        priceAnnotation: "",
        features: "",
        icon: "Gem",
        featured: false,
        active: true,
        href: 'https://buy.stripe.com/test_',
        stripePriceId: null,
      });
    }
  }, [isOpen, product, reset]);

  const onSubmit: SubmitHandler<ProductFormData> = (data) => {
    const { id, ...restOfData } = data;
    const finalData: PricingTier = {
        id: product?.id || id || `tier_${Date.now()}`,
        ...restOfData,
        features: data.features.split('\n').map(f => f.trim()).filter(f => f),
        stripePriceId: data.stripePriceId ?? null,
    };
    onSave(finalData);
  };
  
  const watchedIcon = watch('icon');
  const IconPreviewComponent = (LucideIcons as any)[watchedIcon] || Gem;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{product ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
          <DialogDescription>
            Gerencie os detalhes do plano de assinatura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-grow overflow-y-auto pr-2 space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome do Plano</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="priceMonthly">Preço Mensal (texto)</Label>
                <Input id="priceMonthly" {...register("priceMonthly")} placeholder="Ex: R$19,90 ou Grátis"/>
                {errors.priceMonthly && <p className="text-sm text-destructive mt-1">{errors.priceMonthly.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="priceAnnotation">Anotação do Preço</Label>
                <Input id="priceAnnotation" {...register("priceAnnotation")} placeholder="Ex: por usuário/mês"/>
            </div>
             <div className="space-y-2">
                <Label htmlFor="icon">Ícone</Label>
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        {IconPreviewComponent && <IconPreviewComponent className="h-6 w-6"/>}
                    </div>
                    <Controller name="icon" control={control} render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent className="max-h-60">{iconOptions.map(iconName => <SelectItem key={iconName} value={iconName}>{iconName}</SelectItem>)}</SelectContent></Select>
                    )}/>
                </div>
                 {errors.icon && <p className="text-sm text-destructive mt-1">{errors.icon.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} rows={3}/>
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="features">Funcionalidades (uma por linha)</Label>
            <Textarea id="features" {...register("features")} rows={5}/>
            {errors.features && <p className="text-sm text-destructive mt-1">{errors.features.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="href">URL de Compra (Stripe)</Label>
            <Input id="href" {...register("href")} />
            {errors.href && <p className="text-sm text-destructive mt-1">{errors.href.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Controller name="featured" control={control} render={({ field }) => (<Checkbox id="featured" checked={field.value} onCheckedChange={field.onChange} />)} />
            <Label htmlFor="featured" className="font-normal">Marcar como plano em destaque</Label>
          </div>

          <DialogFooter className="mt-auto pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit">Salvar Produto</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
