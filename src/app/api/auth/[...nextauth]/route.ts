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

// --- Log Environment Variable Status ---
if (!isValidSupabaseUrl(supabaseUrl)) {
  console.warn("⚠️ WARNING: NEXT_PUBLIC_SUPABASE_URL is not set or is a placeholder. Supabase-related features (including manual login) will fail.");
}
if (!supabaseServiceRoleKey) {
  console.warn("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Supabase-related features (including manual login) will fail.");
}
if (!nextAuthSecret) {
  console.warn("⚠️ WARNING: AUTH_SECRET is not set.");
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
      
      if (!isValidSupabaseUrl(supabaseUrl) || !supabaseServiceRoleKey) {
          console.error('[NextAuth Authorize] Supabase credentials are not configured or invalid.');
          return null;
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

      try {
        const { data: profile, error: dbError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (dbError || !profile) {
          console.error('[NextAuth Authorize Failed] Profile not found or DB error:', dbError?.message);
          return null;
        }
        
        const passwordsMatch = await bcrypt.compare(password, profile.hashed_password || "");

        if (passwordsMatch) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...userProfile } = profile;
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
const authConfig: NextAuthConfig = {
  providers: providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        if (user.profile) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...safeProfile } = user.profile;
          token.profile = safeProfile;
        } 
        else if (account?.provider !== 'credentials' && isValidSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
          const { data: dbProfile } = await supabaseAdmin
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
      
      if (token.profile) {
        session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>;
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

// Conditionally add the adapter only if Supabase environment variables are valid.
if (isValidSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey) {
  authConfig.adapter = SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  });
} else {
  console.warn("⚠️ SupabaseAdapter is not configured due to missing or invalid environment variables. Database-dependent auth features will not work.");
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
