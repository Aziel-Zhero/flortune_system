
"use client";

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next-intl/client'; // Corrected for client components
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, ShieldCheck, Palette, Briefcase, LogOut, UploadCloud, DownloadCloud, Share2, Languages } from "lucide-react";
import { SUPPORTED_LOCALES, type SupportedLocale, DEFAULT_LOCALE as APP_DEFAULT_LOCALE } from '@/config/locales';
import { DEFAULT_USER } from '@/lib/constants';
import { useAppSettings } from '@/hooks/use-app-settings'; // For dark mode
import { toast } from '@/hooks/use-toast'; // For notifications/feedback
import { logoutUser } from '@/app/actions/auth.actions'; // Server action for logout

export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const tLocaleNames = useTranslations('LocaleNames');
  const router = useRouter();
  const pathname = usePathname(); // Pathname without locale
  const currentLocale = useLocale() as SupportedLocale;

  const { isDarkMode, toggleDarkMode } = useAppSettings();

  // Form states - ideally use react-hook-form for more complex forms
  const [fullName, setFullName] = useState(DEFAULT_USER.name);
  const [email, setEmail] = useState(DEFAULT_USER.email);

  const handleProfileSave = async () => {
    // Placeholder for saving profile changes
    console.log("Saving profile:", { fullName, email });
    toast({ title: "Profile Updated", description: "Your profile information has been saved." });
  };
  
  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== currentLocale) {
      router.replace(pathname, { locale: newLocale });
    }
  };

  const handleLogout = async () => {
    await logoutUser(); // Calls server action, which then redirects
    // No client-side redirect needed here as server action handles it.
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      {/* Profile Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>{t('profileTitle')}</CardTitle>
          <CardDescription>{t('profileDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={DEFAULT_USER.avatarUrl} alt={DEFAULT_USER.name} data-ai-hint="woman nature" />
              <AvatarFallback>{DEFAULT_USER.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="outline">{t('changePhotoButton')}</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('fullNameLabel')}</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">{t('emailAddressLabel')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleProfileSave}>{t('saveProfileButton')}</Button>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Languages className="mr-2 h-5 w-5 text-primary"/>{t('languageTitle')}</CardTitle>
          <CardDescription>{t('languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select defaultValue={currentLocale} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder={t('selectLanguagePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LOCALES.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {tLocaleNames(loc as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Bell className="mr-2 h-5 w-5 text-primary"/>{t('notificationsTitle')}</CardTitle>
          <CardDescription>{t('notificationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1 cursor-pointer">
              <span>{t('pushNotificationsLabel')}</span>
              <span className="font-normal leading-snug text-muted-foreground">
                {t('pushNotificationsDescription')}
              </span>
            </Label>
            <Switch id="push-notifications" defaultChecked />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="email-summary" className="flex flex-col space-y-1 cursor-pointer">
              <span>{t('emailSummariesLabel')}</span>
              <span className="font-normal leading-snug text-muted-foreground">
                {t('emailSummariesDescription')}
              </span>
            </Label>
            <Switch id="email-summary" />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>{t('securityTitle')}</CardTitle>
          <CardDescription>{t('securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">{t('changePasswordButton')}</Button>
          <div className="flex items-center justify-between">
             <Label htmlFor="two-factor-auth" className="flex flex-col space-y-1 cursor-pointer">
              <span>{t('twoFactorAuthLabel')}</span>
              <span className="font-normal leading-snug text-muted-foreground">
                {t('twoFactorAuthDescription')}
              </span>
            </Label>
            <Switch id="two-factor-auth" />
          </div>
        </CardContent>
      </Card>
      
      {/* Appearance Settings */}
       <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>{t('appearanceTitle')}</CardTitle>
          <CardDescription>{t('appearanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1 cursor-pointer">
              <span>{t('darkModeLabel')}</span>
               <span className="font-normal leading-snug text-muted-foreground">
                {t('darkModeDescription')}
              </span>
            </Label>
            <Switch 
              id="dark-mode" 
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>{t('dataManagementTitle')}</CardTitle>
          <CardDescription>{t('dataManagementDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-0 md:flex md:gap-2">
          <Button variant="outline" className="w-full md:w-auto"><UploadCloud className="mr-2 h-4 w-4"/>{t('importDataButton')}</Button>
          <Button variant="outline" className="w-full md:w-auto"><DownloadCloud className="mr-2 h-4 w-4"/>{t('exportDataButton')}</Button>
        </CardContent>
      </Card>

       {/* Sharing & Collaboration */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary"/>{t('sharingTitle')}</CardTitle>
          <CardDescription>{t('sharingDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('sharingComingSoon')}</p>
          <Button variant="outline" disabled>{t('manageSharedModulesButton')}</Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <div className="flex justify-end pt-4">
         <Button variant="destructive" className="w-full md:w-auto" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4"/>
            {t('logoutButton')}
        </Button>
      </div>
    </div>
  );
}
