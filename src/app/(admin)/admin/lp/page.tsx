// src/app/(admin)/admin/lp/page.tsx
"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Save, Eye, BellRing, Ticket, Newspaper, Construction, Palette, Info, Ban, Upload, Send } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useAppSettings, type PopupType } from "@/contexts/app-settings-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

  const [previewPopup, setPreviewPopup] = useState<PopupType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result;
        if (typeof result === 'string') {
          setLandingPageContent(prev => ({
            ...prev,
            heroImageUrl: result,
          }));
          toast({ title: "Imagem Carregada", description: "A nova imagem está pronta para ser salva." });
        }
      };
      reader.onerror = () => {
        toast({ title: "Erro ao Ler Imagem", description: "Não foi possível carregar o arquivo de imagem.", variant: "destructive" });
      }
      reader.readAsDataURL(file);
    }
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

  const handleTabChange = (value: string) => {
    const newPopup = value === "none" ? null : value as PopupType;
    setActivePopup(newPopup);
  }
  
  const handleNotifyPopup = (popupKey: PopupType) => {
    const config = popupConfigs[popupKey];
    toast({
      title: `Notificando sobre: ${config.title}`,
      description: "Uma notificação seria enviada para os usuários sobre este pop-up.",
    });
  };

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
                      <TabsTrigger value="hero">Seção Principal (Hero)</TabsTrigger>
                      <TabsTrigger value="cta">Chamada Final (CTA)</TabsTrigger>
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
                          <div className="space-y-2">
                            <Label>Imagem Principal</Label>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="relative w-48 h-auto aspect-video rounded-md overflow-hidden border">
                                <Image src={landingPageContent.heroImageUrl} alt="Preview da imagem principal" layout="fill" objectFit="cover" />
                              </div>
                              <Input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageChange}
                              />
                              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Trocar Imagem
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Recomendado: 800x450px.</p>
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
              <CardDescription>Clique na aba para ativar e editar o pop-up correspondente.</CardDescription>
          </CardHeader>
          <CardContent>
              <Tabs value={activePopup || "none"} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                      <TabsTrigger value="none" className="flex-col h-auto py-2"><Ban className="mb-1 h-5 w-5"/>Nenhum</TabsTrigger>
                      <TabsTrigger value="maintenance" className="flex-col h-auto py-2"><Construction className="mb-1 h-5 w-5"/>Manutenção</TabsTrigger>
                      <TabsTrigger value="promotion" className="flex-col h-auto py-2"><Ticket className="mb-1 h-5 w-5"/>Promoção</TabsTrigger>
                      <TabsTrigger value="newsletter" className="flex-col h-auto py-2"><Newspaper className="mb-1 h-5 w-5"/>Newsletter</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="none" className="text-center py-10 border-t mt-2">
                    <p className="text-muted-foreground">Nenhum pop-up está ativo no momento.</p>
                  </TabsContent>
                  
                  {Object.keys(popupConfigs).map(key => {
                      const popupKey = key as PopupType;
                      const config = popupConfigs[popupKey];
                      if(!config) return null;
                      
                      const Icon = getLucideIcon(config.icon);

                      return (
                          <TabsContent key={popupKey} value={popupKey}>
                              <div className="space-y-4 pt-4 border-t mt-2">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                                    <div className="space-y-2">
                                        <Label htmlFor={`${popupKey}-color`}>Cor de Destaque</Label>
                                        <Select value={config.color} onValueChange={(v) => handlePopupConfigChange(popupKey, 'color', v as any)}>
                                            <SelectTrigger id={`${popupKey}-color`} className="w-full"><SelectValue /></SelectTrigger>
                                            <SelectContent>{colorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="secondary" onClick={() => setPreviewPopup(popupKey)}><Eye className="mr-2 h-4 w-4"/> Visualizar</Button>
                                    <Button variant="secondary" onClick={() => handleNotifyPopup(popupKey)}><Send className="mr-2 h-4 w-4"/> Notificar</Button>
                                </div>
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
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader className="sr-only">
              <DialogTitle>Pré-visualização do Pop-up</DialogTitle>
              <DialogDescription>Este é um preview de como o pop-up aparecerá para o usuário.</DialogDescription>
            </DialogHeader>
            {previewPopup === 'maintenance' && <MaintenancePopup config={popupConfigs.maintenance} onDismiss={() => setPreviewPopup(null)} />}
            {previewPopup === 'promotion' && <PromotionPopup config={popupConfigs.promotion} onDismiss={() => setPreviewPopup(null)} />}
            {previewPopup === 'newsletter' && <NewsletterPopup config={popupConfigs.newsletter} onDismiss={() => setPreviewPopup(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
