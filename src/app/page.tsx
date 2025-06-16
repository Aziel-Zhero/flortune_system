
"use client";

import Link from "next/link";
import { Leaf, BarChart3, CalendarDays, BrainCircuit, Eye, ShieldCheck, ArrowRight, Check, Users, Briefcase } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Iridescence from "@/components/shared/iridescence";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import anime from 'animejs'; 
import React, { useRef, useEffect, type FC } from 'react';

gsap.registerPlugin(ScrollTrigger);

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
      anime({
        targets: currentIconRef,
        scale: [
          { value: 1.2, duration: 200, easing: 'easeOutQuad' },
          { value: 1, duration: 300, easing: 'easeInOutQuad' }
        ],
        rotate: [
          { value: 10, duration: 150, easing: 'easeOutSine' },
          { value: -10, duration: 150, delay: 50, easing: 'easeInOutSine' },
          { value: 0, duration: 150, delay: 50, easing: 'easeInSine' }
        ],
        translateY: [
          { value: -5, duration: 150, easing: 'easeOutQuad' },
          { value: 0, duration: 200, easing: 'easeInQuad' }
        ],
        duration: 600,
      });
    };

    const handleMouseLeave = () => {
      anime.remove(currentIconRef);
      anime({
        targets: currentIconRef,
        scale: 1,
        rotate: 0,
        translateY: 0,
        duration: 300,
        easing: 'easeOutQuad'
      });
    };

    currentCardRef.addEventListener('mouseenter', handleMouseEnter);
    currentCardRef.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (currentCardRef) {
        currentCardRef.removeEventListener('mouseenter', handleMouseEnter);
        currentCardRef.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (currentIconRef) {
        anime.remove(currentIconRef);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className={cn("bg-card/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-border/50 hover:shadow-primary/20 transition-shadow duration-300 h-full flex flex-col", className)}>
      <div ref={iconRef} className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-headline font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm flex-grow">{description}</p>
      {link && (
        <Link href={link} className={cn(buttonVariants({ variant: "link" }), "text-primary p-0 mt-4 self-start")}>
          Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      )}
    </div>
  );
};


