// src/app/(app)/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, ShieldCheck, Palette, Briefcase, LogOut, UploadCloud, DownloadCloud, Share2, CheckSquare, Settings2, Mountain, Wind, Sun, Zap, Droplets, Sparkles, MapPin, BarChart3 } from "lucide-react";
import { useAppSettings } from '@/contexts/app-settings-context';
import { toast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { ShareModuleDialog } from '@/components/settings/share-module-dialog';
import { cn } from "@/lib/utils";
import { WeatherSettingsDialog } from '@/components/settings/weather-dialog';
import { QuoteSettingsDialog } from '@/components/settings/quote-dialog';
import { useRouter } from 'next/navigation';

interface ThemeOption {
  name: string;
  id: string;
  icon: React.ElementType; // Lucide Icon
  description: string;
  iconClassName?: string; // Opcional: para cores específicas de ícones
}

const availableThemes: ThemeOption[] = [
  { name: "Verde Flortune", id: "default", icon: Sparkles, description: "O tema padrão, fresco e original do Flortune.", iconClassName: "text-primary" },
  { name: "Rio da Serra", id: "theme-rio-da-serra", icon: Droplets, description: "Um tema calmo e profissional com tons de azul clássico.", iconClassName: "text-blue-500 dark:text-blue-400" },
  { name: "Aurora Dourada", id: "theme-golden-dawn", icon: Sun, description: "Um tema claro e vibrante com destaques dourados.", iconClassName: "text-yellow-500 dark:text-yellow-400" },
  { name: "Mística Nebulosa", id: "theme-mystic-nebula", icon: Zap, description: "Um tema envolvente com tons profundos e mágicos de roxo.", iconClassName: "text-purple-500 dark:text-purple-400" },
  { name: "Amanhecer", id: "theme-amanhecer", icon: Wind, description: "Cores suaves de um amanhecer, com gradientes.", iconClassName: "text-pink-500 dark:text-pink-400" },
  { name: "Terra Vermelha", id: "theme-terra-vermelha", icon: Mountain, description: "Tons quentes e terrosos de vermelho e argila.", iconClassName: "text-red-600 dark:text-red-500" },
];


export default function SettingsPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, currentTheme, applyTheme } = useAppSettings();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isWeatherDialogOpen, setIsWeatherDialogOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  
  useEffect(() => {
    document.title = `Configurações - ${APP_NAME}`;
  }, []);

  const handleFeatureClick = (featureName: string, isPlaceholder: boolean = true) => {
    toast({ 
      title: `Ação: ${featureName}`, 
      description: isPlaceholder ? `Funcionalidade "${featureName}" (placeholder).` : `${featureName} foi ativado/desativado.`
    });
  };

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId); 
    toast({ title: "Tema Alterado", description: `Tema "${availableThemes.find(t => t.id === themeId)?.name}" aplicado.`, action: <CheckSquare className="text-green-500"/> });
  };
  
  const handleLogout = () => {
    toast({ title: "Saindo...", description: "Você está sendo desconectado (simulação)." });
    router.push('/login');
  };

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Configurações da Aplicação"
          description="Gerencie as preferências, aparência e configurações do aplicativo."
          icon={<Settings2 className="h-6 w-6 text-primary"/>}
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-lg md:text-xl"><Palette className="mr-2 h-5 w-5 text-primary"/>Aparência e Módulos</CardTitle>
            <CardDescription>Personalize o que você vê no seu painel e como o aplicativo se parece.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="p-4 border rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-center justify-between">
                <Label htmlFor="show-quotes" className="flex flex-col space-y-1 cursor-pointer flex-grow">
                <span className="font-semibold">Módulo de Cotações</span>
                <span className="font-normal leading-snug text-muted-foreground text-sm">
                    Exibe cotações de moedas e ações no painel.
                </span>
                </Label>
                <Button variant="outline" size="sm" onClick={() => setIsQuoteDialogOpen(true)}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Configurar Cotações
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-weather" className="flex flex-col space-y-1 cursor-pointer flex-grow">
                <span className="font-semibold">Módulo de Clima</span>
                <span className="font-normal leading-snug text-muted-foreground text-sm">
                    Exibe o clima da sua cidade na barra lateral.
                </span>
                </Label>
                <Button variant="outline" size="sm" onClick={() => setIsWeatherDialogOpen(true)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Configurar Cidade
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-md border">
              <Label htmlFor="dark-mode" className="flex flex-col space-y-1 cursor-pointer flex-grow">
                <span>Modo Escuro</span>
                <span className="font-normal leading-snug text-muted-foreground text-sm">
                  Alterne entre temas claro e escuro para melhor conforto visual.
                </span>
              </Label>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} aria-label={isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro"} />
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold">Temas de Cores</Label>
              <p className="text-sm text-muted-foreground">Escolha um esquema de cores que mais lhe agrada.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {availableThemes.map((theme) => {
                  const IconComponent = theme.icon;
                  return (
                    <Button
                      key={theme.id}
                      variant={currentTheme === theme.id ? "default" : "outline"}
                      className={cn("h-auto p-4 flex flex-col items-start text-left space-y-2 transition-all duration-200 justify-between", currentTheme === theme.id && "ring-2 ring-primary ring-offset-background ring-offset-2")}
                      onClick={() => handleThemeChange(theme.id)}
                    >
                      <div className="flex-grow w-full">
                        <div className="flex items-center gap-3 w-full mb-2">
                          <IconComponent className={cn("h-5 w-5", theme.iconClassName || 'text-muted-foreground')} />
                          <span className="font-semibold">{theme.name}</span>
                          {currentTheme === theme.id && <CheckSquare className="h-5 w-5 text-primary-foreground ml-auto" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 min-h-[60px]">{theme.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-lg md:text-xl"><Bell className="mr-2 h-5 w-5 text-primary"/>Notificações</CardTitle>
            <CardDescription>Gerencie como você recebe atualizações e alertas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30">
              <Label htmlFor="push-notifications" className="flex flex-col space-y-1 cursor-pointer flex-grow">
                <span>Notificações Push</span>
                <span className="font-normal leading-snug text-muted-foreground text-sm">
                  Receba alertas de contas futuras, marcos de metas e dicas. (Em breve)
                </span>
              </Label>
              <Switch id="push-notifications" onCheckedChange={(checked) => handleFeatureClick(`Notificações Push ${checked ? "ativadas" : "desativadas"}`)} disabled />
            </div>
            <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30">
              <Label htmlFor="email-summary" className="flex flex-col space-y-1 cursor-pointer flex-grow">
                <span>Resumos por Email</span>
                <span className="font-normal leading-snug text-muted-foreground text-sm">
                  Receba resumos financeiros semanais ou mensais por email. (Em breve)
                </span>
              </Label>
              <Switch id="email-summary" onCheckedChange={(checked) => handleFeatureClick(`Resumos por Email ${checked ? "ativados" : "desativadas"}`)} disabled/>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-lg md:text-xl"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Segurança e Privacidade</CardTitle>
            <CardDescription>Gerencie as configurações de segurança e privacidade da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full md:w-auto" onClick={() => handleFeatureClick("Mudar Senha")}>Mudar Senha</Button>
            <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30">
              <Label htmlFor="two-factor-auth" className="flex flex-col space-y-1 cursor-pointer flex-grow">
                <span>Autenticação de Dois Fatores (2FA)</span>
                <span className="font-normal leading-snug text-muted-foreground text-sm">
                  Adicione uma camada extra de segurança à sua conta. (Em Breve)
                </span>
              </Label>
              <Switch id="two-factor-auth" disabled onCheckedChange={(checked) => handleFeatureClick(`Autenticação de Dois Fatores ${checked ? "ativada" : "desativada"}`)} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-lg md:text-xl"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Gerenciamento de Dados</CardTitle>
            <CardDescription>Importe, exporte ou gerencie seus dados financeiros.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" onClick={() => handleFeatureClick("Importar Dados")}>
              <UploadCloud className="mr-2 h-4 w-4"/>Importar Dados (.csv, .ofx)
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleFeatureClick("Exportar Dados")}>
              <DownloadCloud className="mr-2 h-4 w-4"/>Exportar Dados (PDF, CSV)
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-lg md:text-xl"><Share2 className="mr-2 h-5 w-5 text-primary"/>Compartilhamento (Em Breve)</CardTitle>
            <CardDescription>Gerencie módulos compartilhados e acesso colaborativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Em breve, você poderá compartilhar módulos financeiros específicos com outros usuários, definindo permissões de visualização ou edição.</p>
            <Button variant="outline" onClick={() => setIsShareModalOpen(true)} disabled>Gerenciar Módulos Compartilhados</Button>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button variant="destructive" className="w-full md:w-auto" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4"/>
              Sair da Conta
          </Button>
        </div>
      </div>
      <ShareModuleDialog isOpen={isShareModalOpen} onOpenChange={setIsShareModalOpen} />
      <WeatherSettingsDialog isOpen={isWeatherDialogOpen} onOpenChange={setIsWeatherDialogOpen} />
      <QuoteSettingsDialog isOpen={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen} />
    </>
  );
}
