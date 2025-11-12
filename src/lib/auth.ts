// src/lib/auth.ts
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
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
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Use the server-side admin client
        if (!supabaseAdmin) {
          console.error("Supabase admin client not initialized. Check server environment variables.");
          return null;
        }

        const { data: profile, error } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
        
        if (error || !profile || !profile.hashed_password) {
          console.error("Error or profile not found:", error?.message);
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

        if (passwordsMatch) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...userProfile } = profile;
          return {
            id: userProfile.id,
            email: userProfile.email,
            name: userProfile.display_name || userProfile.full_name,
            image: userProfile.avatar_url,
            profile: userProfile, // Pass the full profile object
          };
        }

        return null;
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
        if (user.profile) {
          token.profile = user.profile;
        } else if (account?.provider === 'google' && user.email) {
          if (supabaseAdmin) {
            const { data: dbProfile } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (dbProfile) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { hashed_password, ...safeProfile } = dbProfile;
              token.profile = safeProfile;
            } else {
               const { data: newProfile, error } = await supabaseAdmin
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
      if (supabaseJwtSecret && token.sub && token.email) {
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
