// src/app/(admin)/admin/lp/page.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Save, Eye, BellRing, Ticket, Newspaper } from "lucide-react";
import { useAppSettings, type PopupType } from "@/contexts/app-settings-context";
import { toast } from "@/hooks/use-toast";

export default function LPEditorPage() {
  const {
    landingPageContent,
    setLandingPageContent,
    activePopup,
    setActivePopup
  } = useAppSettings();

  useEffect(() => {
    document.title = "Editor da Landing Page - Flortune";
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLandingPageContent(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
    // A lógica de salvar já está no context (localStorage)
    toast({
        title: "Conteúdo Salvo!",
        description: "As alterações na Landing Page foram salvas localmente.",
    });
  };

  const handlePopupChange = (value: string) => {
    const newPopup = value === "none" ? null : value as PopupType;
    setActivePopup(newPopup);
  }

  return (
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
            <CardTitle>Conteúdo da Seção Principal (Hero)</CardTitle>
            <CardDescription>Edite o título e o parágrafo de introdução que os visitantes veem primeiro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="heroTitle">Título Principal</Label>
                <Input
                    id="heroTitle"
                    name="heroTitle"
                    value={landingPageContent.heroTitle}
                    onChange={handleContentChange}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="heroDescription">Descrição (Parágrafo)</Label>
                <Textarea
                    id="heroDescription"
                    name="heroDescription"
                    value={landingPageContent.heroDescription}
                    onChange={handleContentChange}
                    rows={4}
                />
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Gerenciador de Pop-ups</CardTitle>
            <CardDescription>Ative um pop-up para ser exibido aos visitantes na página inicial. Apenas um pode estar ativo por vez.</CardDescription>
        </CardHeader>
        <CardContent>
           <RadioGroup
              value={activePopup || "none"}
              onValueChange={handlePopupChange}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Label htmlFor="popup-none" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="none" id="popup-none" className="sr-only" />
                <span className="text-xl font-semibold">Nenhum Pop-up</span>
                <span className="text-sm text-muted-foreground mt-1">Desativar todos</span>
              </Label>
               <Label htmlFor="popup-maintenance" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="maintenance" id="popup-maintenance" className="sr-only" />
                 <BellRing className="mb-3 h-6 w-6" />
                <span className="text-lg font-semibold">Manutenção</span>
              </Label>
              <Label htmlFor="popup-promotion" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="promotion" id="popup-promotion" className="sr-only" />
                <Ticket className="mb-3 h-6 w-6" />
                <span className="text-lg font-semibold">Promoção</span>
              </Label>
              <Label htmlFor="popup-newsletter" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <RadioGroupItem value="newsletter" id="popup-newsletter" className="sr-only" />
                <Newspaper className="mb-3 h-6 w-6" />
                <span className="text-lg font-semibold">Newsletter</span>
              </Label>
            </RadioGroup>
        </CardContent>
         <CardFooter>
            <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