const pricingTiers = [
  {
    name: 'Cultivador Consciente',
    id: 'tier-cultivador',
    href: '/signup?plan=cultivador',
    priceMonthly: 'Grátis',
    description: "Comece a organizar suas finanças e cultivar bons hábitos financeiros sem custo.",
    features: [
      'Gerenciamento de transações',
      'Criação de orçamentos básicos',
      'Definição de metas financeiras',
      'Visão geral com calendário financeiro'
    ],
    featured: false,
    icon: Leaf,
  },
  {
    name: 'Mestre Jardineiro',
    id: 'tier-mestre',
    href: '/signup?plan=mestre',
    priceMonthly: 'R$19,90',
    description: 'Desbloqueie todo o potencial do Flortune com análises avançadas e IA.',
    features: [
      'Todas as funcionalidades do plano Cultivador',
      'Análise de dados detalhada',
      'Sugestões financeiras com IA',
      'Auto-categorização de transações por IA',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    featured: true,
    icon: BrainCircuit,
  },
  {
    name: 'Flortune Corporativo',
    id: 'tier-corporativo',
    href: '/signup?plan=corporativo',
    priceMonthly: 'R$390,99*',
    priceAnnotation: 'por usuário/mês',
    description: 'Soluções financeiras robustas e personalizadas para grandes equipes e empresas em crescimento.',
    features: [
      'Todas as funcionalidades do Mestre Jardineiro',
      'Gerenciamento de múltiplos usuários/equipes',
      'Permissões de acesso personalizadas',
      'Painel de controle administrativo',
      'Suporte empresarial dedicado (SLA)',
      'Integrações com sistemas contábeis (sob demanda)',
      'Consultoria financeira especializada',
    ],
    featured: false, 
    icon: Briefcase,
  },
];


export default function LandingPage() {
  const { session, isLoading } = useAuth();

  const flortuneTealRGB: [number, number, number] = [22/255, 163/255, 129/255];

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroParagraphRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);

  const featuresSectionRef = useRef<HTMLElement>(null);
  const featuresHeaderRef = useRef<HTMLDivElement>(null);

  const pricingSectionRef = useRef<HTMLElement>(null);
  const pricingHeaderRef = useRef<HTMLDivElement>(null);
  const pricingGridRef = useRef<HTMLDivElement>(null);
  const corporatePricingCardRef = useRef<HTMLDivElement>(null);


  const finalCtaSectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (isLoading) return;

    const tlHero = gsap.timeline({ defaults: { ease: "power3.out" } });

    tlHero.fromTo(heroTitleRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8 })
      .fromTo(heroParagraphRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .fromTo(heroButtonsRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .fromTo(heroImageRef.current, { opacity: 0, scale: 0.9, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 1, ease: "elastic.out(1, 0.75)" }, "-=0.5");

    if (featuresSectionRef.current && featuresHeaderRef.current) {
      gsap.fromTo(featuresHeaderRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.2,
          scrollTrigger: {
            trigger: featuresSectionRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          }
        }
      );
      gsap.fromTo(featuresSectionRef.current.querySelectorAll(".feature-card"),
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "power2.out",
          scrollTrigger: {
            trigger: featuresSectionRef.current,
            start: "top 75%", 
            toggleActions: "play none none none",
          }
        }
      );
    }

    if (pricingSectionRef.current && pricingHeaderRef.current) {
      gsap.fromTo(pricingHeaderRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, stagger: 0.2,
          scrollTrigger: {
            trigger: pricingSectionRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          }
        }
      );
      
      if (pricingGridRef.current) {
        gsap.fromTo(pricingGridRef.current.querySelectorAll(".pricing-tier-grid"),
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.15, ease: "power2.out",
            scrollTrigger: {
              trigger: pricingGridRef.current,
              start: "top 75%",
              toggleActions: "play none none none",
            }
          }
        );
      }
      
      if (corporatePricingCardRef.current) {
         gsap.fromTo(corporatePricingCardRef.current,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out",
            scrollTrigger: {
              trigger: corporatePricingCardRef.current, 
              start: "top 85%", 
              toggleActions: "play none none none",
            }
          }
        );
      }
    }

    if (finalCtaSectionRef.current && (!session && !isLoading)) {
        gsap.fromTo(finalCtaSectionRef.current,
            { opacity: 0, y: 50 },
            {
                opacity: 1, y: 0, duration: 0.8,
                scrollTrigger: {
                    trigger: finalCtaSectionRef.current,
                    start: "top 85%",
                    toggleActions: "play none none none",
                }
            }
        );
    }

  }, { scope: mainContainerRef, dependencies: [isLoading, session] });


  let headerActions = null;
  let heroActions = null;

  if (isLoading) {
    headerActions = (
      <>
        <Skeleton className="h-10 w-24 bg-muted/50 rounded-md opacity-0" />
        <Skeleton className="h-10 w-32 bg-muted/50 rounded-md opacity-0" />
      </>
    );
    heroActions = (
      <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0" ref={heroButtonsRef}>
        <Skeleton className="h-12 w-48 bg-muted/50 rounded-md" />
        <Skeleton className="h-12 w-40 bg-muted/50 rounded-md" />
      </div>
    );
  } else if (session) {
    headerActions = (
      <Button asChild>
        <Link href="/dashboard">Acessar Painel</Link>
      </Button>
    );
    heroActions = (
      <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0" ref={heroButtonsRef}>
        <Button asChild size="lg">
          <Link href="/dashboard">Ir para o Painel</Link>
        </Button>
      </div>
    );
  } else {
    headerActions = (
      <>
        <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/signup">Criar Conta Grátis</Link>
        </Button>
      </>
    );
    heroActions = (
      <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0" ref={heroButtonsRef}>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/signup">Comece Agora (Grátis)</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="text-white border-white/50 hover:bg-white/10 hover:text-white">
          <Link href="/login">Já Tenho Conta</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white" ref={mainContainerRef}>
      <Iridescence
        color={flortuneTealRGB}
        speed={0.3}
        amplitude={0.15}
        mouseReact={true}
      />

      <div className="relative z-10 isolate">
        <header className="py-4 px-4 md:px-8">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <Leaf size={32} />
              <span className="text-2xl font-headline font-bold">{APP_NAME}</span>
            </Link>
            <nav className="flex items-center gap-2">
              {headerActions}
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 md:px-8">
          <section className="text-center py-20 md:py-32 min-h-[calc(100vh-150px)] flex flex-col justify-center items-center">
            <h1
              ref={heroTitleRef}
              className="text-4xl md:text-6xl font-headline font-extrabold mb-6 tracking-tight opacity-0"
            >
              Cultive Suas Finanças com <span className="text-accent">Inteligência</span> e Estilo.
            </h1>
            <p
              ref={heroParagraphRef}
              className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto opacity-0"
            >
              {APP_NAME} ajuda você a organizar, analisar e alcançar seus objetivos financeiros com ferramentas intuitivas e insights poderosos.
            </p>
            {heroActions}
            <div
              ref={heroImageRef}
              className="mt-16 md:mt-24 opacity-0"
            >
                <Image
                    src="https://placehold.co/800x450.png"
                    alt="Flortune App Mockup"
                    width={800}
                    height={450}
                    className="rounded-lg shadow-2xl border-4 border-white/20"
                    data-ai-hint="app dashboard"
                    priority
                />
            </div>
          </section>

          <section className="py-16 md:py-24" ref={featuresSectionRef}>
            <div ref={featuresHeaderRef} className="text-center opacity-0">
              <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4">Transforme sua Vida Financeira</h2>
              <p className="text-white/80 mb-12 md:mb-16 max-w-xl mx-auto">
                Descubra como o {APP_NAME} pode simplificar o gerenciamento do seu dinheiro e impulsionar seu crescimento financeiro.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={CalendarDays}
                title="Calendário Financeiro Intuitivo"
                description="Visualize suas despesas e receitas de forma clara, dia a dia, mês a mês. Nunca mais perca um vencimento."
                className="feature-card opacity-0"
              />
              <FeatureCard
                icon={BarChart3}
                title="Análise de Dados Poderosa"
                description="Entenda seus padrões de gastos com gráficos e relatórios detalhados. Tome decisões financeiras mais inteligentes."
                className="feature-card opacity-0"
              />
              <FeatureCard
                icon={BrainCircuit}
                title="Sugestões com Inteligência Artificial"
                description="Receba dicas personalizadas e insights gerados por IA para otimizar seus orçamentos e economizar mais. (Plano Mestre)"
                className="feature-card opacity-0"
              />
              <FeatureCard
                icon={Eye}
                title="Modo Privado Inteligente"
                description="Oculte seus dados financeiros com um clique. Privacidade e discrição quando você mais precisa."
                className="feature-card opacity-0"
              />
               <FeatureCard
                icon={ShieldCheck}
                title="Segurança em Primeiro Lugar"
                description="Seus dados são protegidos com criptografia de ponta e as melhores práticas de segurança do mercado."
                className="feature-card opacity-0"
              />
               <FeatureCard
                icon={Leaf}
                title="Metas e Orçamentos Flexíveis"
                description="Defina metas alcançáveis e crie orçamentos que se adaptam ao seu estilo de vida. Veja seu progresso florescer."
                className="feature-card opacity-0"
              />
            </div>
          </section>

          <section className="py-16 md:py-24" ref={pricingSectionRef}>
            <div ref={pricingHeaderRef} className="mx-auto max-w-4xl text-center opacity-0">
              <h2 className="text-base/7 font-semibold text-accent">Nossos Planos</h2>
              <p className="mt-2 text-4xl md:text-5xl font-headline font-semibold tracking-tight text-white">
                Escolha o Plano Ideal para Você
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-white/80 sm:text-xl/8">
                Comece gratuitamente ou desbloqueie funcionalidades avançadas para levar suas finanças ao próximo nível.
              </p>
            </div>
            
            <div ref={pricingGridRef} className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
              {pricingTiers.slice(0, 2).map((tier, tierIdx) => {
                const TierIcon = tier.icon;
                const isFeatured = tier.featured;
                return (
                <div
                  key={tier.id}
                  className={cn(
                    'pricing-tier-grid opacity-0', 
                    isFeatured ? 'relative bg-primary/80 backdrop-blur-md shadow-2xl z-10' : 'bg-card/70 backdrop-blur-md sm:mx-8 lg:mx-0',
                    isFeatured
                      ? ''
                      : tierIdx === 0
                        ? 'lg:rounded-r-none lg:rounded-bl-3xl' 
                        : 'lg:rounded-l-none lg:rounded-br-3xl', 
                    'rounded-3xl p-8 ring-1 ring-white/20 sm:p-10 flex flex-col'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                     <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", isFeatured ? "bg-accent/30" : "bg-primary/30")}>
                         <TierIcon className={cn("h-5 w-5", isFeatured ? "text-accent" : "text-primary")} />
                     </div>
                     <h3
                        id={tier.id}
                        className={cn(isFeatured ? 'text-accent' : 'text-primary', 'text-xl font-headline font-semibold')}
                      >
                        {tier.name}
                      </h3>
                  </div>
                  
                  <p className="mt-1 flex items-baseline gap-x-2">
                    <span
                      className={cn(
                        isFeatured ? 'text-white' : 'text-foreground',
                        'text-4xl font-bold tracking-tight'
                      )}
                    >
                      {tier.priceMonthly}
                    </span>
                    {tier.priceMonthly !== 'Grátis' && !tier.priceAnnotation && (
                       <span className={cn(isFeatured ? 'text-white/70' : 'text-muted-foreground', 'text-base')}>/mês</span>
                    )}
                  </p>
                  {tier.priceAnnotation && (
                    <p className={cn(isFeatured ? 'text-white/70' : 'text-muted-foreground', 'text-sm -mt-1 mb-2')}>{tier.priceAnnotation}</p>
                  )}

                  <p className={cn(isFeatured ? 'text-white/80' : 'text-muted-foreground', 'mt-3 text-sm/6', !isFeatured ? '' : 'flex-grow')}>
                    {tier.description}
                  </p>
                  <ul
                    role="list"
                    className={cn(
                      isFeatured ? 'text-white/80' : 'text-muted-foreground',
                      'mt-6 space-y-2.5 text-sm/6 sm:mt-8',
                      !isFeatured ? '' : 'flex-grow'
                    )}
                  >
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <Check
                          aria-hidden="true"
                          className={cn(isFeatured ? 'text-accent' : 'text-primary', 'h-5 w-5 flex-none mt-0.5')}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    size="lg"
                    className={cn(
                      'w-full mt-auto', // mt-auto empurra para baixo
                      isFeatured ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    <Link href={tier.href} aria-describedby={tier.id}>
                      Começar Agora
                    </Link>
                  </Button>
                </div>
              )})}
            </div>

            {pricingTiers[2] && (() => {
                const tier = pricingTiers[2];
                const TierIcon = tier.icon;
                return (
                    <div 
                        ref={corporatePricingCardRef}
                        key={tier.id}
                        className={cn(
                        'pricing-tier-corporate opacity-0 mt-8 mx-auto max-w-2xl w-full', 
                        'bg-card/70 backdrop-blur-md',
                        'rounded-3xl p-8 ring-1 ring-white/20 sm:p-10 flex flex-col'
                        )}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-primary/30")}>
                                <TierIcon className={cn("h-5 w-5 text-primary")} />
                            </div>
                            <h3 id={tier.id} className={cn('text-primary', 'text-xl font-headline font-semibold')}>
                                {tier.name}
                            </h3>
                        </div>
                        <p className="mt-1 flex items-baseline gap-x-2">
                            <span className={cn('text-foreground', 'text-4xl font-bold tracking-tight')}>
                            {tier.priceMonthly}
                            </span>
                        </p>
                        {tier.priceAnnotation && (
                            <p className={cn('text-muted-foreground', 'text-sm -mt-1 mb-2')}>{tier.priceAnnotation}</p>
                        )}
                        <p className={cn('text-muted-foreground', 'mt-3 text-sm/6 flex-grow')}>
                            {tier.description}
                        </p>
                        <ul role="list" className={cn('text-muted-foreground', 'mt-6 space-y-2.5 text-sm/6 sm:mt-8 flex-grow')}>
                            {tier.features.map((feature) => (
                            <li key={feature} className="flex gap-x-3">
                                <Check aria-hidden="true" className={cn('text-primary', 'h-5 w-5 flex-none mt-0.5')} />
                                {feature}
                            </li>
                            ))}
                        </ul>
                        <Button asChild size="lg" className={cn('w-full mt-auto', 'bg-primary text-primary-foreground hover:bg-primary/90')}>
                            <Link href={tier.href} aria-describedby={tier.id}>
                            Contatar Vendas
                            </Link>
                        </Button>
                    </div>
                );
            })()}
          </section>

          {!session && !isLoading && (
            <section className="py-16 md:py-24 text-center opacity-0" ref={finalCtaSectionRef}>
                 <div className="bg-primary/20 backdrop-blur-md p-8 md:p-12 rounded-xl shadow-xl border border-primary/50 max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">Pronto para Cultivar seu Futuro Financeiro?</h2>
                    <p className="text-white/80 mb-8">
                        Junte-se a milhares de usuários que estão transformando suas finanças com o {APP_NAME}. É rápido, fácil e gratuito para começar.
                    </p>
                    <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Link href="/signup">Criar Minha Conta Grátis</Link>
                    </Button>
                 </div>
            </section>
          )}
        </main>

        <footer className="py-8 border-t border-white/10 mt-16">
          <div className="container mx-auto text-center text-sm text-white/60">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</p>
            <nav className="mt-2">
              <Link href="#" className="hover:text-white/80 px-2">Termos de Serviço</Link>
              <span className="px-1">|</span>
              <Link href="#" className="hover:text-white/80 px-2">Política de Privacidade</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
