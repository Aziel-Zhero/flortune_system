
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { supabase } from '@/lib/supabase/client';
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

// --- Critical Environment Variable Checks ---
if (!supabaseUrl || supabaseUrl.includes('<SEU_PROJECT_REF>')) {
  throw new Error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not set or is a placeholder.");
}
if (!supabaseServiceRoleKey) {
  throw new Error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set.");
}
if (!nextAuthSecret) {
  throw new Error("CRITICAL: AUTH_SECRET is not set.");
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
      if (!credentials?.email || !credentials?.password) {
        return null;
      }
      const email = credentials.email as string;
      const password = credentials.password as string;

      try {
        // Agora o 'authorize' procura em `public.profiles`
        const { data: profile, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (dbError || !profile) {
          console.error('[NextAuth Authorize Failed] Profile not found or DB error:', dbError?.message);
          return null;
        }
        
        // Compara a senha fornecida com a senha hasheada no nosso banco
        const passwordsMatch = await bcrypt.compare(password, profile.hashed_password || "");

        if (passwordsMatch) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...userProfile } = profile;
          // Retorna os dados para o NextAuth, que serão usados no callback jwt
          return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.display_name || userProfile.full_name,
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

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true, 
    })
  );
} else {
  console.warn("⚠️ GoogleProvider is not configured. Login with Google will fail.");
}

// --- Main NextAuth Configuration ---
export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: supabaseUrl!, 
    secret: supabaseServiceRoleKey!, 
  }),
  providers: providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Ao fazer login (com credenciais ou OAuth), o objeto `user` está disponível
      if (user) {
        token.sub = user.id;

        // Se for login com credenciais, o objeto 'profile' que passamos do `authorize` estará aqui
        if (user.profile) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...safeProfile } = user.profile;
          token.profile = safeProfile;
        } 
        // Se for login OAuth, buscamos o perfil no banco de dados na primeira vez
        else if (account?.provider !== 'credentials') {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
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
      
      // Anexa o perfil do token JWT à sessão, evitando buscas desnecessárias no banco
      if (token.profile) {
        session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>;
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }

      // Cria o token de acesso do Supabase
      if (supabaseJwtSecret && token.sub && token.email) {
        const payload = {
          aud: "authenticated",
          exp: Math.floor(new Date(session.expires).getTime() / 1000), 
          sub: token.sub,
          email: token.email,
          role: "authenticated", 
        };
        try {
          session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
        } catch (e: any) {
          console.error("[NextAuth Session Callback] Error signing Supabase JWT:", e.message);
        }
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
