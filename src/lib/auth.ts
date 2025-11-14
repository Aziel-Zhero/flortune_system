// src/lib/auth.ts
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Profile } from '@/types/database.types';
import bcrypt from 'bcryptjs';

const adminCredentialsProvider = CredentialsProvider({
  id: "admin-credentials",
  name: "Admin Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    role: { label: "Role", type: "text" }, 
  },
  async authorize(credentials) {
    if (credentials?.role === 'admin' && typeof credentials.email === 'string') {
      if (!supabaseAdmin) return null;
      
      const { data: adminUser } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('email', credentials.email)
        .single();
      
      if (adminUser) {
        // Retorna um objeto simples com a role. O callback JWT cuidará do resto.
        return {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.full_name,
          role: 'admin', // A informação mais importante
        };
      }
    }
    return null;
  }
});


const userCredentialsProvider = CredentialsProvider({
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

    const { data: userData, error: userError } = await supabaseAdmin.from('profiles').select('*').eq('email', email).single();

    if (userError || !userData) {
      return null;
    }

    // Se o usuário não tiver uma senha (ex: veio do Google), não autorize por aqui.
    if (!userData.hashed_password) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, userData.hashed_password);

    if (passwordMatches) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashed_password, ...safeProfile } = userData;
        return {
            id: safeProfile.id,
            email: safeProfile.email,
            name: safeProfile.display_name || safeProfile.full_name,
            image: safeProfile.avatar_url,
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
    userCredentialsProvider,
    adminCredentialsProvider,
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;

        // Injeta a role de admin diretamente no token
        if ((user as any).role === 'admin') {
            token.role = 'admin';
            // Cria um perfil 'fake' para o admin para consistência
            token.profile = {
                id: user.id,
                email: user.email,
                display_name: user.name,
                full_name: user.name,
                role: 'admin'
            } as Profile;
        } 
        // Para usuários normais (OAuth ou credentials)
        else if ((user as any).profile) {
            token.profile = (user as any).profile;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.profile) {
        // A role de admin agora virá do token.profile
        session.user.profile = token.profile as Profile;
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }
      
      const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
      // Garante que admins não recebam um token de acesso do Supabase
      if (supabaseJwtSecret && token.sub && token.email && token.role !== 'admin') {
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