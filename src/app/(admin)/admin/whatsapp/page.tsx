// src/app/(admin)/admin/whatsapp/page.tsx
"use client";

import { useEffect } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import Image from 'next/image';

export default function WhatsappPage() {
  useEffect(() => {
    document.title = `Integração WhatsApp - ${APP_NAME}`;
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integração com WhatsApp"
        icon={<Bot />}
        description="Conecte sua conta do WhatsApp Business para automações e notificações."
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start gap-4">
          <Image src="/Hana.png" alt="Hana AI Assistant" width={80} height={80} className="rounded-full border-2 border-primary/50" />
          <div className="flex-1">
            <CardTitle className="font-headline flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Olá, sou a Hana (花)!
            </CardTitle>
            <CardDescription className="mt-1">
              A integração com o WhatsApp está em desenvolvimento.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve, você poderá conectar o Flortune à API do WhatsApp Business para enviar lembretes de pagamento, notificações de projetos e muito mais. Volte em breve para conferir as novidades!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
