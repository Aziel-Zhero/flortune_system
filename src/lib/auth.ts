// src/lib/auth.ts
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Profile } from '@/types/database.types';
import bcrypt from 'bcryptjs';

// Este é um novo provedor, exclusivo para a Server Action de admin.
// Ele não é chamado diretamente pelo cliente.
const adminCredentialsProvider = CredentialsProvider({
  id: "admin-credentials",
  name: "Admin Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    // Adicionamos um campo 'role' para garantir que apenas admins possam usar este fluxo
    role: { label: "Role", type: "text" }, 
  },
  async authorize(credentials) {
    if (credentials?.role === 'admin') {
      // A validação da senha já foi feita na Server Action.
      // Aqui, apenas buscamos os dados para criar a sessão.
      if (!supabaseAdmin) return null;
      const { data: adminUser } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('email', credentials.email)
        .single();
      
      if (adminUser) {
        return {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.full_name,
          profile: {
            id: adminUser.id,
            email: adminUser.email,
            display_name: adminUser.full_name,
            role: 'admin',
          }
        };
      }
    }
    return null; // Não autoriza se não for um admin
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

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error("Credentials Authorize Error (User):", error?.message);
      return null;
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.display_name || profile.full_name,
      image: profile.avatar_url,
      profile: profile,
    };
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
    adminCredentialsProvider, // Adicionando o provedor de admin
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        if ((user as any).profile) {
          token.profile = (user as any).profile;
        } else if (account?.provider === 'google' && user.email && supabaseAdmin) {
            const { data: dbProfile } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (dbProfile) {
                token.profile = dbProfile;
            } else {
                const { data: newProfile } = await supabaseAdmin
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        display_name: user.name,
                        full_name: user.name,
                        avatar_url: user.image,
                        account_type: 'pessoa',
                        plan_id: 'tier-cultivador',
                        has_seen_welcome_message: false,
                    })
                    .select()
                    .single();
                if(newProfile) token.profile = newProfile;
            }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.profile) {
        session.user.profile = token.profile as Omit<Profile, 'hashed_password'> & { role?: string }; // Adicionando role opcional
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }
      
      const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
      // Gerar token Supabase apenas para usuários normais
      if (supabaseJwtSecret && token.sub && token.email && session.user.profile?.role !== 'admin') {
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
