// src/app/(admin)/admin/lp/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Save, Eye, BellRing, Ticket, Newspaper, Construction, Palette, Info } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAppSettings, type PopupType } from "@/contexts/app-settings-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { MaintenancePopup } from "@/components/popups/maintenance-popup";
import { PromotionPopup } from "@/components/popups/promotion-popup";
import { NewsletterPopup } from "@/components/popups/newsletter-popup";


const iconOptions = [
  { value: "Construction", label: "Construção", icon: Construction },
  { value: "Ticket", label: "Ticket", icon: Ticket },
  { value: "Newspaper", label: "Jornal", icon: Newspaper },
  { value: "BellRing", label: "Sino", icon: BellRing },
  { value: "Info", label: "Informação", icon: Info },
];

const colorOptions = [
  { value: "primary", label: "Padrão (Primária)" },
  { value: "destructive", label: "Destrutivo (Vermelho)" },
  { value: "amber", label: "Alerta (Amarelo)" },
  { value: "blue", label: "Informativo (Azul)" },
];

const getLucideIcon = (name: string): React.ElementType => {
    return (LucideIcons as any)[name] || Info;
}

export default function LPEditorPage() {
  const {
    landingPageContent,
    setLandingPageContent,
    activePopup,
    setActivePopup,
    popupConfigs,
    setPopupConfigs,
  } = useAppSettings();

  const [previewPopup, setPreviewPopup] = useState<PopupType>(null);

  useEffect(() => {
    document.title = "Editor da Landing Page - Flortune";
  }, []);

  const handleLpContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLandingPageContent(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handlePopupConfigChange = (popup: PopupType, field: string, value: string) => {
    if (!popup) return;
    setPopupConfigs(prev => ({
        ...prev,
        [popup]: {
            ...prev[popup],
            [field]: value
        }
    }));
  };

  const handleSaveChanges = () => {
    toast({
        title: "Conteúdo Salvo!",
        description: "As alterações na Landing Page foram salvas localmente.",
    });
  };

  const handleActivePopupChange = (value: string) => {
    const newPopup = value === "none" ? null : value as PopupType;
    setActivePopup(newPopup);
  }

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Editor da Landing Page"
          icon={<FileText />}
          description="Altere os textos principais e gerencie os pop-ups da sua página inicial."
          actions={
            <Button variant="outline" asChild>
              <Link href="/" target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Página
              </Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
              <CardTitle>Conteúdo da Página</CardTitle>
              <CardDescription>Edite os textos principais que os visitantes veem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <Tabs defaultValue="hero">
                  <TabsList>
                      <TabsTrigger value="hero">Seção Principal</TabsTrigger>
                      <TabsTrigger value="cta">Chamada Final</TabsTrigger>
                  </TabsList>
                  <TabsContent value="hero" className="pt-4">
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="heroTitle">Título Principal</Label>
                              <Input id="heroTitle" name="heroTitle" value={landingPageContent.heroTitle} onChange={handleLpContentChange} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="heroDescription">Descrição (Parágrafo)</Label>
                              <Textarea id="heroDescription" name="heroDescription" value={landingPageContent.heroDescription} onChange={handleLpContentChange} rows={3} />
                          </div>
                      </div>
                  </TabsContent>
                   <TabsContent value="cta" className="pt-4">
                       <div className="space-y-4">
                          <div className="space-y-2">
                              <Label htmlFor="ctaTitle">Título da Chamada Final</Label>
                              <Input id="ctaTitle" name="ctaTitle" value={landingPageContent.ctaTitle} onChange={handleLpContentChange} />
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="ctaDescription">Descrição da Chamada Final</Label>
                              <Textarea id="ctaDescription" name="ctaDescription" value={landingPageContent.ctaDescription} onChange={handleLpContentChange} rows={3} />
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="ctaButtonText">Texto do Botão Final</Label>
                              <Input id="ctaButtonText" name="ctaButtonText" value={landingPageContent.ctaButtonText} onChange={handleLpContentChange} />
                          </div>
                      </div>
                  </TabsContent>
              </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle>Gerenciador de Pop-ups</CardTitle>
              <CardDescription>Personalize e ative um pop-up para ser exibido aos visitantes na página inicial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div>
                <Label className="font-semibold">Pop-up Ativo</Label>
                <RadioGroup value={activePopup || "none"} onValueChange={handleActivePopupChange} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <Label htmlFor="popup-none" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer", activePopup === null ? "border-primary" : "border-muted")}>
                      <RadioGroupItem value="none" id="popup-none" className="sr-only" />
                      <span className="text-lg font-semibold">Nenhum</span>
                    </Label>
                    {Object.keys(popupConfigs).map(key => {
                        const config = popupConfigs[key as PopupType];
                        const Icon = getLucideIcon(config.icon);
                        return (
                             <Label key={key} htmlFor={`popup-${key}`} className={cn("flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer", activePopup === key ? "border-primary" : "border-muted")}>
                                <RadioGroupItem value={key} id={`popup-${key}`} className="sr-only" />
                                <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
                                <span className="text-sm font-semibold">{config.title}</span>
                            </Label>
                        )
                    })}
                </RadioGroup>
             </div>

              <Tabs defaultValue="maintenance">
                  <TabsList>
                      <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
                      <TabsTrigger value="promotion">Promoção</TabsTrigger>
                      <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
                  </TabsList>
                  {Object.keys(popupConfigs).map(key => {
                      const popupKey = key as PopupType;
                      const config = popupConfigs[popupKey];
                      if(!config) return null;
                      
                      const Icon = getLucideIcon(config.icon);

                      return (
                          <TabsContent key={popupKey} value={popupKey}>
                              <div className="space-y-4 pt-4 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <Label htmlFor={`${popupKey}-title`}>Título do Pop-up</Label>
                                      <Input id={`${popupKey}-title`} value={config.title} onChange={(e) => handlePopupConfigChange(popupKey, 'title', e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor={`${popupKey}-icon`}>Ícone</Label>
                                      <Select value={config.icon} onValueChange={(v) => handlePopupConfigChange(popupKey, 'icon', v)}>
                                          <SelectTrigger id={`${popupKey}-icon`}><SelectValue><div className="flex items-center gap-2"><Icon className="h-4 w-4"/> {iconOptions.find(i=>i.value === config.icon)?.label}</div></SelectValue></SelectTrigger>
                                          <SelectContent>{iconOptions.map(opt => <SelectItem key={opt.value} value={opt.value}><div className="flex items-center gap-2"><opt.icon className="h-4 w-4"/> {opt.label}</div></SelectItem>)}</SelectContent>
                                      </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${popupKey}-description`}>Descrição</Label>
                                    <Textarea id={`${popupKey}-description`} value={config.description} onChange={(e) => handlePopupConfigChange(popupKey, 'description', e.target.value)} rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`${popupKey}-color`}>Cor de Destaque</Label>
                                    <Select value={config.color} onValueChange={(v) => handlePopupConfigChange(popupKey, 'color', v)}>
                                        <SelectTrigger id={`${popupKey}-color`} className="w-full md:w-[240px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{colorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                 <Button variant="secondary" onClick={() => setPreviewPopup(popupKey)}><Eye className="mr-2 h-4 w-4"/> Visualizar Pop-up</Button>
                              </div>
                          </TabsContent>
                      )
                  })}
              </Tabs>
          </CardContent>
          <CardFooter>
              <Button onClick={handleSaveChanges}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Todas as Alterações
              </Button>
          </CardFooter>
        </Card>
      </div>

       <Dialog open={!!previewPopup} onOpenChange={(open) => !open && setPreviewPopup(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
            {previewPopup === 'maintenance' && <MaintenancePopup config={popupConfigs.maintenance} />}
            {previewPopup === 'promotion' && <PromotionPopup config={popupConfigs.promotion} />}
            {previewPopup === 'newsletter' && <NewsletterPopup config={popupConfigs.newsletter} />}
             <DialogClose asChild>
                <Button type="button" variant="outline" className="absolute bottom-4 right-4">Fechar Preview</Button>
            </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
