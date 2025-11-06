// src/app/(admin)/admin/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Palette, Briefcase, LogOut, CheckSquare, Settings2, Mountain, Wind, Sun, Zap, Droplets, Sparkles, MapPin } from "lucide-react";
import { useAppSettings } from '@/contexts/app-settings-context';
import { toast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

interface ThemeOption {
  name: string;
  id: string;
  icon: React.ElementType;
  description: string;
  iconClassName?: string;
}

const availableThemes: ThemeOption[] = [
  { name: "Verde Flortune", id: "default", icon: Sparkles, description: "O tema padrão, fresco e original do Flortune.", iconClassName: "text-primary" },
  { name: "Rio da Serra", id: "theme-rio-da-serra", icon: Droplets, description: "Um tema calmo e profissional com tons de azul clássico.", iconClassName: "text-blue-500 dark:text-blue-400" },
  { name: "Aurora Dourada", id: "theme-golden-dawn", icon: Sun, description: "Um tema claro e vibrante com destaques dourados.", iconClassName: "text-yellow-500 dark:text-yellow-400" },
  { name: "Mística Nebulosa", id: "theme-mystic-nebula", icon: Zap, description: "Um tema envolvente com tons profundos e mágicos de roxo.", iconClassName: "text-purple-500 dark:text-purple-400" },
  { name: "Amanhecer", id: "theme-amanhecer", icon: Wind, description: "Cores suaves de um amanhecer, com gradientes.", iconClassName: "text-pink-500 dark:text-pink-400" },
  { name: "Terra Vermelha", id: "theme-terra-vermelha", icon: Mountain, description: "Tons quentes e terrosos de vermelho e argila.", iconClassName: "text-red-600 dark:text-red-500" },
];


export default function AdminSettingsPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, currentTheme, applyTheme } = useAppSettings();

  useEffect(() => {
    document.title = `Configurações de Admin - ${APP_NAME}`;
  }, []);

  const handleFeatureClick = (featureName: string) => {
    toast({ 
      title: `Ação: ${featureName}`, 
      description: `Funcionalidade "${featureName}" (placeholder).`
    });
  };

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId); 
    toast({ title: "Tema Alterado", description: `Tema "${availableThemes.find(t => t.id === themeId)?.name}" aplicado.`, action: <CheckSquare className="text-green-500"/> });
  };
  
  const handleLogout = () => {
    toast({ title: "Saindo...", description: "Você está sendo desconectado (simulação)." });
    router.push('/login-admin');
  };

  return (
    <>
      <div className="space-y-8">
        <PageHeader
          title="Configurações do Workspace"
          description="Gerencie as preferências, aparência e configurações do painel administrativo."
          icon={<Settings2 className="h-6 w-6 text-primary"/>}
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-lg md:text-xl"><Palette className="mr-2 h-5 w-5 text-primary"/>Aparência</CardTitle>
            <CardDescription>Personalize a aparência do seu painel administrativo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <CardTitle className="font-headline flex items-center text-lg md:text-xl"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Segurança</CardTitle>
            <CardDescription>Gerencie as configurações de segurança da sua conta de administrador.</CardDescription>
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

        <div className="flex justify-end pt-4">
          <Button variant="destructive" className="w-full md:w-auto" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4"/>
              Sair da Conta
          </Button>
        </div>
      </div>
    </>
  );
}
