
# Flortune 🌿💰

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Genkit](https://img.shields.io/badge/Genkit-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://firebase.google.com/docs/genkit) <!-- Assuming Genkit is Google related -->
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_BADGE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_NETLIFY_SITE_NAME/deploys) <!-- Replace with your actual Netlify badge ID and site name -->

**Flortune** é um aplicativo web moderno para gerenciamento financeiro pessoal, projetado para ajudar os usuários a cultivar suas finanças, acompanhar despesas e receitas, definir orçamentos, alcançar metas financeiras e obter insights inteligentes.

![Flortune Mockup](https://placehold.co/800x450.png?text=Flortune+App+Interface)
*Interface do Flortune (imagem ilustrativa)*

## ✨ Funcionalidades Principais

*   👤 **Autenticação de Usuários:**
    *   Cadastro e Login com Email/Senha (Pessoa Física e Jurídica com campos condicionais e máscaras).
    *   Login Social com Google (para Pessoa Física).
    *   Gerenciamento de perfil de usuário (nome, avatar, CPF/CNPJ, RG).
*   💸 **Gerenciamento Financeiro (Supabase):**
    *   Transações (CRUD completo).
    *   Categorias (Leitura de categorias padrão e do usuário, adição de novas).
    *   Orçamentos (CRUD completo, acompanhamento de gastos).
    *   Metas Financeiras (CRUD completo, acompanhamento de progresso).
*   📊 **Análise e Visualização:**
    *   Dashboard principal com resumos e destaques.
    *   Página de Análise com gráficos de gastos, receitas e fluxo de caixa (usando dados reais do Supabase).
    *   Calendário financeiro para visualização de eventos e transações.
*   🎨 **Interface do Usuário:**
    *   Modo Privado para ocultar valores sensíveis.
    *   Modo Escuro.
    *   Design responsivo e moderno com ShadCN UI e Tailwind CSS.
*   🤖 **Funcionalidades de IA (com Genkit - em desenvolvimento):**
    *   Sugestões financeiras inteligentes.
    *   Auto-categorização de transações.
*   🤝 **Compartilhamento (Futuro):**
    *   Compartilhamento de módulos financeiros com outros usuários (visualizar/editar).

## 🛠️ Stack Tecnológica

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **UI:** [React](https://reactjs.org/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
*   **Backend & Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
*   **AI:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
*   **Deployment:** [Netlify](https://www.netlify.com/)

## 🚀 Começando (Getting Started)

Siga estas instruções para configurar e executar o projeto localmente.

### Pré-requisitos
*   Node.js (versão LTS recomendada)
*   npm ou yarn
*   Uma conta [Supabase](https://supabase.com/)
*   Uma conta [Google Cloud](https://cloud.google.com/) (para configurar o Login com Google)
*   Uma conta [Netlify](https://www.netlify.com/) (para deploy, opcional para desenvolvimento local)

### 1. Clonar o Repositório
```bash
git clone <url-do-seu-repositorio>
cd flortune
```

### 2. Instalar Dependências
```bash
npm install
# ou
yarn install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto, copiando o conteúdo de `.env.example` (se existir) ou usando o modelo abaixo. Substitua os placeholders com suas credenciais reais.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<SEU_PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUA_SUPABASE_ANON_KEY>

# URL Base da Aplicação (para desenvolvimento local)
NEXT_PUBLIC_BASE_URL=http://localhost:9003 # Ajuste a porta se necessário

# Opcional: Para Genkit (se usar IA do Google)
# GOOGLE_API_KEY=<SUA_GOOGLE_AI_STUDIO_KEY>
```
Você pode encontrar suas credenciais do Supabase em *Project Settings* > *API* no seu painel Supabase.

### 4. Configurar o Banco de Dados Supabase
Execute o script SQL fornecido em `docs/database_schema.sql` no Editor SQL do seu painel Supabase:
1.  Acesse seu projeto no Supabase.
2.  Vá para **SQL Editor**.
3.  Clique em **+ New query**.
4.  Copie e cole o conteúdo completo de `docs/database_schema.sql` na área de texto.
5.  Clique em **RUN**.
Isso criará as tabelas: `profiles`, `categories`, `transactions`, `budgets`, e `financial_goals`, além de políticas RLS e categorias padrão.

### 5. Configurar Autenticação Supabase
1.  **Configurações de URL de Autenticação:**
    *   No painel do Supabase, vá para **Authentication** > **URL Configuration** (ou **Settings** em algumas versões da UI).
    *   Configure o **Site URL** para: `http://localhost:9003` (para desenvolvimento local).
    *   Em **Additional Redirect URLs**, adicione: `http://localhost:9003/auth/callback`.
2.  **Provedor Google (OAuth):**
    *   No painel do Supabase, vá para **Authentication** > **Providers**.
    *   Habilite o provedor **Google**. Você precisará de um **Client ID** e **Client Secret** do Google Cloud Console.
    *   Ao configurar o cliente OAuth 2.0 no Google Cloud Console:
        *   **Origens JavaScript autorizadas:** Adicione `http://localhost:9003`.
        *   **URIs de redirecionamento autorizados:** Adicione `https://<SEU_PROJECT_REF>.supabase.co/auth/v1/callback` (substitua `<SEU_PROJECT_REF>` pelo ID do seu projeto Supabase).
    *   Insira o Client ID e Client Secret obtidos do Google Cloud Console nas configurações do provedor Google no Supabase.

### 6. Executar o Aplicativo em Desenvolvimento
```bash
npm run dev
```
Isso iniciará o servidor de desenvolvimento do Next.js, geralmente em `http://localhost:9003` (ou a porta configurada no `package.json`).

O Genkit (para funcionalidades de IA) pode ser iniciado separadamente, se necessário:
```bash
npm run genkit:dev
```

### 7. Build para Produção
```bash
npm run build
```

### 8. Deploy com Netlify
O projeto está configurado para deploy no Netlify através do arquivo `netlify.toml`.
1.  Conecte seu repositório Git ao Netlify.
2.  Configure as seguintes variáveis de ambiente no Netlify (Site settings > Build & deploy > Environment variables):
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `NEXT_PUBLIC_BASE_URL` (com a URL do seu site Netlify, ex: `https://seu-flortune.netlify.app`)
    *   Opcionalmente, a extensão Supabase do Netlify pode ajudar a configurar as variáveis relacionadas ao Supabase.
3.  Para o Login com Google funcionar em produção:
    *   **Supabase Auth Settings:** Mude o **Site URL** para a URL do seu site Netlify (ex: `https://seu-flortune.netlify.app`) e adicione `https://seu-flortune.netlify.app/auth/callback` às **Additional Redirect URLs**.
    *   **Google Cloud Console:** Adicione `https://seu-flortune.netlify.app` às "Authorized JavaScript origins" do seu cliente OAuth. O "Authorized redirect URI" (`https://<SEU_PROJECT_REF>.supabase.co/auth/v1/callback`) permanece o mesmo.

## 📂 Estrutura do Projeto (Principais Diretórios)

*   `src/app/`: Rotas e páginas do aplicativo (Next.js App Router).
    *   `src/app/(app)/`: Rotas protegidas que exigem autenticação (Dashboard, Transações, etc.).
    *   `src/app/login/`, `src/app/signup/`: Páginas públicas de autenticação.
    *   `src/app/auth/callback/`: Rota de callback para OAuth.
*   `src/components/`: Componentes React reutilizáveis.
    *   `src/components/auth/`: Componentes para formulários de login/cadastro.
    *   `src/components/layout/`: Componentes de layout global (Header, Sidebar).
    *   `src/components/shared/`: Componentes utilitários gerais.
    *   `src/components/ui/`: Componentes da biblioteca ShadCN UI.
*   `src/contexts/`: Provedores de Contexto React (ex: `AuthContext`, `AppSettingsContext`).
*   `src/lib/`: Funções utilitárias, constantes, cliente Supabase.
*   `src/services/`: Funções para interagir com o backend Supabase (operações CRUD).
*   `src/hooks/`: Hooks React personalizados.
*   `src/ai/`: Configuração e fluxos do Genkit (para funcionalidades de IA).
*   `public/`: Arquivos estáticos (imagens, ícones).
*   `docs/`: Documentação adicional e scripts SQL (como `database_schema.sql`).

## 🗺️ Roadmap (Futuras Funcionalidades)

*   [ ] Implementação completa de CRUD para Orçamentos e Metas com Supabase.
*   [ ] Gráficos interativos na página de Análise usando dados reais.
*   [ ] Integração de sugestões financeiras inteligentes (IA com Genkit).
*   [ ] Funcionalidade de "rollover" para orçamentos.
*   [ ] Compartilhamento de módulos financeiros com outros usuários (permissões view/edit).
*   [ ] Notificações personalizadas (contas a vencer, metas atingidas).
*   [ ] Testes unitários e de integração.

## 🤝 Como Contribuir

Contribuições são bem-vindas! Se você tem interesse em melhorar o Flortune, por favor, siga estes passos:
1.  Faça um Fork do projeto.
2.  Crie uma nova Branch (`git checkout -b feature/sua-feature`).
3.  Faça commit das suas alterações (`git commit -m 'Adiciona sua-feature'`).
4.  Faça Push para a Branch (`git push origin feature/sua-feature`).
5.  Abra um Pull Request.

Por favor, mantenha um estilo de código consistente e adicione testes para novas funcionalidades, se aplicável.

## 📜 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo `LICENSE` (você pode criar um se não existir) para mais detalhes.

---

Cultive suas finanças com Flortune! 🌿💰

    