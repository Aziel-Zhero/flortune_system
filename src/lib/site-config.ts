// src/lib/site-config.ts

import type { LandingPageContent, PopupType, PopupConfig } from '@/contexts/app-settings-context';

export const defaultLpContent: LandingPageContent = {
  heroTitle: 'Cultive Suas Finanças e Projetos com Inteligência.',
  heroDescription: 'Flortune é a plataforma completa para organizar suas finanças pessoais e gerenciar projetos de desenvolvimento com ferramentas poderosas e insights inteligentes.',
  heroImageUrl: 'https://placehold.co/800x450/16a34a/ffffff?text=Flortune',
  ctaTitle: "Pronto para Cultivar seu Futuro?",
  ctaDescription: "Junte-se a milhares de usuários e desenvolvedores que estão transformando suas finanças e projetos com o Flortune. É rápido, fácil e gratuito para começar.",
  ctaButtonText: "Criar Minha Conta Grátis",
};

export const defaultPopupConfigs: Record<PopupType, PopupConfig> = {
  maintenance: { 
    title: "Manutenção Agendada", 
    description: "Estaremos realizando uma manutenção no sistema no próximo domingo das 02:00 às 04:00. O sistema poderá ficar indisponível.", 
    icon: "Construction", 
    color: "amber",
    frequencyValue: 2, 
    frequencyUnit: 'horas' 
  },
  promotion: { 
    title: "Oferta Especial!", 
    description: "Assine o plano Mestre Jardineiro hoje e ganhe 30% de desconto nos primeiros 3 meses!", 
    icon: "Ticket", 
    color: "primary",
    frequencyValue: 1, 
    frequencyUnit: 'dias'
  },
  newsletter: { 
    title: "Assine nossa Newsletter", 
    description: "Receba dicas semanais de finanças e produtividade diretamente no seu email.", 
    icon: "Newspaper", 
    color: "blue",
    frequencyValue: 3, 
    frequencyUnit: 'dias'
  },
};
