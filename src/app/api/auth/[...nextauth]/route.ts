
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// --- DETAILED LOGGING AT MODULE LOAD TIME ---
console.log("============================================================");
console.log("🚀 [NextAuth Route Handler - MODULE LOAD] 🚀");
console.log("Attempting to load NextAuth configuration...");
console.log("Timestamp:", new Date().toISOString());
console.log("Node Environment:", process.env.NODE_ENV);

// --- Environment Variable Reading & Logging ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const authUrl = process.env.AUTH_URL; // Using AUTH_URL as primary
const nextauthUrlEnv = process.env.NEXTAUTH_URL; // Also check NEXTAUTH_URL

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log("\n--- Environment Variables Check ---");
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? `Present (Value: ${supabaseUrl})` : "🚨 MISSING or EMPTY"}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? `Present (Key starts with ${supabaseServiceRoleKey.substring(0, 5)}...)` : "🚨 MISSING or EMPTY (CRITICAL for Adapter)"}`);
console.log(`SUPABASE_JWT_SECRET: ${supabaseJwtSecret ? "Present (Status)" : "🚨 MISSING or EMPTY (Needed for supabaseAccessToken)"}`);
console.log(`AUTH_SECRET: ${nextAuthSecret ? "Present (Status)" : "🚨 MISSING or EMPTY (CRITICAL for NextAuth)"}`);
console.log(`AUTH_URL: ${authUrl ? `Present (Value: ${authUrl})` : "🚨 MISSING or EMPTY (Important for redirects)"}`);
console.log(`NEXTAUTH_URL (Fallback): ${nextauthUrlEnv ? `Present (Value: ${nextauthUrlEnv})` : "Not set"}`);
console.log(`GOOGLE_CLIENT_ID: ${googleClientId ? `Present (Value: ${googleClientId})` : "🚨 MISSING or EMPTY (For Google Provider)"}`);
console.log(`GOOGLE_CLIENT_SECRET: ${googleClientSecret ? "Present (Status)" : "🚨 MISSING or EMPTY (For Google Provider)"}`);
console.log("------------------------------------");

// --- Critical Environment Variable Checks ---
if (!supabaseUrl) {
  console.error("❌ CRITICAL ERROR: Missing NEXT_PUBLIC_SUPABASE_URL.");
  throw new Error("CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL for SupabaseAdapter.");
}
if (!supabaseServiceRoleKey) {
  console.error("❌ CRITICAL ERROR: Missing SUPABASE_SERVICE_ROLE_KEY.");
  throw new Error("CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY for SupabaseAdapter.");
}
if (!nextAuthSecret) {
  console.error("❌ CRITICAL ERROR: Missing AUTH_SECRET.");
  throw new Error("CRITICAL: Missing AUTH_SECRET. NextAuth.js will not work securely.");
}
if (!authUrl && !nextauthUrlEnv) {
  console.warn("⚠️ WARNING: Neither AUTH_URL nor NEXTAUTH_URL is set. This WILL LIKELY CAUSE ISSUES with redirects or endpoint discovery.");
} else if (!authUrl && nextauthUrlEnv) {
  console.warn(`⚠️ WARNING: AUTH_URL is not set, but NEXTAUTH_URL is (${nextauthUrlEnv}). Consider migrating to AUTH_URL.`);
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
      console.log("[NextAuth Authorize Attempt] For Email (Credentials):", credentials?.email);
      if (!credentials?.email || !credentials?.password) {
        console.error("[NextAuth Authorize Failed] Missing email or password.");
        return null;
      }
      const email = credentials.email as string;
      const password = credentials.password as string;

      try {
        const { data: profile, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (dbError) {
          console.error('[NextAuth Authorize Failed] Supabase DB error fetching profile:', dbError.message);
          return null;
        }
        if (!profile) {
          console.log(`[NextAuth Authorize Failed] No profile found for email: ${email}.`);
          return null;
        }
        if (!profile.hashed_password) {
          console.error(`[NextAuth Authorize Failed] Profile (ID: ${profile.id}) has no hashed_password.`);
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

        if (passwordsMatch) {
          console.log(`[NextAuth Authorize Success] Password match for profile ID: ${profile.id}.`);
          return {
            id: profile.id,
            email: profile.email,
            name: profile.display_name || profile.full_name,
            image: profile.avatar_url,
          };
        } else {
          console.log(`[NextAuth Authorize Failed] Password mismatch for profile ID: ${profile.id}.`);
          return null;
        }
      } catch (e: any) {
        console.error('[NextAuth Authorize Exception]:', e.message, e.stack);
        return null;
      }
    },
  }),
];

if (googleClientId && googleClientSecret) {
  console.log("✅ GoogleProvider: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are PRESENT. Adding GoogleProvider to NextAuth providers list.");
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else {
  console.warn("⚠️ GoogleProvider: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET (or both) are MISSING. GoogleProvider will NOT be configured. Login with Google will fail.");
}

// --- Main NextAuth Configuration ---
export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: supabaseUrl!,
    secret: supabaseServiceRoleKey!,
  }),
  providers: providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;

        const { data: userProfileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', token.sub)
          .single();

        if (profileError) {
          console.error(`[NextAuth Session Callback] Error fetching profile (ID: ${token.sub}):`, profileError.message);
          session.user.profile = null;
        } else if (userProfileData) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...profileForSession } = userProfileData;
          session.user.profile = profileForSession as Omit<AppProfile, 'hashed_password'>;
          session.user.name = userProfileData.display_name || userProfileData.full_name || session.user.name;
          session.user.email = userProfileData.email || session.user.email;
          session.user.image = userProfileData.avatar_url || session.user.image;
        } else {
           console.warn(`[NextAuth Session Callback] No profile found for user ID: ${token.sub}. Trigger 'handle_new_user_from_next_auth' might have issues.`);
           session.user.profile = null;
        }
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
      } else if (!supabaseJwtSecret) {
        // console.warn("[NextAuth Session Callback] SUPABASE_JWT_SECRET is not set. supabaseAccessToken will not be generated.");
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

console.log("🚦 Initializing NextAuth with final config... 🚦");
const authHandlers = NextAuth(authConfig);
console.log("✅ NextAuth initialized, exporting handlers, auth, signIn, signOut.");
console.log("============================================================");

export const { handlers: { GET, POST }, auth, signIn, signOut } = authHandlers;
