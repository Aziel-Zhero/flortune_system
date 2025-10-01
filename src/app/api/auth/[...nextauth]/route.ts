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
    id: 'dev',
    name: 'Development Access',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'dev@flortune.com' }
    },
    async authorize(credentials) {
      if (process.env.NODE_ENV === 'production') {
        return null; // Não permitir em produção
      }
      // Retorna um usuário mockado para desenvolvimento
      const testUser = {
        id: 'dev-user-uuid',
        name: 'Dev User',
        email: credentials.email || 'dev@flortune.com',
        image: 'https://placehold.co/100x100.png?text=DEV',
        profile: {
          id: 'dev-user-uuid',
          full_name: 'Developer User',
          display_name: 'Dev User',
          email: credentials.email || 'dev@flortune.com',
          account_type: 'pessoa',
        } as Omit<AppProfile, 'hashed_password' | 'created_at' | 'updated_at'>,
      };
      return testUser;
    }
  }),
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
        if (!profile || !profile.hashed_password) return null;
        
        const passwordsMatch = await bcrypt.compare(credentials.password as string, profile.hashed_password);
        
        if (passwordsMatch) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...userProfile } = profile;
          return { id: userProfile.id, email: userProfile.email, name: userProfile.display_name, image: userProfile.avatar_url, profile: userProfile };
        }
      } catch (e: any) {
        console.error('[NextAuth Authorize Exception]:', e.message);
      }
      return null;
    },
  }),
];

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
  adapter: (supabaseUrl && supabaseServiceRoleKey) ? SupabaseAdapter({ url: supabaseUrl, secret: supabaseServiceRoleKey }) : undefined,
  session: { strategy: 'jwt' },
  trustHost: true,
  basePath: '/api/auth',
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        
        // Se for o usuário de dev, injeta o perfil mockado
        if (account?.provider === 'dev' && user.profile) {
          token.profile = user.profile;
        } 
        // Para outros provedores, busca o perfil no banco
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
      if (token.sub) session.user.id = token.sub;
      if (token.profile) {
        session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>;
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }
      if (supabaseJwtSecret && token.sub && token.email && token.sub !== 'dev-user-uuid') {
        const payload = { aud: "authenticated", exp: Math.floor(new Date(session.expires).getTime() / 1000), sub: token.sub, email: token.email, role: "authenticated" };
        session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
      }
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  secret: nextAuthSecret,
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
