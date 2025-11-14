// src/lib/auth.ts
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Profile } from '@/types/database.types';
import bcrypt from 'bcryptjs';

const credentialsProvider = CredentialsProvider({
  id: "credentials",
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials.password || !supabaseAdmin) {
      return null;
    }
    
    const email = credentials.email as string;
    const password = credentials.password as string;

    // Verifica na tabela 'profiles'
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !userProfile) {
      console.error("User not found or profile error:", profileError?.message);
      return null;
    }

    if (!userProfile.hashed_password) {
      // Usuário provavelmente se cadastrou via OAuth, não tem senha local.
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, userProfile.hashed_password);

    if (passwordMatches) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashed_password, ...safeProfile } = userProfile;
        // Retorna um objeto User compatível com o NextAuth
        // A role será injetada no token JWT no callback
        return {
            id: safeProfile.id,
            email: safeProfile.email,
            name: safeProfile.display_name || safeProfile.full_name,
            image: safeProfile.avatar_url,
            // Passamos o perfil completo para ser usado no callback jwt
            profile: safeProfile, 
        };
    }
    
    return null;
  },
});


export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    credentialsProvider,
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Quando um usuário faz login (objeto `user` está presente)
      if (user && (user as any).profile) {
        token.sub = user.id;
        // Injeta o perfil completo, incluindo a role, no token
        token.profile = (user as any).profile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.profile) {
        session.user.profile = token.profile as Omit<Profile, 'hashed_password'>;
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }
      
      const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
      
      // Gera um token de acesso para o Supabase apenas para usuários normais
      if (supabaseJwtSecret && token.sub && token.email && token.profile?.role !== 'admin') {
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
  secret: process.env.AUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
