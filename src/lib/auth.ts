// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import { createClient } from '@supabase/supabase-js'; 
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
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError || !authData.user) {
        console.error('Supabase signIn error:', authError?.message);
        return null;
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError || !profile) {
          console.error("Profile not found for user:", authData.user.id, profileError);
          return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ...userProfile } = profile;
      return { 
        id: userProfile.id, 
        email: userProfile.email, 
        name: userProfile.display_name, 
        image: userProfile.avatar_url, 
        profile: userProfile 
      };
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
    async jwt({ token, user, account }) {
        if (account && user) {
            token.accessToken = account.access_token;
            token.sub = user.id;

            const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!);
            const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                token.profile = profile;
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
        session.user.name = (token.profile as AppProfile).display_name || (token.profile as AppProfile).full_name;
        session.user.email = (token.profile as AppProfile).email;
        session.user.image = (token.profile as AppProfile).avatar_url;
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
              const { data: authUser, error: creationError } = await supabaseAdmin.auth.createUser({
                  email: user.email,
                  password: Math.random().toString(36).slice(-12), // Generate random password for OAuth users
                  email_confirm: true, // Auto-confirm email for OAuth users
                  user_metadata: {
                    full_name: user.name,
                    display_name: user.name,
                    avatar_url: user.image,
                    account_type: 'pessoa',
                    plan_id: 'tier-cultivador',
                    has_seen_welcome_message: false
                  }
              });

              if(creationError || !authUser.user) {
                  console.error("Error auto-creating Supabase Auth user for Google:", creationError);
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