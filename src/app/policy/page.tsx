// src/app/policy/page.tsx
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Política de Privacidade - ${APP_NAME}`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background min-h-screen">
       <header className="py-4 px-4 md:px-8 border-b">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-headline font-bold">{APP_NAME} - Documentação</span>
            </Link>
            <Button asChild variant="outline">
                <Link href="/">Voltar ao Início</Link>
            </Button>
          </div>
        </header>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <PageHeader
          title="Política de Privacidade"
          description={`Última atualização: ${new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
          icon={<Shield className="h-6 w-6 text-primary" />}
        />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Sua Privacidade é Nossa Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
            <p>
              Esta Política de Privacidade descreve como suas informações pessoais são coletadas, usadas e compartilhadas quando você utiliza o {APP_NAME} ("Serviço").
            </p>

            <section>
              <h3 className="font-semibold text-foreground">1. Informações que Coletamos</h3>
              <ul>
                <li><strong>Informações de Cadastro:</strong> Quando você se registra, coletamos informações como seu nome, endereço de e-mail e senha (armazenada de forma segura e criptografada).</li>
                <li><strong>Dados Financeiros e de Projetos:</strong> Coletamos as informações que você insere no aplicativo, como descrições de transações, valores, orçamentos, metas, tarefas e detalhes de projetos. Nós não temos acesso aos seus dados bancários ou senhas de banco.</li>
                <li><strong>Informações de Uso:</strong> Podemos coletar informações sobre como você interage com nosso Serviço, como as funcionalidades que você mais usa, para nos ajudar a melhorar a plataforma.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground">2. Como Usamos Suas Informações</h3>
              <p>Usamos as informações que coletamos para:</p>
              <ul>
                <li>Fornecer, operar e manter nosso Serviço.</li>
                <li>Melhorar, personalizar e expandir nosso Serviço.</li>
                <li>Entender e analisar como você usa nosso Serviço.</li>
                <li>Comunicar com você, seja para atendimento ao cliente, para fornecer atualizações e outras informações relacionadas ao Serviço, e para fins de marketing (com seu consentimento).</li>
                <li>Processar suas transações e prevenir fraudes.</li>
              </ul>
            </section>
            
            <section>
              <h3 className="font-semibold text-foreground">3. Compartilhamento de Informações</h3>
              <p>Nós não vendemos, alugamos ou trocamos suas informações pessoais com terceiros para fins comerciais.</p>
                <ul>
                    <li><strong>Provedores de Serviço:</strong> Utilizamos provedores de serviço de confiança para nos ajudar a operar nossa plataforma, como o Supabase para banco de dados e autenticação. Esses provedores têm acesso limitado às suas informações apenas para realizar tarefas em nosso nome e são obrigados a não divulgá-las ou usá-las para outros fins.</li>
                    <li><strong>Obrigações Legais:</strong> Podemos divulgar suas informações se formos obrigados por lei ou em resposta a solicitações válidas por autoridades públicas.</li>
                    <li><strong>Funcionalidade de Compartilhamento:</strong> Se você usar a funcionalidade de compartilhamento de módulos, as informações contidas naquele módulo serão compartilhadas com os usuários que você convidar, de acordo com as permissões que você definir.</li>
                </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground">4. Segurança dos Dados</h3>
              <p>
                A segurança dos seus dados é de extrema importância para nós. Usamos medidas de segurança padrão da indústria, incluindo criptografia e as melhores práticas fornecidas por nossos parceiros tecnológicos como o Supabase, para proteger suas informações. No entanto, lembre-se de que nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro.
              </p>
            </section>

             <section>
                <h3 className="font-semibold text-foreground">5. Seus Direitos</h3>
                <p>Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de suas informações pessoais a qualquer momento através das configurações do seu perfil ou entrando em contato conosco.</p>
            </section>
            
            <section>
                <h3 className="font-semibold text-foreground">6. Alterações nesta Política</h3>
                <p>Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações publicando a nova Política de Privacidade nesta página e atualizando a data da "Última atualização".</p>
            </section>

             <section>
                <h3 className="font-semibold text-foreground">7. Contato</h3>
                <p>Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo email <a href="mailto:privacidade@flortune.com" className="text-primary hover:underline">privacidade@flortune.com</a>.</p>
            </section>
            
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
