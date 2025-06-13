
"use client";

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, ShieldCheck, Palette, Briefcase, LogOut, UploadCloud, DownloadCloud, Share2 } from "lucide-react";

export default function SettingsPage() {
  // Placeholder data and handlers
  const user = {
    name: "Flora Green",
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
      // Fallback: check if the class is already on the html element or system preference
      darkModeEnabled = document.documentElement.classList.contains('dark') || 
                        (typeof window !== "undefined" && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    setIsDarkMode(darkModeEnabled);
    // Ensure HTML class matches this initial state
    if (darkModeEnabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Runs once on mount

  useEffect(() => {
    // This effect runs when isDarkMode changes *after* initial setup
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and app settings."
      />

      {/* Profile Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="woman nature" />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <Button variant="outline">Change Photo</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={user.email} />
            </div>
          </div>
          <Button>Save Profile Changes</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Bell className="mr-2 h-5 w-5 text-primary"/>Notifications</CardTitle>
          <CardDescription>Manage how you receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span>Push Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive alerts for upcoming bills and goal milestones.
              </span>
            </Label>
            <Switch id="push-notifications" defaultChecked />
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="email-summary" className="flex flex-col space-y-1">
              <span>Email Summaries</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Get weekly or monthly financial summaries via email.
              </span>
            </Label>
            <Switch id="email-summary" />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary"/>Security</CardTitle>
          <CardDescription>Manage your account security settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Change Password</Button>
          <div className="flex items-center justify-between">
             <Label htmlFor="two-factor-auth" className="flex flex-col space-y-1">
              <span>Two-Factor Authentication</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Add an extra layer of security to your account.
              </span>
            </Label>
            <Switch id="two-factor-auth" />
          </div>
        </CardContent>
      </Card>
      
      {/* Appearance Settings */}
       <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Dark Mode</span>
               <span className="font-normal leading-snug text-muted-foreground">
                Toggle between light and dark themes.
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
          <CardTitle className="font-headline flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Data Management</CardTitle>
          <CardDescription>Import, export, or manage your financial data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4"/>Import Data (.csv, .ofx)</Button>
          <Button variant="outline"><DownloadCloud className="mr-2 h-4 w-4"/>Export Data (PDF, CSV, JSON)</Button>
        </CardContent>
      </Card>

       {/* Sharing & Collaboration */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary"/>Sharing & Collaboration</CardTitle>
          <CardDescription>Manage shared modules and collaborative access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Feature coming soon! Manage who you share financial modules with and their permissions.</p>
          <Button variant="outline" disabled>Manage Shared Modules</Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <div className="flex justify-end">
         <Button variant="destructive" className="w-full md:w-auto">
            <LogOut className="mr-2 h-4 w-4"/>
            Log Out
        </Button>
      </div>
    </div>
  );
}
