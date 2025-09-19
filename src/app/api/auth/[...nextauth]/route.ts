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

// --- Helper function for URL validation ---
function isValidSupabaseUrl(url: string | undefined): url is string {
  return !!url && url.startsWith('http') && !url.includes('<');
}

// --- Environment Variable Reading ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// --- Main Auth Configuration ---
const authOptions: NextAuthConfig = {
  providers: [
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
        if (!isValidSupabaseUrl(supabaseUrl) || !supabaseServiceRoleKey) {
            console.error('[NextAuth Authorize] Supabase credentials are not configured or invalid.');
            return null;
        }
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
        try {
          const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('email', credentials.email).single();
          if (!profile) {
            console.error(`[NextAuth Authorize] Profile not found for email: ${credentials.email}`);
            return null;
          }
          const passwordsMatch = await bcrypt.compare(credentials.password as string, profile.hashed_password || "");
          if (passwordsMatch) {
            const { hashed_password, ...userProfile } = profile;
            return { id: userProfile.id, email: userProfile.email, name: userProfile.display_name, image: userProfile.avatar_url, profile: userProfile };
          }
        } catch (e: any) {
          console.error('[NextAuth Authorize Exception]:', e.message);
        }
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        if (user.profile) {
          const { hashed_password, ...safeProfile } = user.profile as any;
          token.profile = safeProfile;
        } else if (account?.provider !== 'credentials' && isValidSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
          const { data: dbProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
          if (dbProfile) {
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
      if (supabaseJwtSecret && token.sub && token.email) {
        const payload = { aud: "authenticated", exp: Math.floor(new Date(session.expires).getTime() / 1000), sub: token.sub, email: token.email, role: "authenticated" };
        try {
          session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
        } catch (e: any) {
          console.error("[NextAuth Session Callback] Error signing Supabase JWT:", e.message);
        }
      }
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  secret: nextAuthSecret,
};

// --- Conditionally add Google Provider and Supabase Adapter ---
if (googleClientId && googleClientSecret) {
  authOptions.providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  console.warn("⚠️ GoogleProvider is not configured. Login with Google will fail.");
}

if (isValidSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey) {
  authOptions.adapter = SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  });
} else {
  console.warn("⚠️ SupabaseAdapter is not configured due to missing/invalid environment variables. Manual login and database persistence for OAuth will fail.");
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authOptions);
