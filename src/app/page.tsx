// src/app/page.tsx
"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, BrainCircuit, Eye, ShieldCheck, ArrowRight, Check, Gem, GanttChartSquare, Star, Origami, Code, Briefcase, Leaf } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Iridescence from "@/components/shared/iridescence";
import { APP_NAME, PRICING_TIERS, type PricingTierIconName } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import { useAppSettings, type PopupType } from "@/contexts/app-settings-context";
import { useSession } from "@/contexts/auth-context";

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import anime from 'animejs';
import React, { useRef, useEffect, type FC, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MaintenancePopup } from "@/components/popups/maintenance-popup";
import { PromotionPopup } from "@/components/popups/promotion-popup";
import { NewsletterPopup } from "@/components/popups/newsletter-popup";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


gsap.registerPlugin(ScrollTrigger);

const getPricingIcon = (iconName?: PricingTierIconName): React.ElementType => {
  if (!iconName) return Gem;
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent || Gem;
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link?: string;
  className?: string;
}

const FeatureCard: FC<FeatureCardProps> = ({ icon: Icon, title, description, link, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentCardRef = cardRef.current;
    const currentIconRef = iconRef.current;
    if (!currentCardRef || !currentIconRef) return;

    const handleMouseEnter = () => {
      anime.remove(currentIconRef);
      anime({ targets: currentIconRef, scale: [{ value: 1.2, duration: 200, easing: 'easeOutQuad' }, { value: 1, duration: 300, easing: 'easeInOutQuad' }], rotate: [{ value: 10, duration: 150, easing: 'easeOutSine' }, { value: -10, duration: 150, delay: 50, easing: 'easeInOutSine' }, { value: 0, duration: 150, delay: 50, easing: 'easeInSine' }], translateY: [{ value: -5, duration: 150, easing: 'easeOutQuad' }, { value: 0, duration: 200, easing: 'easeInQuad' }], duration: 600 });
      anime({ targets: currentCardRef, translateY: -5, scale: 1.02, duration: 300, easing: 'easeOutQuad' });
    };
    
    const handleMouseLeave = () => {
      anime.remove(currentIconRef);
      anime({ targets: currentIconRef, scale: 1, rotate: 0, translateY: 0, duration: 300, easing: 'easeOutQuad' });
      anime({ targets: currentCardRef, translateY: 0, scale: 1, duration: 300, easing: 'easeOutQuad' });
    };

    currentCardRef.addEventListener('mouseenter', handleMouseEnter);
    currentCardRef.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      if (currentCardRef) {
        currentCardRef.removeEventListener('mouseenter', handleMouseEnter);
        currentCardRef.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (currentIconRef) anime.remove(currentIconRef);
    };
  }, []);

  return (
    <div ref={cardRef} className={cn("bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border/50 hover:shadow-primary/20 transition-all duration-300 h-full flex flex-col", className)}>
      <div ref={iconRef} className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-headline font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm flex-grow">{description}</p>
      {link && (<Link href={link} className={cn(buttonVariants({ variant: "link" }), "text-primary p-0 mt-4 self-start")}>Saiba Mais <ArrowRight className="ml-2 h-4 w-4" /></Link>)}
    </div>
  );
};

const mockReviews = [
  {
    quote: "Este aplicativo transformou a maneira como eu gerencio minhas finanças. É intuitivo e poderoso. Finalmente sinto que tenho controle total.",
    author: "Ana Silva",
    role: "Cultivadora Consciente",
    avatar: "https://placehold.co/50x50/a2d2ff/333?text=AS",
    rating: 5,
  },
  {
    quote: "Como desenvolvedor, as ferramentas de gestão de projetos são um divisor de águas. O Kanban e o controle de clientes me economizam horas.",
    author: "Bruno Costa",
    role: "DEV",
    avatar: "https://placehold.co/50x50/bde0fe/333?text=BC",
    rating: 5,
  },
  {
    quote: "Simples, bonito e direto ao ponto. O modo privado é genial para quando preciso checar algo rápido na rua. Recomendo!",
    author: "Carla Dias",
    role: "Mestre Jardineira",
    avatar: "https://placehold.co/50x50/ffafcc/333?text=CD",
    rating: 4,
  },
  {
    quote: "Comecei com o plano gratuito e já me ajudou a organizar meu orçamento. É incrível ter tantas funcionalidades sem custo inicial.",
    author: "Daniel Alves",
    role: "Cultivador Consciente",
    avatar: "https://placehold.co/50x50/caffbf/333?text=DA",
    rating: 5,
  },
];

