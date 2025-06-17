
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { supabase } from '@/lib/supabase/client'; // Supabase client com anon key para buscar profile
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// Checagens de variáveis de ambiente essenciais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;

console.log("============================================================");
console.log("[NextAuth Config] Initializing NextAuth...");
console.log("[NextAuth Config] Attempting to read environment variables for Adapter:");
console.log("[NextAuth Config] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? `Present (Value: ${supabaseUrl})` : "MISSING or EMPTY");
console.log("[NextAuth Config] SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "Present (Key starts with " + supabaseServiceRoleKey.substring(0,10) + "...)" : "MISSING or EMPTY");
console.log("[NextAuth Config] SUPABASE_JWT_SECRET:", supabaseJwtSecret ? "Present" : "MISSING or EMPTY for supabaseAccessToken generation");
console.log("[NextAuth Config] AUTH_SECRET:", nextAuthSecret ? "Present" : "MISSING or EMPTY (CRITICAL for production)");
console.log("============================================================");

if (!supabaseUrl) {
  throw new Error("CRITICAL: Missing environment variable NEXT_PUBLIC_SUPABASE_URL for SupabaseAdapter.");
}
if (!supabaseServiceRoleKey) {
  throw new Error("CRITICAL: Missing environment variable SUPABASE_SERVICE_ROLE_KEY for SupabaseAdapter.");
}
if (!nextAuthSecret) {
  console.warn("WARNING: Missing environment variable AUTH_SECRET. NextAuth.js will not work securely in production if this is a production environment.");
  // Potentially throw new Error("CRITICAL: Missing environment variable AUTH_SECRET.") if strictness is required even for dev
}


export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("[NextAuth Authorize Attempt] For Email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.error("[NextAuth Authorize Failed] Missing email or password in credentials.");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log(`[NextAuth Authorize] Fetching profile from public.profiles for email: ${email} using global Supabase client (anon key).`);
          // Usar o cliente supabase (com anon key) para buscar o perfil, RLS deve permitir.
          const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('*') // Seleciona todos os campos, incluindo hashed_password
            .eq('email', email)
            .single();

          if (dbError) {
            console.error('[NextAuth Authorize Failed] Supabase DB error fetching profile:', dbError.message, dbError.details, dbError.hint);
            return null; // Erro na busca
          }
          if (!profile) {
            console.log(`[NextAuth Authorize Failed] No profile found for email: ${email}.`);
            return null; // Usuário não encontrado
          }

          console.log(`[NextAuth Authorize] Profile found for ID: ${profile.id}. Checking password.`);
          if (!profile.hashed_password) {
            console.error(`[NextAuth Authorize Failed] User profile (ID: ${profile.id}, Email: ${profile.email}) does not have a hashed_password.`);
            return null; // Perfil não tem senha hasheada
          }
          
          const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

          if (passwordsMatch) {
            console.log(`[NextAuth Authorize Success] Password match for profile ID: ${profile.id}.`);
            // Retornar o objeto User que o SupabaseAdapter espera para popular `next_auth.users`
            // O adapter usará id, name, email, image.
            // O `id` aqui DEVE ser o `id` de `public.profiles`.
            return {
              id: profile.id, // Importante: Este é o profile.id que será usado como user.id
              email: profile.email,
              name: profile.display_name || profile.full_name, // Adapter usará o nome
              image: profile.avatar_url, // Adapter usará a imagem
            };
          } else {
            console.log(`[NextAuth Authorize Failed] Password mismatch for profile ID: ${profile.id}.`);
            return null; // Senha não confere
          }
        } catch (e: any) {
          console.error('[NextAuth Authorize Exception]:', e.message, e.stack);
          return null; // Erro inesperado
        }
      },
    }),
    // Aqui podem ser adicionados outros providers (Google, GitHub, etc.) no futuro
  ],
  session: {
    strategy: 'jwt', // Requerido pelo SupabaseAdapter para gerar supabaseAccessToken
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile }) { // Renomeado profile para oauthProfile para evitar conflito
      // console.log("[NextAuth JWT Callback] Token In:", JSON.stringify(token, null, 2));
      // console.log("[NextAuth JWT Callback] User In (at first login from authorize/OAuth):", JSON.stringify(user, null, 2));
      // console.log("[NextAuth JWT Callback] Account In (at first login/OAuth):", JSON.stringify(account, null, 2));
      // console.log("[NextAuth JWT Callback] OAuth Profile In:", JSON.stringify(oauthProfile, null, 2));

      // O `user` aqui é o objeto retornado por `authorize` ou pelo provider OAuth.
      // O `id` do `user` já deve ser o ID correto (de public.profiles se Credentials, ou do provider OAuth).
      // O SupabaseAdapter garante que o `user.id` é usado para `token.sub`.
      if (user?.id) {
        token.sub = user.id; // `sub` (subject) é o ID do usuário para o JWT
      }
      // Se necessário, outros dados do `user` podem ser adicionados ao `token` aqui.
      // Mas para o perfil customizado, buscaremos no `session` callback para ter dados frescos.
      // console.log("[NextAuth JWT Callback] Token Out:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) { // O `user` aqui não é o mesmo do authorize, é o `token` decodificado
      // console.log("[NextAuth Session Callback] Session In:", JSON.stringify(session, null, 2));
      // console.log("[NextAuth Session Callback] Token In (from JWT callback):", JSON.stringify(token, null, 2));

      if (token.sub && session.user) {
        session.user.id = token.sub; // Garante que o ID da sessão é o `sub` do token (nosso profile.id)

        // Buscar o perfil customizado da tabela `public.profiles`
        // Usar o cliente supabase (com anon key) para buscar o perfil. RLS deve permitir.
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*') // Seleciona tudo de public.profiles
          .eq('id', token.sub) // O id é o mesmo que o user_id em next_auth.users
          .single();

        if (profileError) {
          console.error("[NextAuth Session Callback] Error fetching user profile from public.profiles:", profileError.message);
          session.user.profile = null;
        } else if (userProfile) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...profileForSession } = userProfile; // Excluir hashed_password
          session.user.profile = profileForSession as Omit<AppProfile, 'hashed_password'>;
          // Atualizar campos padrão da sessão se o perfil tiver informações mais recentes/completas
          session.user.name = userProfile.display_name || userProfile.full_name || session.user.name;
          session.user.email = userProfile.email || session.user.email; // Email deve ser consistente
          session.user.image = userProfile.avatar_url || session.user.image;
        }
      }

      // Gerar supabaseAccessToken conforme documentação do adapter
      // Isso SÓ deve acontecer se SUPABASE_JWT_SECRET estiver configurado.
      if (supabaseJwtSecret && token.sub && token.email) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub, // O ID do usuário (de public.profiles.id)
          email: token.email, // O email do usuário
          role: "authenticated", 
          // Você pode adicionar outros claims aqui se sua RLS depender deles, e.g., app_metadata
        };
        session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
        // console.log("[NextAuth Session Callback] Supabase Access Token Generated.");
      } else if (!supabaseJwtSecret) {
        console.warn("[NextAuth Session Callback] SUPABASE_JWT_SECRET is not set. supabaseAccessToken will not be generated. RLS for custom tables might not work as expected.");
      }
      
      // console.log("[NextAuth Session Callback] Session Out:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  },
  secret: nextAuthSecret, // Essencial para JWT
  // debug: process.env.NODE_ENV === 'development', // Habilita logs do NextAuth.js
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);

