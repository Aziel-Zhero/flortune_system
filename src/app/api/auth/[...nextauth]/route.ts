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

// --- Validação das Environment Variables ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!supabaseUrl) throw new Error('NEXT_PUBLIC_SUPABASE_URL é obrigatório');
if (!supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY é obrigatório');
if (!nextAuthSecret) throw new Error('AUTH_SECRET é obrigatório');
if (!supabaseJwtSecret) throw new Error('SUPABASE_JWT_SECRET é obrigatório');

console.log('🔐 Configuração Auth - URL:', supabaseUrl);

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

        if (error) {
          console.error('❌ Erro ao buscar usuário:', error);
          return null;
        }

        if (!profile) {
          console.log('❌ Usuário não encontrado:', credentials.email);
          return null;
        }

        if (!profile.hashed_password) {
          console.log('❌ Usuário não tem senha definida (login social?)');
          return null;
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
        console.error('❌ Erro no authorize:', error);
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
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Atualização de sessão
      if (trigger === "update" && session?.profile) {
        token.profile = session.profile;
        token.name = session.profile.display_name || session.profile.full_name;
        token.picture = session.profile.avatar_url;
      }
      
      // Primeiro login
      if (user) {
        token.id = user.id;
        if (user.profile) {
          token.profile = user.profile;
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      if (token.profile) {
        session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>;
        session.user.name = (token.profile as any).display_name || 
                           (token.profile as any).full_name || 
                           session.user.name;
        session.user.image = (token.profile as any).avatar_url || session.user.image;
        session.user.email = (token.profile as any).email || session.user.email;
      }

      // Token do Supabase
      if (token.sub && supabaseJwtSecret) {
        try {
          const payload = {
            aud: "authenticated",
            exp: Math.floor(Date.now() / 1000) + (60 * 60),
            sub: token.sub,
            email: session.user.email,
            role: "authenticated",
          };
          session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
        } catch (error) {
          console.error('❌ Erro ao gerar token Supabase:', error);
        }
      }

      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Permite URLs relativas
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Permite URLs do mesmo domínio
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: nextAuthSecret,
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
