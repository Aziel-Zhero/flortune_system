
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { supabase } from '@/lib/supabase/client'; // Usa o cliente Supabase padrão (anon key) para consulta inicial
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// --- Environment Variable Reading ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL; // Consider both

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// --- Enhanced Logging at Module Load Time ---
console.log("============================================================");
console.log("[NextAuth Config - Module Load] Initializing NextAuth configuration...");
console.log("[NextAuth Config - Module Load] Reading Environment Variables:");
console.log(`[NextAuth Config - Module Load] NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? `Present (Value: ${supabaseUrl})` : "MISSING or EMPTY"}`);
console.log(`[NextAuth Config - Module Load] SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? "Present (Key starts with " + supabaseServiceRoleKey.substring(0,5) + "...)" : "MISSING or EMPTY (CRITICAL FOR ADAPTER)"}`);
console.log(`[NextAuth Config - Module Load] SUPABASE_JWT_SECRET: ${supabaseJwtSecret ? "Present (Status)" : "MISSING or EMPTY (Needed for supabaseAccessToken in session)"}`);
console.log(`[NextAuth Config - Module Load] AUTH_SECRET: ${nextAuthSecret ? "Present (Status)" : "MISSING or EMPTY (CRITICAL FOR NEXTAUTH)"}`);
console.log(`[NextAuth Config - Module Load] AUTH_URL/NEXTAUTH_URL: ${authUrl ? `Present (Value: ${authUrl})` : "MISSING or EMPTY (Important for redirects)"}`);
console.log(`[NextAuth Config - Module Load] GOOGLE_CLIENT_ID: ${googleClientId ? `Present (Value: ${googleClientId})` : "MISSING or EMPTY (For Google Provider)"}`);
console.log(`[NextAuth Config - Module Load] GOOGLE_CLIENT_SECRET: ${googleClientSecret ? "Present (Status)" : "MISSING or EMPTY (For Google Provider)"}`);
console.log("============================================================");

// --- Critical Environment Variable Checks ---
if (!supabaseUrl) {
  console.error("CRITICAL ERROR: Missing environment variable NEXT_PUBLIC_SUPABASE_URL.");
  throw new Error("CRITICAL: Missing environment variable NEXT_PUBLIC_SUPABASE_URL for SupabaseAdapter.");
}
if (!supabaseServiceRoleKey) {
  console.error("CRITICAL ERROR: Missing environment variable SUPABASE_SERVICE_ROLE_KEY.");
  throw new Error("CRITICAL: Missing environment variable SUPABASE_SERVICE_ROLE_KEY for SupabaseAdapter.");
}
if (!nextAuthSecret) {
  console.error("CRITICAL ERROR: Missing environment variable AUTH_SECRET.");
  // Em produção, isso deve quebrar. Em desenvolvimento, NextAuth pode usar um default inseguro.
  throw new Error("CRITICAL: Missing environment variable AUTH_SECRET. NextAuth.js will not work securely.");
}
if (!authUrl) {
  console.warn("WARNING: AUTH_URL (or NEXTAUTH_URL) is not set. This might lead to issues with redirects or endpoint discovery.");
}


