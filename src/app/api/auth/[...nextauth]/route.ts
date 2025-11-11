// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import { SupabaseAdapter } from "@auth/supabase-adapter"
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import { createClient } from '@supabase/supabase-js'; 
import type { Profile as AppProfile } from '@/types/database.types';

export const runtime = 'nodejs'; // Força o runtime para Node.js

// --- Leitura das Variáveis de Ambiente ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Validação crítica para garantir que as variáveis existam
if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseJwtSecret) {
  throw new Error("Variáveis de ambiente do Supabase não estão configuradas.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// --- Configuração Central do NextAuth ---
export const authConfig: NextAuthConfig = {
  // Usando o SupabaseAdapter para sincronizar usuários, sessões, etc.
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
        if (!credentials?.email || !credentials?.password) {
          console.error("Authorize: Faltando email ou senha.");
          return null;
        }

        // Usar o Supabase Auth para verificar as credenciais
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (error || !data.user) {
            console.error("Authorize: Erro no signInWithPassword do Supabase:", error?.message);
            return null;
        }
        
        // Se o login for bem-sucedido, o Supabase retorna o usuário.
        // O SupabaseAdapter cuidará de encontrar ou criar o usuário no banco de dados.
        // Apenas retornamos os dados essenciais que o NextAuth espera.
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.display_name || data.user.user_metadata?.name,
          image: data.user.user_metadata?.avatar_url,
        };
      },
    }),
    // Adiciona o Google Provider apenas se as chaves estiverem configuradas
    ...(googleClientId && googleClientSecret ? [
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        allowDangerousEmailAccountLinking: true, 
      })
    ] : [])
  ],
  
  session: { strategy: 'jwt' },

  callbacks: {
    // O callback JWT é chamado para criar/atualizar o token
    async jwt({ token, user }) {
      if (user) {
        // No primeiro login, `user` está disponível. Adicionamos o ID ao token.
        token.sub = user.id;
      }
      return token;
    },

    // O callback session é chamado para criar o objeto de sessão do cliente
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        // Busca o perfil completo do banco para adicionar à sessão
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', token.sub)
          .single();

        if (profile) {
          session.user.profile = profile as Omit<AppProfile, 'hashed_password'>;
          session.user.name = profile.display_name || profile.full_name;
          session.user.image = profile.avatar_url;
        }
      }
      
      // Assina o token JWT para o Supabase RLS
      if (supabaseJwtSecret && token.sub && token.email) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000),
          sub: token.sub,
          email: token.email,
          role: "authenticated",
        };
        session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
      }
      
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);