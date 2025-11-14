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
      console.error("Auth.ts: Invalid credentials or Supabase client missing.");
      return null;
    }
    
    const email = credentials.email as string;
    const password = credentials.password as string;

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !userProfile) {
      console.error("Auth.ts: User not found or profile error:", profileError?.message);
      return null;
    }

    if (!userProfile.hashed_password) {
      console.error("Auth.ts: User exists but has no password (likely OAuth user).");
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, userProfile.hashed_password);

    if (passwordMatches) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashed_password, ...safeProfile } = userProfile;
        return {
            id: safeProfile.id,
            email: safeProfile.email,
            name: safeProfile.display_name || safeProfile.full_name,
            image: safeProfile.avatar_url,
            profile: safeProfile, 
        };
    }
    
    console.error("Auth.ts: Password mismatch for user:", email);
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
      if (user && (user as any).profile) {
        token.sub = user.id;
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
