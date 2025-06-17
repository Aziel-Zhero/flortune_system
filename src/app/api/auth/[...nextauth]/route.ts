
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// --- Environment Variable Reading ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL; // Consider both

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// --- Enhanced Logging at Module Load Time ---
console.log("============================================================");
console.log("[NextAuth Config - Module Load] Initializing NextAuth configuration...");
console.log("[NextAuth Config - Module Load] Reading Environment Variables:");
console.log(`[NextAuth Config - Module Load] NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? `Present (Value: ${supabaseUrl})` : "MISSING or EMPTY"}`);
console.log(`[NextAuth Config - Module Load] SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceRoleKey ? "Present (Key starts with " + supabaseServiceRoleKey.substring(0,5) + "...)" : "MISSING or EMPTY"}`);
console.log(`[NextAuth Config - Module Load] SUPABASE_JWT_SECRET: ${supabaseJwtSecret ? "Present (Status)" : "MISSING or EMPTY for supabaseAccessToken"}`);
console.log(`[NextAuth Config - Module Load] AUTH_SECRET: ${nextAuthSecret ? "Present (Status)" : "MISSING or EMPTY (CRITICAL)"}`);
console.log(`[NextAuth Config - Module Load] AUTH_URL/NEXTAUTH_URL: ${authUrl ? `Present (Value: ${authUrl})` : "MISSING or EMPTY (Important)"}`);
console.log(`[NextAuth Config - Module Load] GOOGLE_CLIENT_ID: ${googleClientId ? `Present (Value: ${googleClientId})` : "MISSING or EMPTY for Google Provider"}`);
console.log(`[NextAuth Config - Module Load] GOOGLE_CLIENT_SECRET: ${googleClientSecret ? "Present (Status)" : "MISSING or EMPTY for Google Provider"}`);
console.log("============================================================");

// --- Critical Environment Variable Checks ---
if (!supabaseUrl) {
  throw new Error("CRITICAL: Missing environment variable NEXT_PUBLIC_SUPABASE_URL for SupabaseAdapter.");
}
if (!supabaseServiceRoleKey) {
  throw new Error("CRITICAL: Missing environment variable SUPABASE_SERVICE_ROLE_KEY for SupabaseAdapter.");
}
if (!nextAuthSecret) {
  console.warn("CRITICAL WARNING: Missing environment variable AUTH_SECRET. NextAuth.js will not work securely in production. For development, a default insecure secret might be used, but this is NOT recommended.");
  // Consider throwing an error in production: throw new Error("CRITICAL: Missing environment variable AUTH_SECRET.");
}
if (!authUrl) {
  console.warn("WARNING: AUTH_URL (or NEXTAUTH_URL) is not set. This might lead to issues with redirects or endpoint discovery. Defaulting might occur but explicit setting is recommended.");
  // Consider throwing an error: throw new Error("CRITICAL: Missing AUTH_URL or NEXTAUTH_URL.");
}


// --- Provider Configuration ---
const providers: NextAuthConfig['providers'] = [ // Explicitly type providers
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      console.log("[NextAuth Authorize Attempt] For Email (Credentials):", credentials?.email);
      if (!credentials?.email || !credentials?.password) {
        console.error("[NextAuth Authorize Failed] Missing email or password in credentials.");
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
          console.error(`[NextAuth Authorize Failed] User profile (ID: ${profile.id}, Email: ${profile.email}) does not have a hashed_password. Cannot use credentials.`);
          return null;
        }
        const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);
        if (passwordsMatch) {
          console.log(`[NextAuth Authorize Success] Password match for profile ID: ${profile.id}.`);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...profileForUserObject } = profile;
          return {
            id: profileForUserObject.id,
            email: profileForUserObject.email,
            name: profileForUserObject.display_name || profileForUserObject.full_name,
            image: profileForUserObject.avatar_url,
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
  console.log("[NextAuth Config] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are PRESENT. Adding GoogleProvider to NextAuth providers list.");
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
} else {
  console.warn("[NextAuth Config] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET (or both) are MISSING. GoogleProvider will NOT be configured. Login with Google will likely fail if attempted.");
}

// --- Main NextAuth Configuration ---
export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: supabaseUrl!, // Add ! because we check for supabaseUrl above
    secret: supabaseServiceRoleKey!, // Add ! because we check for supabaseServiceRoleKey above
  }),
  providers: providers,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile }) {
      if (user?.id) {
        token.sub = user.id;
      }
      // console.log("[NextAuth JWT Callback] Token Out:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      // console.log("[NextAuth Session Callback] Session In:", JSON.stringify(session, null, 2));
      // console.log("[NextAuth Session Callback] Token In (from JWT callback):", JSON.stringify(token, null, 2));
      if (token.sub && session.user) {
        session.user.id = token.sub;
        const { data: userProfileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', token.sub)
          .single();

        if (profileError) {
          console.error(`[NextAuth Session Callback] Error fetching user profile (ID: ${token.sub}) from public.profiles:`, profileError.message);
          session.user.profile = null;
        } else if (userProfileData) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...profileForSession } = userProfileData;
          session.user.profile = profileForSession as Omit<AppProfile, 'hashed_password'>;
          session.user.name = userProfileData.display_name || userProfileData.full_name || session.user.name;
          session.user.email = userProfileData.email || session.user.email;
          session.user.image = userProfileData.avatar_url || session.user.image;
        } else {
           console.warn(`[NextAuth Session Callback] No profile found in public.profiles for user ID: ${token.sub}. This might happen if the trigger to create a profile hasn't run or failed.`);
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
        console.warn("[NextAuth Session Callback] SUPABASE_JWT_SECRET is not set. supabaseAccessToken will not be generated.");
      }
      // console.log("[NextAuth Session Callback] Session Out:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login page on error
  },
  secret: nextAuthSecret,
  // debug: process.env.NODE_ENV === 'development', // Uncomment for extensive NextAuth logs
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
    