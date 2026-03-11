
// src/app/page.tsx
"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, BrainCircuit, Eye, ShieldCheck, ArrowRight, Check, Gem, GanttChartSquare, Star, Code, Briefcase } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { APP_NAME, PRICING_TIERS, type PricingTierIconName } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import { useAppSettings, type PopupType } from "@/contexts/app-settings-context";
import { useSession } from "@/contexts/auth-context";
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import React, { useRef, useEffect, type FC, useState, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dynamic from "next/dynamic";

const MaintenancePopup = dynamic(() => import('@/components/popups/maintenance-popup').then(mod => mod.MaintenancePopup));
const PromotionPopup = dynamic(() => import('@/components/popups/promotion-popup').then(mod => mod.PromotionPopup));
const NewsletterPopup = dynamic(() => import('@/components/popups/newsletter-popup').then(mod => mod.NewsletterPopup));
const Iridescence = dynamic(() => import("@/components/shared/iridescence"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return Gem;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Gem;
};

const FeatureCard: FC<{ icon: React.ElementType; title: string; description: string; className?: string }> = ({ icon: Icon, title, description, className }) => (
  <div className={cn("bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border/50 hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col hover:scale-105 hover:-translate-y-1", className)}>
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-headline font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-muted-foreground text-sm flex-grow">{description}</p>
  </div>
);

const ReviewCard: FC<any> = ({ quote, author, role, avatar, rating }) => (
  <div className="review-card bg-foreground/5 backdrop-blur-md p-6 rounded-2xl border border-foreground/10 flex flex-col h-full shadow-xl">
    <div className="flex items-center mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("w-4 h-4", i < rating ? "text-yellow-400 fill-yellow-400" : "text-foreground/20 fill-foreground/20")} />
      ))}
    </div>
    <p className="text-foreground/80 text-sm flex-grow">"{quote}"</p>
    <div className="flex items-center gap-3 mt-6">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatar} alt={author} />
        <AvatarFallback>{author.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-foreground">{author}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const { session } = useSession();
  const { activeCampaignTheme, landingPageContent, activePopup, popupConfigs } = useAppSettings();

  const safeLandingPageContent = landingPageContent || { heroTitle: "", heroDescription: "", heroImageUrl: "", ctaTitle: "", ctaDescription: "", ctaButtonText: "" };

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroParagraphRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(heroTitleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 })
      .fromTo(heroParagraphRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .fromTo(heroButtonsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .fromTo(heroImageRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1 }, "-=0.5");
  }, { scope: mainContainerRef });

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-foreground bg-transparent" ref={mainContainerRef}>
      <Suspense fallback={null}>
        <Iridescence fluidColor={[22/255, 163/255, 129/255]} speed={0.3} amplitude={0.15} mouseReact={false} />
      </Suspense>
      <div className="relative z-10 isolate">
        <header className="py-4 px-4 md:px-8">
          <div className="container mx-auto flex justify-between items-center max-w-[1850px]">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <Image src="/Logo.png" alt="Flortune Logo" width={32} height={32} style={{ height: 'auto' }} />
              <span className="text-2xl font-headline font-bold">{APP_NAME}</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href={session ? "/dashboard" : "/login"} className={cn(buttonVariants({ variant: 'ghost' }), "text-foreground")}>{session ? "Acessar Painel" : "Login"}</Link>
              {!session && <Link href="/signup" className={cn(buttonVariants({ variant: 'default' }), "bg-accent")}>Criar Conta Grátis</Link>}
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 md:px-8 max-w-[1850px]">
          <section className="text-center py-20 md:py-32 min-h-[calc(100vh-150px)] flex flex-col justify-center items-center">
            <h1 ref={heroTitleRef} className="text-4xl md:text-6xl 2xl:text-7xl font-headline font-extrabold mb-6 opacity-0">{safeLandingPageContent.heroTitle}</h1>
            <p ref={heroParagraphRef} className="text-lg md:text-xl 2xl:text-2xl text-foreground/80 mb-10 max-w-3xl opacity-0">{safeLandingPageContent.heroDescription}</p>
            <div className="flex flex-col sm:flex-row gap-4 opacity-0" ref={heroButtonsRef}>
              <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), "bg-accent")}>Comece Agora (Grátis)</Link>
            </div>
            <div ref={heroImageRef} className="mt-16 md:mt-24 opacity-0">
              <Image src={safeLandingPageContent.heroImageUrl} alt="Mockup" width={1000} height={562} className="rounded-lg shadow-2xl border-4 border-foreground/20 h-auto" priority />
            </div>
          </section>
          {/* Outras seções... */}
        </main>
      </div>
    </div>
  );
}
