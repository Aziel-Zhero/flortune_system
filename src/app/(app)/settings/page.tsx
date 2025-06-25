
// src/app/(app)/settings/page.tsx
"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, ShieldCheck, Palette, Briefcase, LogOut, UploadCloud, DownloadCloud, Share2, Smartphone, FileText, Fingerprint, Save, CheckSquare, Settings2, Mountain, Wind, Sun, Zap, Droplets, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useAppSettings } from '@/contexts/app-settings-context';
import { toast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';
import { ShareModuleDialog } from '@/components/settings/share-module-dialog';
import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/types/database.types';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ThemeOption {
  name: string;
  id: string;
  icon: React.ElementType; // Lucide Icon
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


export default function SettingsPage() {
  const { data: session, status, update: updateSession } = useSession();
  const { isDarkMode, toggleDarkMode, currentTheme, applyTheme } = useAppSettings();

  const isLoading = status === "loading";
  const userFromSession = session?.user;
  const profileFromSession = session?.user?.profile;

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
    if (profileFromSession) {
      setFullName(profileFromSession.full_name || "");
      setDisplayName(profileFromSession.display_name || "");
      setPhone(profileFromSession.phone || "");
      setCpfCnpj(profileFromSession.cpf_cnpj || "");
      setRg(profileFromSession.rg || "");
      const currentAvatar = profileFromSession.avatar_url || session?.user?.image || `https://placehold.co/100x100.png?text=${(profileFromSession.display_name || session?.user?.name)?.charAt(0)?.toUpperCase() || 'U'}`;
      setAvatarUrl(currentAvatar);
      setAvatarFallback((profileFromSession.display_name || session?.user?.name)?.charAt(0)?.toUpperCase() || "U");
    }
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [profileFromSession, session?.user?.image, session?.user?.name, session?.user?.email]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!userFromSession?.id) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSavingProfile(true);
    try {
      const updatedProfileData: Partial<Omit<Profile, 'id' | 'created_at' | 'email' | 'hashed_password'>> & {updated_at: string} = {
        full_name: fullName,
        display_name: displayName,
        phone,
        cpf_cnpj: cpfCnpj,
        rg,
        updated_at: new Date().toISOString(),
        account_type: profileFromSession?.account_type, 
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', userFromSession.id)
        .select()
        .single();

      if (error) throw error;

      if (updatedProfile) {
        await updateSession({
          ...session, 
          user: { 
            ...session?.user,
            name: updatedProfile.display_name || updatedProfile.full_name, 
            profile: updatedProfile as Profile, 
          }
        });
        toast({ title: "Perfil Atualizado", description: "Suas informações de perfil foram salvas com sucesso.", action: <CheckSquare className="text-green-500"/> });
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
    await signOut({ callbackUrl: '/login?logout=success' }); 
  };

  const handleFeatureClick = (featureName: string, isPlaceholder: boolean = true) => {
    console.log(`${featureName} clicado.`);
    toast({ 
      title: `Ação: ${featureName}`, 
      description: isPlaceholder ? `Funcionalidade "${featureName}" (placeholder).` : `${featureName} foi ativado/desativado.`
    });
  };

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId); 
    toast({ title: "Tema Alterado", description: `Tema "${availableThemes.find(t => t.id === themeId)?.name}" aplicado.`, action: <CheckSquare className="text-green-500"/> });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Configurações" description="Gerencie sua conta, preferências e configurações do aplicativo." icon={<Settings2 className="h-6 w-6 text-primary"/>}/>
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }
  
  if (!session || !userFromSession) { 
    return <p>Redirecionando para o login...</p>; 
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações da Conta"
        description="Gerencie sua conta, preferências e configurações do aplicativo."
        icon={<Settings2 className="h-6 w-6 text-primary"/>}
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center text-lg md:text-xl"><User className="mr-2 h-5 w-5 text-primary"/>Perfil do Usuário</CardTitle>
          <CardDescription>Atualize suas informações pessoais e de conta.</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSave}>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={displayName || "Avatar"} data-ai-hint="user avatar" />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" onClick={() => handleFeatureClick("Mudar Foto")}>Mudar Foto</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nome Completo / Razão Social</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="displayName">Nome de Exibição / Fantasia</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Endereço de Email</Label>
                <Input id="email" type="email" value={email} disabled className="cursor-not-allowed bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado.</p>
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                 <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                </div>
              </div>
            </div>
            {profileFromSession?.account_type === 'pessoa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpfCnpj">CPF</Label>
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
            )}
            {profileFromSession?.account_type === 'empresa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpfCnpj">CNPJ</Label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="cpfCnpj" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} className="pl-10" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSavingProfile} className="ml-auto">
              {isSavingProfile ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Perfil</>}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center text-lg md:text-xl"><Palette className="mr-2 h-5 w-5 text-primary"/>Aparência</CardTitle>
          <CardDescription>Personalize a aparência do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1 cursor-pointer flex-grow">
              <span>Modo Escuro</span>
               <span className="font-normal leading-snug text-muted-foreground text-sm">
                Alterne entre temas claro e escuro para melhor conforto visual.
              </span>
            </Label>
            <Switch 
              id="dark-mode" 
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode} 
              aria-label={isDarkMode ? "Desativar modo escuro" : "Ativar modo escuro"}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base">Temas de Cores</Label>
            <p className="text-sm text-muted-foreground">Escolha um esquema de cores que mais lhe agrada para o Flortune.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {availableThemes.map((theme) => {
                const IconComponent = theme.icon;
                return (
                  <Button
                    key={theme.id}
                    variant={currentTheme === theme.id ? "default" : "outline"}
                    className={cn(
                      "h-auto p-3 sm:p-4 flex flex-col items-start text-left space-y-1.5 sm:space-y-2 transition-all duration-200 justify-between min-h-[120px] sm:min-h-[140px]",
                      currentTheme === theme.id && "ring-2 ring-primary ring-offset-background ring-offset-2"
                    )}
                    onClick={() => handleThemeChange(theme.id)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 w-full">
                       <IconComponent className={cn("h-5 w-5", theme.iconClassName || 'text-muted-foreground')} />
                      <span className="font-semibold text-sm md:text-base">{theme.name}</span>
                      {currentTheme === theme.id && (
                        <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3">
                      {theme.description}
                    </p>
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
      <ShareModuleDialog isOpen={isShareModalOpen} onOpenChange={setIsShareModalOpen} />
    </div>
  );
}
