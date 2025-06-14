// src/app/(app)/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, ShieldCheck, Palette, Briefcase, LogOut, UploadCloud, DownloadCloud, Share2 } from "lucide-react";
import { DEFAULT_USER } from '@/lib/constants';
import { useAppSettings } from '@/hooks/use-app-settings';
import { toast } from '@/hooks/use-toast';
import { logoutUser } from '@/app/actions/auth.actions';
// import type { Metadata } from 'next'; // Metadata estática não funciona bem em Client Components
import { APP_NAME } from '@/lib/constants';

export default function SettingsPage() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useAppSettings();

  const [fullName, setFullName] = useState(DEFAULT_USER.name);
  const [email, setEmail] = useState(DEFAULT_USER.email);

  const handleProfileSave = async () => {
    console.log("Salvando perfil:", { fullName, email });
    // Aqui iria a lógica de salvar no backend
    toast({ title: "Perfil Atualizado", description: "Suas informações de perfil foram salvas com sucesso." });
  };
  
  const handleLogout = async () => {
    toast({ title: "Saindo...", description: "Você está sendo desconectado." });
    await logoutUser(); 
    // O redirecionamento é feito pela server action
  };

  const handleFeatureClick = (featureName: string, isPlaceholder: boolean = true) => {
    console.log(`${featureName} clicado.`);
    toast({ 
      title: `Ação: ${featureName}`, 
      description: isPlaceholder ? `Funcionalidade "${featureName}" (placeholder).` : `${featureName} foi ativado.`
    });
  };

  // Set page title using document.title for client components
  useEffect(() => {
    document.title = `Configurações - ${APP_NAME}`;
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Gerencie sua conta, preferências e configurações do aplicativo."
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Perfil</CardTitle>
          <CardDescription>Atualize suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={DEFAULT_USER.avatarUrl} alt={DEFAULT_USER.name} data-ai-hint="woman nature" />
              <AvatarFallback>{DEFAULT_USER.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="outline" onClick={() => handleFeatureClick("Mudar Foto")}>Mudar Foto</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Endereço de Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleProfileSave}>Salvar Alterações do Perfil</Button>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Bell className="mr-2 h-5 w-5 text-primary"/>Notificações</CardTitle>
          <CardDescription>Gerencie como você recebe notificações.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1 cursor-pointer">
              <span>Notificações Push</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receba alertas de contas futuras e marcos de metas.
              </span>
            </Label>
            <Switch id="push-notifications" defaultChecked onCheckedChange={(checked) => handleFeatureClick(`Notificações Push ${checked ? "ativadas" : "desativadas"}`, false)} />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="email-summary" className="flex flex-col space-y-1 cursor-pointer">
              <span>Resumos por Email</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receba resumos financeiros semanais ou mensais por email.
              </span>
            </Label>
            <Switch id="email-summary" onCheckedChange={(checked) => handleFeatureClick(`Resumos por Email ${checked ? "ativados" : "desativados"}`, false)} />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Segurança</CardTitle>
          <CardDescription>Gerencie as configurações de segurança da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => handleFeatureClick("Mudar Senha")}>Mudar Senha</Button>
          <div className="flex items-center justify-between">
             <Label htmlFor="two-factor-auth" className="flex flex-col space-y-1 cursor-pointer">
              <span>Autenticação de Dois Fatores</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta.
              </span>
            </Label>
            <Switch id="two-factor-auth" onCheckedChange={(checked) => handleFeatureClick(`Autenticação de Dois Fatores ${checked ? "ativada" : "desativada"}`, false)} />
          </div>
        </CardContent>
      </Card>
      
      {/* Appearance Settings */}
       <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>Aparência</CardTitle>
          <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1 cursor-pointer">
              <span>Modo Escuro</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Alterne entre temas claro e escuro.
              </span>
            </Label>
            <Switch 
              id="dark-mode" 
              checked={isDarkMode}
              onCheckedChange={() => {
                toggleDarkMode();
                handleFeatureClick(`Modo Escuro ${!isDarkMode ? "ativado" : "desativado"}`, false);
              }} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Gerenciamento de Dados</CardTitle>
          <CardDescription>Importe, exporte ou gerencie seus dados financeiros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-0 md:flex md:gap-2">
          <Button variant="outline" className="w-full md:w-auto" onClick={() => handleFeatureClick("Importar Dados")}>
            <UploadCloud className="mr-2 h-4 w-4"/>Importar Dados (.csv, .ofx)
          </Button>
          <Button variant="outline" className="w-full md:w-auto" onClick={() => handleFeatureClick("Exportar Dados")}>
            <DownloadCloud className="mr-2 h-4 w-4"/>Exportar Dados (PDF, CSV, JSON)
          </Button>
        </CardContent>
      </Card>

       {/* Sharing & Collaboration */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary"/>Compartilhamento e Colaboração</CardTitle>
          <CardDescription>Gerencie módulos compartilhados e acesso colaborativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Recurso em breve! Gerencie com quem você compartilha módulos financeiros e suas permissões.</p>
          <Button variant="outline" disabled onClick={() => handleFeatureClick("Gerenciar Módulos Compartilhados")}>Gerenciar Módulos Compartilhados</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
         <Button variant="destructive" className="w-full md:w-auto" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4"/>
            Sair
        </Button>
      </div>
    </div>
  );
}
