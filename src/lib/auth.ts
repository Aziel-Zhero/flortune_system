// src/lib/auth.ts
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Profile } from '@/types/database.types';

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Esta autorização é APENAS para usuários normais, não para admins.
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!supabaseAdmin) return null;

        // O login via `signIn` com `CredentialsProvider` usa a API do Supabase Auth
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          console.error("Credentials Authorize Error:", error?.message);
          return null;
        }

        // Se o login no Supabase Auth for bem-sucedido, buscamos o perfil
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
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;

        // Se for um admin logando via a Server Action, o perfil já virá formatado
        if ((user as any).profile?.role === 'admin') {
           token.profile = (user as any).profile;
           return token;
        }

        // Lógica para usuários normais (Google ou Credentials)
        if ((user as any).profile) {
          token.profile = (user as any).profile;
        } else if (account?.provider === 'google' && user.email) {
            if (supabaseAdmin) {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.profile) {
        session.user.profile = token.profile as Omit<Profile, 'hashed_password'>;
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }
      
      const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
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
