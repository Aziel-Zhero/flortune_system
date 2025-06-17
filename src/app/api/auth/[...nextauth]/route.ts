
// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google"; // Importar GoogleProvider
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";
import { supabase } from '@/lib/supabase/client'; // Supabase client com anon key para buscar profile
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// Checagens de variáveis de ambiente essenciais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log("============================================================");
console.log("[NextAuth Config] Initializing NextAuth...");
console.log("[NextAuth Config] Attempting to read environment variables for Adapter & Providers:");
console.log("[NextAuth Config] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? `Present (Value: ${supabaseUrl})` : "MISSING or EMPTY");
console.log("[NextAuth Config] SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceRoleKey ? "Present (Key starts with " + supabaseServiceRoleKey.substring(0,10) + "...)" : "MISSING or EMPTY");
console.log("[NextAuth Config] SUPABASE_JWT_SECRET:", supabaseJwtSecret ? "Present" : "MISSING or EMPTY for supabaseAccessToken generation");
console.log("[NextAuth Config] AUTH_SECRET:", nextAuthSecret ? "Present" : "MISSING or EMPTY (CRITICAL for production)");
console.log("[NextAuth Config] GOOGLE_CLIENT_ID:", googleClientId ? "Present" : "MISSING or EMPTY for Google Provider");
console.log("[NextAuth Config] GOOGLE_CLIENT_SECRET:", googleClientSecret ? "Present" : "MISSING or EMPTY for Google Provider");
console.log("============================================================");

if (!supabaseUrl) {
  throw new Error("CRITICAL: Missing environment variable NEXT_PUBLIC_SUPABASE_URL for SupabaseAdapter.");
}
if (!supabaseServiceRoleKey) {
  throw new Error("CRITICAL: Missing environment variable SUPABASE_SERVICE_ROLE_KEY for SupabaseAdapter.");
}
if (!nextAuthSecret) {
  console.warn("WARNING: Missing environment variable AUTH_SECRET. NextAuth.js will not work securely in production if this is a production environment.");
}
if (!googleClientId || !googleClientSecret) {
    console.warn("WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Google Sign-In will not work.");
}


export const authConfig: NextAuthConfig = {
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  providers: [
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
          return null; // Retorna null para indicar falha na autorização
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log(`[NextAuth Authorize] Fetching profile from public.profiles for email: ${email}`);
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
          
          console.log(`[NextAuth Authorize] Profile found for ID: ${profile.id}. Comparing password...`);
          const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

          if (passwordsMatch) {
            console.log(`[NextAuth Authorize Success] Password match for profile ID: ${profile.id}.`);
            // Retornar o objeto User que o SupabaseAdapter espera para popular `next_auth.users`
            // O adapter usará id, name, email, image.
            // O `id` aqui DEVE ser o `id` de `public.profiles`.
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
    ...(googleClientId && googleClientSecret ? [
        GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            // profile(profile) { // Opcional: para mapear campos do perfil do Google para o usuário NextAuth
            //   return {
            //     id: profile.sub,
            //     name: profile.name,
            //     email: profile.email,
            //     image: profile.picture,
            //     // Adicione outros campos se necessário para o objeto User do NextAuth
            //   }
            // }
        })
    ] : [])
  ],
  session: {
    strategy: 'jwt', 
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile }) { 
      // console.log("[NextAuth JWT Callback] Token In:", JSON.stringify(token, null, 2));
      // console.log("[NextAuth JWT Callback] User In (at first login from authorize/OAuth):", JSON.stringify(user, null, 2));
      // console.log("[NextAuth JWT Callback] Account In (at first login/OAuth):", JSON.stringify(account, null, 2));
      // console.log("[NextAuth JWT Callback] OAuth Profile In:", JSON.stringify(oauthProfile, null, 2));
      if (user?.id) {
        token.sub = user.id; 
      }
      return token;
    },
    async session({ session, token }) { 
      // console.log("[NextAuth Session Callback] Session In:", JSON.stringify(session, null, 2));
      // console.log("[NextAuth Session Callback] Token In (from JWT callback):", JSON.stringify(token, null, 2));

      if (token.sub && session.user) {
        session.user.id = token.sub; 

        // Buscar o perfil customizado da tabela `public.profiles`
        const { data: userProfileData, error: profileError } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', token.sub) 
          .single();

        if (profileError) {
          console.error("[NextAuth Session Callback] Error fetching user profile from public.profiles:", profileError.message);
          session.user.profile = null;
        } else if (userProfileData) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...profileForSession } = userProfileData; 
          session.user.profile = profileForSession as Omit<AppProfile, 'hashed_password'>;
          session.user.name = userProfileData.display_name || userProfileData.full_name || session.user.name;
          session.user.email = userProfileData.email || session.user.email; 
          session.user.image = userProfileData.avatar_url || session.user.image;
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
        session.supabaseAccessToken = jwt.sign(payload, supabaseJwtSecret);
      } else if (!supabaseJwtSecret) {
        console.warn("[NextAuth Session Callback] SUPABASE_JWT_SECRET is not set. supabaseAccessToken will not be generated.");
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: nextAuthSecret, 
  // debug: process.env.NODE_ENV === 'development', 
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