// --- Provider Configuration ---
const providers: NextAuthConfig['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      console.log("[NextAuth Authorize Attempt] For Email (Credentials):", credentials?.email);
      if (!credentials?.email || !credentials?.password) {
        console.error("[NextAuth Authorize Failed] Missing email or password in credentials.");
        return null; // Retorna null para indicar falha na autenticação
      }
      const email = credentials.email as string;
      const password = credentials.password as string;

      try {
        // Importante: Usar o cliente Supabase com anon key para esta consulta inicial em `public.profiles`
        // A RLS na tabela `profiles` deve permitir que 'anon' leia pelo menos o email e hashed_password
        // para esta verificação. (A política "Allow anon to select email from profiles for signup check" deve cobrir isso)
        // ou, melhor ainda, criar uma função SECURITY DEFINER para verificar credenciais.
        // Por agora, vamos garantir que a RLS permite a leitura anônima para a coluna email e hashed_password.
        // OU, se 'service_role' for usado implicitamente pelo Supabase Client aqui (raro sem configuração explícita),
        // e não tivermos RLS na `profiles` para `service_role`, então ele passaria.
        // O mais seguro é garantir que `public.profiles` permita SELECT de email e hashed_password para `anon`.
        // Contudo, a política que temos é `USING (true)` para anon, o que permite ler tudo.
        // Para `public.profiles`, a SELECT para `anon` só deve ser em `email` para `signupUser` e aqui, em `email` e `hashed_password`.

        // Vamos verificar a RLS para `public.profiles` para `anon`:
        // A política atual "Allow anon to select email from profiles for signup check" com `USING (true)` é muito permissiva.
        // Idealmente, seria `USING (auth.role() = 'anon') SELECT email, hashed_password`.
        // No momento, como está `USING (true)`, deve funcionar.

        const { data: profile, error: dbError } = await supabase // cliente anon global
          .from('profiles')
          .select('*') // Seleciona tudo para ter id, display_name, etc.
          .eq('email', email)
          .single();

        if (dbError) {
          console.error('[NextAuth Authorize Failed] Supabase DB error fetching profile from public.profiles:', dbError.message);
          return null;
        }
        if (!profile) {
          console.log(`[NextAuth Authorize Failed] No profile found in public.profiles for email: ${email}.`);
          return null;
        }
        if (!profile.hashed_password) {
          console.error(`[NextAuth Authorize Failed] User profile (ID: ${profile.id}, Email: ${profile.email}) from public.profiles does not have a hashed_password. Cannot use credentials.`);
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

        if (passwordsMatch) {
          console.log(`[NextAuth Authorize Success] Password match for profile ID: ${profile.id} from public.profiles.`);
          // O objeto retornado aqui é usado pelo SupabaseAdapter para criar/vincular o usuário em `next_auth.users`
          // e também é passado para o callback `jwt`.
          // Ele DEVE conter `id` (que será o `profile.id`), `email`. `name` e `image` são opcionais mas bons de ter.
          return {
            id: profile.id, // Importante: este ID deve ser o da tabela `profiles`
            email: profile.email,
            name: profile.display_name || profile.full_name, // Nome para NextAuth
            image: profile.avatar_url, // Imagem para NextAuth
          };
        } else {
          console.log(`[NextAuth Authorize Failed] Password mismatch for profile ID: ${profile.id} from public.profiles.`);
          return null;
        }
      } catch (e: any) {
        console.error('[NextAuth Authorize Exception]:', e.message, e.stack);
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
  console.log("[NextAuth Config] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are PRESENT. Adding GoogleProvider to NextAuth providers list.");
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      // profile(profile) { // Opcional: Mapear perfil do Google para o objeto User do NextAuth
      //   return {
      //     id: profile.sub, // `sub` é o ID do usuário do Google
      //     name: profile.name,
      //     email: profile.email,
      //     image: profile.picture,
      //     // Não adicione o `profile` aninhado aqui. Isso é feito no callback `session`.
      //   };
      // }
    })
  );
} else {
  console.warn("[NextAuth Config] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET (or both) are MISSING. GoogleProvider will NOT be configured. Login with Google will likely fail if attempted.");
}

