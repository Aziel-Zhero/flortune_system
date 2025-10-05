
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { createClient } from '@supabase/supabase-js'; 
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

export const runtime = 'nodejs'; // Explicitly set runtime to Node.js

// --- Environment Variable Reading ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;


// --- Log Environment Variable Status ---
if (!supabaseUrl || !supabaseUrl.startsWith('http')) console.warn("⚠️ WARNING: NEXT_PUBLIC_SUPABASE_URL is not set or is invalid.");
if (!supabaseServiceRoleKey) console.warn("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not set.");
if (!nextAuthSecret) console.warn("⚠️ WARNING: AUTH_SECRET is not set.");
if (!googleClientId || !googleClientSecret) console.warn("⚠️ WARNING: GoogleProvider credentials are not set.");
if (!nextAuthUrl) console.warn("⚠️ WARNING: NEXTAUTH_URL is not set. This may cause issues in production.");


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
      if (!credentials?.email || !credentials?.password) return null;
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('[NextAuth Authorize] Supabase credentials are not configured or invalid.');
        return null;
      }
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

      try {
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('email', credentials.email).single();

        // If no profile is found, or if the profile doesn't have a hashed password (e.g., created via OAuth),
        // bcrypt.compare will safely fail.
        if (!profile) return null;

        const passwordsMatch = await bcrypt.compare(credentials.password as string, profile.hashed_password || "");
        
        if (passwordsMatch) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...userProfile } = profile;
          return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.display_name,
            image: userProfile.avatar_url,
            profile: userProfile,
          };
        }
      } catch (e: any) {
        console.error('[NextAuth Authorize Exception]:', e.message);
      }
      return null;
    },
  }),
];

// Adicionando o provedor do Google apenas se as credenciais estiverem disponíveis.
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true, 
    })
  );
}

// --- Main NextAuth Configuration ---
export const authConfig: NextAuthConfig = {
  providers,
  // O Adapter é necessário para que o NextAuth crie automaticamente usuários em `next_auth.users`
  // quando eles fizerem login via OAuth (Google). Isso dispara nosso trigger para criar o perfil.
  adapter: (supabaseUrl && supabaseServiceRoleKey) ? SupabaseAdapter({ url: supabaseUrl, secret: supabaseServiceRoleKey }) : undefined,
  session: { strategy: 'jwt' },
  // O TrustHost é importante para ambientes de produção como o Netlify.
  trustHost: true,
  basePath: '/api/auth',
  callbacks: {
    async jwt({ token, user, account }) {
      // O 'user' só está presente no primeiro login.
      if (user) {
        token.sub = user.id; // Garante que o ID do usuário está no token
        
        // Se o objeto `user` já tem o perfil (vindo do `authorize` do CredentialsProvider), use-o.
        if (user.profile) {
            token.profile = user.profile;
        } 
        // Se não (login com Google), busca o perfil no banco.
        else if (supabaseUrl && supabaseServiceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
          const { data: dbProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
          if (dbProfile) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { hashed_password, ...safeProfile } = dbProfile;
            token.profile = safeProfile;
          }
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
        // Atualiza as informações da sessão com os dados do perfil
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }

      // Gera o token de acesso do Supabase
      if (supabaseJwtSecret && token.sub) {
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
  secret: nextAuthSecret,
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
