// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { createClient } from '@supabase/supabase-js'; 
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

export const runtime = 'nodejs';

// --- Validação rigorosa das Environment Variables ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Validação crítica
if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL é obrigatório');
if (!supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY é obrigatório');
if (!nextAuthSecret) throw new Error('AUTH_SECRET é obrigatório');
if (!supabaseJwtSecret) throw new Error('SUPABASE_JWT_SECRET é obrigatório');

console.log('🔐 Configuração Auth - URL:', supabaseUrl ? '✅' : '❌');
console.log('🔐 Service Role Key:', supabaseServiceRoleKey ? '✅' : '❌');
console.log('🔐 Auth Secret:', nextAuthSecret ? '✅' : '❌');

// --- Cliente Supabase Admin ---
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// --- Provider Configuration ---
const providers: NextAuthConfig['providers'] = [
  CredentialsProvider({
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      try {
        console.log('🔐 Tentativa de login com:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Email ou senha não fornecidos');
          return null;
        }

        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', credentials.email.toLowerCase().trim())
          .single();

        if (error || !profile) {
          console.error('❌ Erro ao buscar usuário ou usuário não encontrado:', error);
          return null;
        }

        if (!profile.hashed_password) {
          console.log('❌ Usuário não tem senha definida (provavelmente login social)');
          return null; // Retorna null se não houver senha, forçando login pelo provedor social.
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password, 
          profile.hashed_password
        );
        
        if (!passwordsMatch) {
          console.log('❌ Senha incorreta para:', credentials.email);
          return null;
        }

        console.log('✅ Login bem-sucedido para:', profile.email);
        
        // Retorna o usuário sem a senha
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashed_password, ...userProfile } = profile;
        return {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.display_name || userProfile.full_name || userProfile.email,
          image: userProfile.avatar_url,
          profile: userProfile,
        };
      } catch (error: any) {
        console.error('❌ Erro inesperado no authorize:', error);
        return null;
      }
    },
  }),
];

// Adicionando Google Provider se disponível
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
  console.log('🔐 Google Provider: ✅');
} else {
  console.log('🔐 Google Provider: ❌ (credenciais não encontradas)');
}

// --- Main NextAuth Configuration ---
export const authConfig: NextAuthConfig = {
  providers,
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.profile) {
        console.log('🔄 Atualizando token JWT com novos dados de perfil.');
        token.profile = session.profile;
        token.name = session.profile.display_name || session.profile.full_name;
        token.picture = session.profile.avatar_url;
      }
      if (user) {
        console.log('🚀 JWT callback - Usuário novo/logado, populando token.');
        token.id = user.id;
        if (user.profile) {
            token.profile = user.profile;
        }
      }
      return token;
    },

    async session({ session, token }) {
        console.log('📦 Session callback - Construindo objeto de sessão.');
      if (token.sub) {
        session.user.id = token.sub;
      }

      if (token.profile) {
        session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>;
        session.user.name = token.profile.display_name || token.profile.full_name || session.user.name;
        session.user.image = token.profile.avatar_url || session.user.image;
        session.user.email = token.profile.email || session.user.email;
      }

      if (token.sub && supabaseJwtSecret) {
        try {
          const payload = {
            aud: "authenticated",
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
            sub: token.sub,
            email: session.user.email,
            role: "authenticated",
          };
          session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
        } catch (error) {
          console.error('❌ Erro ao gerar token Supabase na sessão:', error);
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: nextAuthSecret,
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