// --- Main NextAuth Configuration ---
export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: supabaseUrl!,
    secret: supabaseServiceRoleKey!,
  }),
  providers: providers,
  session: {
    strategy: 'jwt', // Recomendado com SupabaseAdapter
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile }) {
      // `user` só está presente no primeiro login/signup.
      // `account` (com provider, access_token do OAuth) também só no primeiro login/signup.
      // `oauthProfile` (perfil do provedor OAuth) também só no primeiro login/signup.

      // console.log("[NextAuth JWT Callback] Invoked.");
      // console.log("[NextAuth JWT Callback] Token IN:", JSON.stringify(token, null, 2));
      // console.log("[NextAuth JWT Callback] User IN (from authorize or OAuth):", JSON.stringify(user, null, 2));
      // console.log("[NextAuth JWT Callback] Account IN (from OAuth):", JSON.stringify(account, null, 2));
      // console.log("[NextAuth JWT Callback] OAuthProfile IN (from OAuth):", JSON.stringify(oauthProfile, null, 2));

      if (user?.id) {
        // No primeiro login (Credentials ou OAuth), o `user.id` estará aqui.
        // Para Credentials, `user.id` é o `profile.id` que retornamos do `authorize`.
        // Para OAuth (Google), `user.id` é o `profile.sub` do Google, que o SupabaseAdapter usará para criar a entrada em `next_auth.users`.
        // O trigger `handle_new_user_from_next_auth` usará este `id` (NEW.id em `next_auth.users`) para criar o perfil em `public.profiles`.
        token.sub = user.id; // Garante que o `sub` do token JWT seja o ID correto.
      }
      // console.log("[NextAuth JWT Callback] Token OUT:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      // `token` aqui é o que foi retornado do callback `jwt`.
      // `token.sub` DEVE ser o ID do usuário (seja do `profiles.id` ou do `google.sub` que virou `next_auth.users.id`).
      // console.log("[NextAuth Session Callback] Invoked.");
      // console.log("[NextAuth Session Callback] Session IN:", JSON.stringify(session, null, 2));
      // console.log("[NextAuth Session Callback] Token IN (from JWT callback):", JSON.stringify(token, null, 2));

      if (token.sub && session.user) {
        session.user.id = token.sub; // ID do usuário (de next_auth.users.id)

        // Busca o perfil completo de `public.profiles` usando o ID do usuário.
        // O cliente Supabase aqui usará a `service_role_key` implicitamente se o adapter a configurou,
        // ou podemos precisar usar `createSupabaseClientWithToken` se `supabaseJwtSecret` estiver configurado.
        // Para simplicidade e robustez, usar o `supabase` (anon global) para ler de `public.profiles`
        // requer RLS que permita ao usuário autenticado (`next_auth.uid()`) ler seu próprio perfil.
        // A política "Allow authenticated users to read their own profile" deve cuidar disso.

        const { data: userProfileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', token.sub) // token.sub é o user_id de next_auth.users
          .single();

        if (profileError) {
          console.error(`[NextAuth Session Callback] Error fetching user profile (ID: ${token.sub}) from public.profiles:`, profileError.message);
          session.user.profile = null;
        } else if (userProfileData) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...profileForSession } = userProfileData;
          session.user.profile = profileForSession as Omit<AppProfile, 'hashed_password'>;
          // Atualiza os campos padrão de session.user com dados do perfil, se mais precisos
          session.user.name = userProfileData.display_name || userProfileData.full_name || session.user.name;
          session.user.email = userProfileData.email || session.user.email; // email já deve estar correto no token
          session.user.image = userProfileData.avatar_url || session.user.image;
        } else {
           console.warn(`[NextAuth Session Callback] No profile found in public.profiles for user ID: ${token.sub}. O trigger 'handle_new_user_from_next_auth' pode não ter sido executado ou falhou.`);
           session.user.profile = null;
        }
      }

      // Gerar supabaseAccessToken se SUPABASE_JWT_SECRET estiver definido
      if (supabaseJwtSecret && token.sub && token.email) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub, // ID do usuário de next_auth.users
          email: token.email,
          role: "authenticated",
          // Adicionar app_metadata ou user_metadata se necessário para RLS
          // app_metadata: { provider: account?.provider } // Exemplo
        };
        try {
            session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
            // console.log("[NextAuth Session Callback] supabaseAccessToken gerado.");
        } catch (e: any) {
            console.error("[NextAuth Session Callback] Error signing Supabase JWT:", e.message);
        }
      } else if (!supabaseJwtSecret) {
        // console.warn("[NextAuth Session Callback] SUPABASE_JWT_SECRET is not set. supabaseAccessToken will not be generated.");
      }
      // console.log("[NextAuth Session Callback] Session OUT:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  pages: {
    signIn: '/login', // Página de login customizada
    error: '/login',  // Página para exibir erros de autenticação (pode ser a de login com uma query de erro)
    // signOut: '/login?logout=success', // Opcional: para onde redirecionar após logout
    // verifyRequest: '/auth/verify-request', // Para Magic Links (Email provider)
    // newUser: null // Se definido como null, não redireciona novos usuários OAuth para uma página de setup
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development', // Ativa logs detalhados do NextAuth em desenvolvimento
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
