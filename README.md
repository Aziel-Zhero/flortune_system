# Flortune

Flortune é um aplicativo web moderno para gerenciamento financeiro pessoal, projetado para ajudar os usuários a cultivar suas finanças, acompanhar despesas e receitas, definir orçamentos, alcançar metas financeiras e obter insights inteligentes.

**Stack Tecnológica Principal:**
*   **Framework:** Next.js (App Router)
*   **Linguagem:** TypeScript
*   **UI:** React, ShadCN UI, Tailwind CSS
*   **Backend & Banco de Dados:** Supabase (PostgreSQL, Auth, Storage)
*   **AI:** Genkit (para futuras funcionalidades de IA)
*   **Deployment:** Netlify

## Funcionalidades Implementadas (e em Progresso)

*   **Autenticação de Usuários:**
    *   Cadastro e Login com Email/Senha (Pessoa Física e Jurídica com campos condicionais e máscaras).
    *   Login Social com Google (para Pessoa Física).
    *   Gerenciamento de perfil de usuário (nome, avatar, etc. - em progresso).
*   **Gerenciamento Financeiro (Conectando ao Supabase):**
    *   Transações (CRUD - Leitura e Deleção implementadas, Adição/Edição em progresso)
    *   Categorias (Leitura de categorias padrão e do usuário implementada)
    *   Orçamentos (Leitura de mock data, CRUD com Supabase em progresso)
    *   Metas Financeiras (Leitura de mock data, CRUD com Supabase em progresso)
*   **Interface do Usuário:**
    *   Dashboard principal.
    *   Páginas dedicadas para Transações, Orçamentos, Metas, Análise, Calendário.
    *   Modo Privado para ocultar valores sensíveis.
    *   Modo Escuro.
    *   Design responsivo.
*   **Futuras Funcionalidades:**
    *   Análise de dados com gráficos (usando dados reais do Supabase).
    *   Sugestões financeiras inteligentes (IA com Genkit).
    *   Compartilhamento de módulos financeiros com outros usuários (view/edit).

## Configuração do Projeto

### Pré-requisitos
*   Node.js (versão LTS recomendada)
*   npm ou yarn
*   Uma conta Supabase ([https://supabase.com](https://supabase.com))
*   Uma conta Google Cloud (para configurar o Login com Google)
*   Uma conta Netlify ([https://netlify.com](https://netlify.com)) (para deploy)

### 1. Clonar o Repositório
```bash
git clone <url-do-seu-repositorio>
cd flortune # ou o nome do seu repositório
```

### 2. Instalar Dependências
```bash
npm install
# ou
yarn install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto e adicione suas credenciais do Supabase e a URL base para desenvolvimento:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<SEU_PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUA_SUPABASE_ANON_KEY>

# URL Base da Aplicação
NEXT_PUBLIC_BASE_URL=http://localhost:9003

# Opcional: Para Genkit (se usar IA do Google)
# GOOGLE_API_KEY=<SUA_GOOGLE_AI_STUDIO_KEY>
```
Substitua `<SEU_PROJECT_REF>.supabase.co` e `<SUA_SUPABASE_ANON_KEY>` com suas credenciais reais do Supabase. Você pode encontrá-las em *Project Settings* > *API* no seu painel Supabase.

### 4. Configurar o Banco de Dados Supabase

Execute o script SQL fornecido em `docs/database_schema.sql` no Editor SQL do seu painel Supabase.
1.  Acesse seu projeto no Supabase.
2.  Vá para **SQL Editor**.
3.  Clique em **+ New query**.
4.  Copie e cole o conteúdo completo de `docs/database_schema.sql` na área de texto.
5.  Clique em **RUN**.
Isso criará as tabelas: `profiles` (gerenciada pelo Supabase Auth, mas pode ser estendida), `categories`, `transactions`, `budgets`, e `financial_goals`, além de políticas RLS e categorias padrão.

### 5. Configurar Autenticação Supabase

1.  **Site URL:**
    *   No painel do Supabase, vá para **Authentication** > **URL Configuration** (ou **Settings**).
    *   Configure o **Site URL** para: `http://localhost:9003` (para desenvolvimento local).
    *   Em **Additional Redirect URLs**, adicione: `http://localhost:9003/auth/callback`.
2.  **Provedor Google (OAuth):**
    *   No painel do Supabase, vá para **Authentication** > **Providers**.
    *   Habilite o provedor Google. Você precisará de um **Client ID** e **Client Secret** do Google Cloud Console.
    *   Ao configurar o cliente OAuth 2.0 no Google Cloud Console:
        *   **Authorized JavaScript origins:** Adicione `http://localhost:9003`.
        *   **Authorized redirect URIs:** Adicione `https://<SEU_PROJECT_REF>.supabase.co/auth/v1/callback` (substitua `<SEU_PROJECT_REF>` pelo ID do seu projeto Supabase).
    *   Insira o Client ID e Client Secret obtidos do Google Cloud Console nas configurações do provedor Google no Supabase.

### 6. Executar o Aplicativo em Desenvolvimento

```bash
npm run dev
```
Isso iniciará o servidor de desenvolvimento do Next.js, geralmente em `http://localhost:9003`.

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
    *   `NEXT_PUBLIC_SUPABASE_URL` (com a URL do seu projeto Supabase)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (com sua chave anon do Supabase)
    *   `NEXT_PUBLIC_BASE_URL` (com a URL do seu site Netlify, ex: `https://seu-flortune.netlify.app`)
    *   Opcionalmente, a extensão Supabase do Netlify pode ajudar a configurar as variáveis relacionadas ao Supabase.
3.  Para o Login com Google funcionar em produção:
    *   **Supabase Auth Settings:** Mude o **Site URL** para a URL do seu site Netlify (ex: `https://seu-flortune.netlify.app`) e adicione `https://seu-flortune.netlify.app/auth/callback` às **Additional Redirect URLs**.
    *   **Google Cloud Console:** Adicione `https://seu-flortune.netlify.app` às "Authorized JavaScript origins" do seu cliente OAuth. O "Authorized redirect URI" (`https://<SEU_PROJECT_REF>.supabase.co/auth/v1/callback`) permanece o mesmo.

## Estrutura do Projeto (Principais Diretórios)

*   `src/app/`: Contém as rotas e páginas do aplicativo (usando Next.js App Router).
    *   `src/app/(app)/`: Rotas protegidas que exigem autenticação.
    *   `src/app/login/`, `src/app/signup/`: Páginas de autenticação.
*   `src/components/`: Componentes React reutilizáveis.
    *   `src/components/auth/`: Componentes para formulários de login/cadastro.
    *   `src/components/layout/`: Componentes de layout (Header, Sidebar).
    *   `src/components/shared/`: Componentes utilitários gerais.
    *   `src/components/ui/`: Componentes da biblioteca ShadCN UI.
*   `src/contexts/`: Provedores de Contexto React (ex: `AuthContext`, `AppSettingsContext`).
*   `src/lib/`: Funções utilitárias, constantes, cliente Supabase.
*   `src/services/`: Funções para interagir com o backend Supabase (operações CRUD).
*   `src/hooks/`: Hooks React personalizados.
*   `src/ai/`: Configuração e fluxos do Genkit (para funcionalidades de IA).
*   `public/`: Arquivos estáticos.
*   `docs/`: Documentação e scripts SQL (como `database_schema.sql`).

## Contribuindo

[Detalhes sobre como contribuir, padrões de código, etc., podem ser adicionados aqui no futuro.]

---

Cultive suas finanças com Flortune! 🌿💰
