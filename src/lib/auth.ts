// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import { createClient } from '@supabase/supabase-js'; 
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// --- Environment Variable Reading ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseJwtSecret || !nextAuthSecret) {
  console.error("⚠️ FATAL: Missing crucial Supabase or NextAuth environment variables.");
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password || !supabaseUrl || !supabaseServiceRoleKey) {
        return null;
      }
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('email', credentials.email).single();
      if (!profile || !profile.hashed_password) return null;
      const passwordsMatch = await bcrypt.compare(credentials.password, profile.hashed_password);
      if (passwordsMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashed_password, ...userProfile } = profile;
        return { id: userProfile.id, email: userProfile.email, name: userProfile.display_name, image: userProfile.avatar_url, profile: userProfile };
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
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error("Supabase credentials missing for JWT callback");
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { data: dbProfile } = await supabaseAdmin.from('profiles').select('*').eq('email', user.email).single();

        if (dbProfile) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...safeProfile } = dbProfile;
          token.profile = safeProfile;
          token.sub = safeProfile.id; // Ensure subject is the UUID from our profiles table
        } else if (account.provider === 'google' && user.email) {
          const { data: newProfile, error } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: user.id, // Use the ID from the provider for the first time
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

          if (error) {
            console.error("Error creating profile for Google user:", error);
          } else if (newProfile) {
            token.profile = newProfile;
            token.sub = newProfile.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.profile) session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>;

      if (session.user.profile) {
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }
      
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
          console.error("Error signing Supabase JWT:", e.message);
        }
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
          if (!supabaseUrl || !supabaseServiceRoleKey) {
            console.error("Supabase config missing for Google sign-in check");
            return false;
          }
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
          const { data: dbProfile, error } = await supabaseAdmin.from('profiles').select('id').eq('email', user.email).single();

          if (error && error.code !== 'PGRST116') { // 'PGRST116' is "No rows found"
              console.error("Error checking profile on Google sign-in:", error);
              return false;
          }
          if (!dbProfile) {
              const { error: creationError } = await supabaseAdmin.from('profiles').insert({
                  id: user.id,
                  email: user.email,
                  display_name: user.name,
                  full_name: user.name,
                  avatar_url: user.image,
                  account_type: 'pessoa',
                  plan_id: 'tier-cultivador',
                  has_seen_welcome_message: false
              });
              if(creationError) {
                  console.error("Error auto-creating profile for Google user:", creationError);
                  return false;
              }
          }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: nextAuthSecret,
};