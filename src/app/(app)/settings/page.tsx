
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, ShieldCheck, Palette, Briefcase, LogOut, UploadCloud, DownloadCloud, Share2, Smartphone, FileText, Fingerprint, Save } from "lucide-react";
import { useAuth, type Profile } from '@/contexts/auth-context'; // Usar o hook de autenticação
import { toast } from '@/hooks/use-toast';
import { logoutUser } from '@/app/actions/auth.actions';
import { APP_NAME } from '@/lib/constants';
import { ShareModuleDialog } from '@/components/settings/share-module-dialog';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user, profile, setProfile, isLoading: authLoading, appSettings } = useAuth();
  const { isDarkMode, toggleDarkMode } = appSettings;

  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [rg, setRg] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFallback, setAvatarFallback] = useState("U");

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  useEffect(() => {
    document.title = `Configurações - ${APP_NAME}`;
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      setCpfCnpj(profile.cpf_cnpj || "");
      setRg(profile.rg || "");
      setAvatarUrl(profile.avatar_url || user?.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${(profile.display_name || user?.email)?.charAt(0)?.toUpperCase() || 'U'}`);
      setAvatarFallback((profile.display_name || user?.email)?.charAt(0)?.toUpperCase() || "U");
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSavingProfile(true);
    try {
      const updatedProfileData: Partial<Profile> = {
        full_name: fullName,
        display_name: displayName,
        phone,
        cpf_cnpj: cpfCnpj,
        rg,
        // avatar_url: avatarUrl, // A atualização do avatar_url geralmente é um processo separado (upload de arquivo)
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile); // Atualiza o perfil no contexto
        toast({ title: "Perfil Atualizado", description: "Suas informações de perfil foram salvas com sucesso." });
      }
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar as alterações do perfil.", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  const handleLogout = async () => {
    toast({ title: "Saindo...", description: "Você está sendo desconectado." });
    await logoutUser(); 
  };

  const handleFeatureClick = (featureName: string, isPlaceholder: boolean = true) => {
    console.log(`${featureName} clicado.`);
    toast({ 
      title: `Ação: ${featureName}`, 
      description: isPlaceholder ? `Funcionalidade "${featureName}" (placeholder).` : `${featureName} foi ativado.`
    });
  };


  if (authLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Configurações" description="Gerencie sua conta, preferências e configurações do aplicativo."/>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Gerencie sua conta, preferências e configurações do aplicativo."
      />

      <form onSubmit={handleProfileSave}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Perfil</CardTitle>
            <CardDescription>Atualize suas informações pessoais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="user avatar" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => handleFeatureClick("Mudar Foto")}>Mudar Foto</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Endereço de Email</Label>
                <Input id="email" type="email" value={email} disabled className="cursor-not-allowed bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado após o cadastro.</p>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                 <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                 <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="rg" value={rg} onChange={(e) => setRg(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Salvando..." : "Salvar Alterações do Perfil"} <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </form>

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

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary"/>Compartilhamento e Colaboração</CardTitle>
          <CardDescription>Gerencie módulos compartilhados e acesso colaborativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Gerencie com quem você compartilha módulos financeiros e suas permissões.</p>
          <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>Gerenciar Módulos Compartilhados</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
         <Button variant="destructive" className="w-full md:w-auto" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4"/>
            Sair
        </Button>
      </div>
      <ShareModuleDialog isOpen={isShareModalOpen} onOpenChange={setIsShareModalOpen} />
    </div>
  );
}
