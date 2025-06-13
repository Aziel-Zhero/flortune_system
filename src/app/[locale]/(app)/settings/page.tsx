
"use client";

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next-intl/client';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, ShieldCheck, Palette, Briefcase, LogOut, UploadCloud, DownloadCloud, Share2, Languages } from "lucide-react";
import { locales as availableLocales } from '@/i18n'; // Import configured locales

export default function SettingsPage() {
  const t = useTranslations('SettingsPage');
  const tLocaleNames = useTranslations('LocaleNames');
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const user = {
    name: "Flora Green", // This could also be from a context or translated if dynamic
    email: "flora.green@example.com",
    avatarUrl: "https://placehold.co/100x100.png", // data-ai-hint: "woman nature"
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const storedDarkMode = localStorage.getItem('flortune-dark-mode');
    let darkModeEnabled = false;
    if (storedDarkMode !== null) {
      darkModeEnabled = JSON.parse(storedDarkMode);
    } else {
      darkModeEnabled = document.documentElement.classList.contains('dark') ||
                        (typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    setIsDarkMode(darkModeEnabled);
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('flortune-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const handleDarkModeChange = (checked: boolean) => {
    setIsDarkMode(checked);
  };

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
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
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="woman nature" />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="outline">{t('changePhotoButton')}</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('fullNameLabel')}</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div>
              <Label htmlFor="email">{t('emailAddressLabel')}</Label>
              <Input id="email" type="email" defaultValue={user.email} />
            </div>
          </div>
          <Button>{t('saveProfileButton')}</Button>
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
              {availableLocales.map((loc) => (
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
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span>{t('pushNotificationsLabel')}</span>
              <span className="font-normal leading-snug text-muted-foreground">
                {t('pushNotificationsDescription')}
              </span>
            </Label>
            <Switch id="push-notifications" defaultChecked />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="email-summary" className="flex flex-col space-y-1">
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
             <Label htmlFor="two-factor-auth" className="flex flex-col space-y-1">
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
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>{t('darkModeLabel')}</span>
               <span className="font-normal leading-snug text-muted-foreground">
                {t('darkModeDescription')}
              </span>
            </Label>
            <Switch 
              id="dark-mode" 
              checked={isDarkMode}
              onCheckedChange={handleDarkModeChange} 
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
        <CardContent className="space-y-4">
          <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4"/>{t('importDataButton')}</Button>
          <Button variant="outline"><DownloadCloud className="mr-2 h-4 w-4"/>{t('exportDataButton')}</Button>
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
      <div className="flex justify-end">
         <Button variant="destructive" className="w-full md:w-auto">
            <LogOut className="mr-2 h-4 w-4"/>
            {t('logoutButton')}
        </Button>
      </div>
    </div>
  );
}
