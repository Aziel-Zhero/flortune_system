
// src/app/(app)/help/page.tsx
"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, Info, Mail, Phone, MessageSquare } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

const faqItems = [
  {
    question: "Como adiciono uma nova transação?",
    answer: "É simples! Navegue até a página 'Transações' no menu lateral e clique no botão 'Adicionar Transação'. Preencha os detalhes e salve. Você também pode adicionar transações rapidamente pelo botão no Dashboard.",
  },
  {
    question: "O que é o 'Modo Privado'?",
    answer: `O Modo Privado, ativado pelo ícone de olho no cabeçalho, oculta todos os valores financeiros na tela. É perfeito para usar o ${APP_NAME} em locais públicos ou ao compartilhar sua tela, garantindo sua privacidade.`,
  },
  {
    question: "Meus dados financeiros estão seguros?",
    answer: "Sim, a segurança é nossa prioridade. Utilizamos as melhores práticas de segurança do mercado, incluindo criptografia, para proteger suas informações. Suas senhas são armazenadas de forma segura e não temos acesso a elas.",
  },
  {
    question: "Posso usar o Flortune em múltiplos dispositivos?",
    answer: "Com certeza! O Flortune é um aplicativo web e pode ser acessado de qualquer navegador em seu computador, tablet ou smartphone. Seus dados são sincronizados automaticamente.",
  },
  {
    question: "Para que serve a página 'Análise'?",
    answer: "A página de Análise oferece uma visão detalhada de suas finanças com gráficos interativos. Você pode ver a distribuição de seus gastos por categoria, suas fontes de renda e a evolução de seu fluxo de caixa ao longo do tempo.",
  },
];

function SupportContactItem({
  icon: Icon,
  title,
  description,
  children,
  disabled = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-3 rounded-md",
        "hover:bg-muted/50",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <Icon className="h-5 w-5 text-primary mt-1" />
      <div>
        <h4 className="font-semibold flex items-center gap-2">
          {title} {disabled && <Badge variant="outline">em breve</Badge>}
        </h4>
        <p className="text-sm text-muted-foreground">{description}</p>
        {children}
      </div>
    </div>
  );
}

export default function HelpPage() {
  useEffect(() => {
    document.title = `Central de Ajuda - ${APP_NAME}`;
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Central de Ajuda"
        description={`Bem-vindo à Central de Ajuda do ${APP_NAME}. Aqui você encontrará respostas para suas dúvidas.`}
        icon={<LifeBuoy className="h-6 w-6 text-primary" />}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center">
            <Info className="mr-2 h-5 w-5 text-primary"/>
            Sobre o {APP_NAME}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            O <strong>{APP_NAME}</strong> foi criado com a finalidade de ser seu assistente financeiro pessoal, um verdadeiro "jardineiro" para suas finanças. Nossa missão é oferecer ferramentas intuitivas e poderosas para que você possa cultivar hábitos financeiros saudáveis, acompanhar seu progresso e, finalmente, ver seu patrimônio florescer.
          </p>
          <p>
            Acreditamos que o gerenciamento financeiro não precisa ser complicado. Com uma interface moderna, gráficos claros e insights inteligentes (em breve com IA!), queremos transformar a maneira como você interage com seu dinheiro, tornando o processo mais transparente, organizado e motivador.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Perguntas Frequentes (FAQ)</CardTitle>
          <CardDescription>Respostas para as dúvidas mais comuns de nossos usuários.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger aria-label={`Pergunta: ${item.question}`} className="text-left font-semibold">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
         <CardHeader>
          <CardTitle className="font-headline">Contato do Suporte</CardTitle>
          <CardDescription>Precisa de mais ajuda? Entre em contato conosco através dos canais abaixo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SupportContactItem
            icon={Mail}
            title="Email"
            description="Para dúvidas gerais, sugestões ou problemas técnicos."
          >
            <a
              href="mailto:suporte@flortune.com"
              className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto text-primary")}
            >
              suporte@flortune.com
            </a>
          </SupportContactItem>

          <SupportContactItem
            icon={Phone}
            title="Telefone"
            description="Um canal de voz para suporte em tempo real estará disponível em breve para planos selecionados."
            disabled
          />

          <SupportContactItem
            icon={MessageSquare}
            title="Chat de Suporte"
            description="Converse com nossa equipe diretamente pelo aplicativo. Funcionalidade futura."
            disabled
          />
        </CardContent>
      </Card>
      
       <p className="text-sm text-muted-foreground text-center mt-6">
        Ainda tem dúvidas? Envie um email para{" "}
        <Link href="mailto:suporte@flortune.com" className="underline text-primary">
          suporte@flortune.com
        </Link>
        .
      </p>
    </div>
  );
}