const ReviewCard: FC<(typeof mockReviews)[0]> = ({ quote, author, role, avatar, rating }) => {
  return (
    <div className="review-card bg-foreground/5 backdrop-blur-md p-6 rounded-2xl border border-foreground/10 flex flex-col h-full shadow-xl">
      <div className="flex items-center mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("w-4 h-4", i < rating ? "text-yellow-400 fill-yellow-400" : "text-foreground/20 fill-foreground/20")} />
        ))}
      </div>
      <p className="text-foreground/80 text-sm flex-grow">"{quote}"</p>
      <div className="flex items-center gap-3 mt-6">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={author} data-ai-hint="user avatar" />
          <AvatarFallback>{author.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{author}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
};


export default function LandingPage() {
  const { data: session } = useSession();
  const { activeCampaignTheme, landingPageContent, activePopup, popupConfigs } = useAppSettings();

  // Fallback seguro para garantir que o objeto não seja nulo no servidor
  const safeLandingPageContent = landingPageContent || {
    heroTitle: "",
    heroDescription: "",
    heroImageUrl: "",
    ctaTitle: "",
    ctaDescription: "",
    ctaButtonText: ""
  };

  const getCampaignProps = () => {
    switch (activeCampaignTheme) {
      case 'black-friday':
        return { showFluid: false };
      case 'flash-sale':
        return {
          fluidColor: [224 / 255, 103 / 255, 145 / 255] as [number, number, number],
          speed: 0.2, amplitude: 0.1, showFluid: true,
        };
       case 'super-promocao':
        return {
          fluidColor: [255 / 255, 69 / 255, 0 / 255] as [number, number, number],
          speed: 0.4, amplitude: 0.2, showFluid: true,
        };
      case 'aniversario':
         return {
          fluidColor: [0 / 255, 51 / 255, 102 / 255] as [number, number, number],
          speed: 0.15, amplitude: 0.08, showFluid: true,
        };
      default:
        return {
          fluidColor: [22 / 255, 163 / 255, 129 / 255] as [number, number, number],
          speed: 0.3, amplitude: 0.15, showFluid: true,
        };
    }
  };

  const campaignProps = getCampaignProps();

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroParagraphRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLElement>(null);
  const featuresHeaderRef = useRef<HTMLDivElement>(null);
  const reviewsSectionRef = useRef<HTMLElement>(null);
  const pricingSectionRef = useRef<HTMLElement>(null);
  const finalCtaSectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tlHero = gsap.timeline({ defaults: { ease: "power3.out" } });
    tlHero
      .fromTo(heroTitleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1 })
      .fromTo(heroParagraphRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .fromTo(heroButtonsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .fromTo(heroImageRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }, "-=0.5");
      
    gsap.to(heroImageRef.current, { y: -50, scrollTrigger: { trigger: mainContainerRef.current, start: 'top top', end: 'bottom top', scrub: 1.5 } });

    if (featuresSectionRef.current && featuresHeaderRef.current) {
      gsap.fromTo(featuresHeaderRef.current.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.2, scrollTrigger: { trigger: featuresSectionRef.current, start: "top 85%", toggleActions: "play none none none" }});
      gsap.fromTo(featuresSectionRef.current.querySelectorAll(".feature-card"), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: "power2.out", scrollTrigger: { trigger: featuresSectionRef.current, start: "top 75%", toggleActions: "play none none none" }});
    }

    if (reviewsSectionRef.current) {
      gsap.fromTo(reviewsSectionRef.current.querySelector(".reviews-header"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: reviewsSectionRef.current, start: "top 85%", toggleActions: "play none none none" }});
      gsap.fromTo(reviewsSectionRef.current.querySelectorAll(".review-card"), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: "power2.out", scrollTrigger: { trigger: reviewsSectionRef.current, start: "top 70%", toggleActions: "play none none none" }});
    }

     if (pricingSectionRef.current) {
      gsap.fromTo(pricingSectionRef.current.querySelector(".pricing-header"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: pricingSectionRef.current, start: "top 85%", toggleActions: "play none none none" }});
      gsap.fromTo(pricingSectionRef.current.querySelectorAll(".pricing-card"), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: "power2.out", scrollTrigger: { trigger: pricingSectionRef.current, start: "top 70%", toggleActions: "play none none none" }});
    }
    if (finalCtaSectionRef.current) gsap.fromTo(finalCtaSectionRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: finalCtaSectionRef.current, start: "top 85%", toggleActions: "play none none none" }});
  
  }, { scope: mainContainerRef });
  
  const [showPopup, setShowPopup] = useState(false);
  useEffect(() => {
    // Only show popup once per session to avoid annoying users
    const hasSeenPopup = sessionStorage.getItem('flortune-popup-seen');
    if (activePopup && !hasSeenPopup) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        sessionStorage.setItem('flortune-popup-seen', 'true');
      }, 2500); // Delay before showing popup
      return () => clearTimeout(timer);
    }
  }, [activePopup]);


  return (
    <div className={cn("relative min-h-screen w-full overflow-x-hidden text-foreground")} ref={mainContainerRef}>
      {campaignProps?.showFluid && (
        <Iridescence 
          color={campaignProps.fluidColor} 
          speed={campaignProps.speed} 
          amplitude={campaignProps.amplitude} 
        />
      )}
      <div className="relative z-10 isolate">
        <header className="py-4 px-4 md:px-8">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <Image src="/Logo.png" alt="Flortune Logo" width={32} height={32} style={{ height: 'auto' }} />
              <span className="text-2xl font-headline font-bold">{APP_NAME}</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href={session ? "/dashboard" : "/login"} className={cn(buttonVariants({ variant: 'ghost' }), "text-foreground hover:bg-foreground/10 hover:text-foreground")}>{session ? "Acessar Painel" : "Login"}</Link>
              {!session && <Link href="/signup" className={cn(buttonVariants({ variant: 'default' }), "bg-accent hover:bg-accent/90 text-accent-foreground")}>Criar Conta Grátis</Link>}
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 md:px-8">
          <section className="text-center py-20 md:py-32 min-h-[calc(100vh-150px)] flex flex-col justify-center items-center">
            <h1 ref={heroTitleRef} className="text-4xl md:text-6xl font-headline font-extrabold mb-6 tracking-tight opacity-0">{safeLandingPageContent.heroTitle}</h1>
            <p ref={heroParagraphRef} className="text-lg md:text-xl text-foreground/80 mb-10 max-w-3xl mx-auto opacity-0">{safeLandingPageContent.heroDescription}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0" ref={heroButtonsRef}>
              <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), "bg-accent hover:bg-accent/90 text-accent-foreground")}>Comece Agora (Grátis)</Link>
            </div>
            <div ref={heroImageRef} className="mt-16 md:mt-24 opacity-0">
              <Image 
                src={safeLandingPageContent.heroImageUrl} 
                alt="Flortune App Mockup" 
                width={800} 
                height={450} 
                className="rounded-lg shadow-2xl border-4 border-foreground/20" 
                data-ai-hint="app dashboard" 
                priority 
              />
            </div>
          </section>

          <section className="py-16 md:py-24" ref={featuresSectionRef}>
            <div className="text-center mb-12 md:mb-16" ref={featuresHeaderRef}>
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4 opacity-0">Funcionalidades Principais</h2>
              <p className="text-foreground/80 max-w-xl mx-auto opacity-0">Tudo o que você precisa para florescer financeiramente e profissionalmente.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard className="feature-card" icon={BarChart3} title="Análise Visual" description="Entenda seus gastos e receitas com gráficos intuitivos e relatórios detalhados." />
                <FeatureCard className="feature-card" icon={CalendarDays} title="Calendário Financeiro" description="Visualize todos os seus eventos e transações importantes em um único lugar." />
                <FeatureCard className="feature-card" icon={BrainCircuit} title="Insights com IA" description="Receba sugestões inteligentes para otimizar seus gastos e alcançar suas metas mais rápido (em breve)." />
                <FeatureCard className="feature-card" icon={Eye} title="Modo Privado" description="Proteja sua privacidade com um clique, ocultando todos os valores sensíveis na tela." />
                <FeatureCard className="feature-card" icon={ShieldCheck} title="Segurança Avançada" description="Seus dados são protegidos com as melhores práticas de segurança e criptografia." />
                <FeatureCard className="feature-card" icon={GanttChartSquare} title="Ferramentas DEV" description="Gerencie clientes, projetos e utilize calculadoras especializadas para freelancers." />
            </div>
          </section>

          <section className="py-16 md:py-24" ref={pricingSectionRef}>
             <div className="text-center pricing-header">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Planos Para Todos os Perfis</h2>
              <p className="text-foreground/80 mb-12 md:mb-16 max-w-xl mx-auto">Do cultivador iniciante ao mestre desenvolvedor, temos o plano perfeito para você.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8 items-stretch">
                {PRICING_TIERS.map((tier) => {
                  const TierIcon = getPricingIcon(tier.icon as PricingTierIconName);
                  const isPaidPlan = tier.priceMonthly !== 'Grátis';
                  return (
                    <Card key={tier.id} className={cn("flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-primary/20 pricing-card", tier.featured ? "border-primary ring-2 ring-primary" : "")}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-2"><div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", tier.featured ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><TierIcon className="h-6 h-6" /></div><CardTitle className={cn("font-headline text-xl", tier.featured ? "text-primary" : "text-foreground")}>{tier.name}</CardTitle></div>
                        <div className="flex flex-wrap items-baseline gap-x-1"><span className={cn("text-4xl font-bold tracking-tight", tier.featured ? "text-primary" : "text-foreground")}>{tier.priceMonthly}</span>{tier.priceMonthly !== 'Grátis' && tier.priceAnnotation && (<span className="text-sm font-normal text-muted-foreground">{tier.priceAnnotation}</span>)}{tier.priceMonthly !== 'Grátis' && !tier.priceAnnotation && (<span className="text-sm font-normal text-muted-foreground">/mês</span>)}</div>
                        <CardDescription className="pt-2 text-sm min-h-[60px]">{tier.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <ul role="list" className="space-y-2.5 text-sm text-muted-foreground">
                          {tier.features.map((feature) => (<li key={feature} className="flex gap-x-3 items-start"><Check className={cn("h-5 w-5 flex-none mt-0.5", tier.featured ? "text-primary" : "text-green-500")} aria-hidden="true" /><span>{feature}</span></li>))}
                        </ul>
                      </CardContent>
                      {isPaidPlan && (
                        <CardFooter>
                          <Button asChild size="lg" className={cn("w-full", !tier.featured && "bg-accent hover:bg-accent/90 text-accent-foreground", tier.featured && buttonVariants({variant: "default"}))}>
                            <Link href={tier.href} target="_blank">
                              {tier.id.includes('corporativo') ? 'Contatar Vendas' : 'Assinar Plano'}
                            </Link>
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
              </div>
          </section>

          <section className="py-16 md:py-24" ref={reviewsSectionRef}>
            <div className="text-center mb-12 md:mb-16 reviews-header">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">O que nossos primeiros usuários dizem</h2>
              <p className="text-foreground/80 max-w-xl mx-auto">Feedback real de pessoas que estão cultivando suas finanças com o Flortune.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockReviews.map((review, index) => (
                <ReviewCard key={index} {...review} />
              ))}
            </div>
          </section>


          <section className="py-16 md:py-24 text-center" ref={finalCtaSectionRef}>
              <div className="bg-primary/20 backdrop-blur-md p-8 md:p-12 rounded-xl shadow-xl border border-primary/50 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">{safeLandingPageContent.ctaTitle}</h2>
                <p className="text-foreground/80 mb-8">{safeLandingPageContent.ctaDescription}</p>
                <Link href="/signup" className={cn(buttonVariants({size: 'lg'}), "bg-accent hover:bg-accent/90 text-accent-foreground")}>{safeLandingPageContent.ctaButtonText}</Link>
              </div>
          </section>
        </main>
        <footer className="py-8 border-t border-foreground/10 mt-16">
          <div className="container mx-auto text-center text-sm text-foreground/60">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</p>
            <nav className="mt-2">
                <Link href="/terms" className="hover:text-foreground/80 px-2">Termos de Serviço</Link>
                <span className="px-1">|</span>
                <Link href="/policy" className="hover:text-foreground/80 px-2">Política de Privacidade</Link>
            </nav>
          </div>
        </footer>
      </div>
      {/* Pop-up Rendering */}
      <div className="fixed bottom-5 right-5 z-50">
        {showPopup && activePopup === 'maintenance' && popupConfigs?.maintenance && <MaintenancePopup config={popupConfigs.maintenance} onDismiss={() => setShowPopup(false)} />}
        {showPopup && activePopup === 'promotion' && popupConfigs?.promotion && <PromotionPopup config={popupConfigs.promotion} onDismiss={() => setShowPopup(false)} />}
        {showPopup && activePopup === 'newsletter' && popupConfigs?.newsletter && <NewsletterPopup config={popupConfigs.newsletter} onDismiss={() => setShowPopup(false)} />}
      </div>
    </div>
  );
}
