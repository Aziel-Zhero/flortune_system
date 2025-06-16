
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
    *   Cadastro e Login com Email/Senha.
    *   Login Social com Google.
    *   Gerenciamento de perfil de usuário (nome, avatar, etc.).
*   **Gerenciamento Financeiro:**
    *   Transações (CRUD - em progresso)
    *   Categorias (CRUD - em progresso, com categorias padrão)
    *   Orçamentos (CRUD - em progresso)
    *   Metas Financeiras (CRUD - em progresso)
*   **Interface do Usuário:**
    *   Dashboard principal.
    *   Páginas dedicadas para Transações, Orçamentos, Metas, Análise, Calendário.
    *   Modo Privado para ocultar valores sensíveis.
    *   Modo Escuro.
    *   Design responsivo.
*   **Futuras Funcionalidades:**
    *   Análise de dados com gráficos.
    *   Sugestões financeiras inteligentes (IA com Genkit).
    *   Compartilhamento de módulos financeiros com outros usuários (view/edit).

## Configuração do Projeto

### Pré-requisitos
*   Node.js (versão LTS recomendada)
*   npm ou yarn
*   Uma conta Supabase
*   Uma conta Netlify (para deploy)

### 1. Clonar o Repositório
```bash
git clone <url-do-seu-repositorio>
cd <nome-do-repositorio>
```

### 2. Instalar Dependências
```bash
npm install
# ou
yarn install
```

### 3. Configurar Variáveis de Ambiente Supabase

Crie um arquivo `.env` na raiz do projeto e adicione suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Para autenticação OAuth (Google), o callback é geralmente manipulado pelo Supabase,
# mas a URL base é usada para construir URLs de redirecionamento.
NEXT_PUBLIC_BASE_URL=http://localhost:9003
```
Substitua `your-project-id.supabase.co` e `your-supabase-anon-key` com suas credenciais reais do Supabase. Você pode encontrá-las em *Project Settings* > *API* no seu painel Supabase.

### 4. Configurar o Banco de Dados Supabase

Execute os scripts SQL fornecidos no diretório `docs/` (ou conforme as instruções da equipe de desenvolvimento) no Editor SQL do seu painel Supabase para criar as tabelas necessárias:
*   `profiles` (para autenticação e dados do usuário)
*   `categories`, `transactions`, `budgets`, `financial_goals` (para os módulos principais do app)

Certifique-se também de configurar os provedores de autenticação desejados (ex: Google) no painel do Supabase (Authentication > Providers).

### 5. Executar o Aplicativo em Desenvolvimento

```bash
npm run dev
```
Isso iniciará o servidor de desenvolvimento do Next.js, geralmente em `http://localhost:9003`.

O Genkit (para funcionalidades de IA) pode ser iniciado separadamente, se necessário:
```bash
npm run genkit:dev
```

### 6. Build para Produção
```bash
npm run build
```

### 7. Deploy com Netlify

O projeto está configurado para deploy no Netlify.
1.  Conecte seu repositório Git ao Netlify.
2.  Configure as variáveis de ambiente no Netlify (semelhantes ao arquivo `.env`):
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `NEXT_PUBLIC_BASE_URL` (com a URL do seu site Netlify, ex: `https://seu-site.netlify.app`)
    *   Opcionalmente, a extensão Supabase do Netlify pode ajudar a configurar as variáveis relacionadas ao Supabase.
3.  As configurações de build (`npm run build`) e o diretório de publicação (`.next`) são definidos no arquivo `netlify.toml`.

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
*   `docs/`: Documentação e scripts SQL.

## Contribuindo

[Detalhes sobre como contribuir, padrões de código, etc., podem ser adicionados aqui no futuro.]

---

Cultive suas finanças com Flortune! 🌿💰
