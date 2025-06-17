
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// Declarações de módulo para estender tipos do NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // ID do perfil do Supabase
      profile?: AppProfile | null;
    } & Omit<DefaultSession['user'], 'id'>; // Mantém name, email, image, mas 'id' será o nosso
  }

  interface User {
    id: string; // ID do perfil do Supabase
    name?: string | null;
    email?: string | null;
    image?: string | null;
    profile?: AppProfile | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string; // ID do perfil do Supabase
    profile?: AppProfile | null;
    // Adicionar picture, name, email aqui se quiser que sejam passados diretamente para a session
    picture?: string | null;
    name?: string | null;
    email?: string | null;
  }
}


export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'nome@exemplo.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("[NextAuth Authorize] Attempting authorization for email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth Authorize] Missing email or password in credentials.");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log(`[NextAuth Authorize] Fetching profile for email: ${email}`);
          const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

          if (dbError) {
            console.error('[NextAuth Authorize] Supabase DB error fetching profile:', dbError.message);
            // Do not return null yet, check if it's "profile not found" vs other DB error
            if (dbError.code === 'PGRST116') { // PGRST116: "Query result returned no rows"
                 console.log(`[NextAuth Authorize] Profile not found for email: ${email}`);
                 return null; 
            }
            // For other DB errors, it's a server issue
            throw new Error(`Database error: ${dbError.message}`);
          }
          
          if (!profile) {
            console.log(`[NextAuth Authorize] No profile found for email: ${email} (after DB query).`);
            return null; 
          }

          console.log(`[NextAuth Authorize] Profile found for ID: ${profile.id}. Checking password.`);
          if (!profile.hashed_password) {
            console.error(`[NextAuth Authorize] User profile (ID: ${profile.id}) does not have a hashed password.`);
            return null; 
          }
          
          const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);

          if (passwordsMatch) {
            console.log(`[NextAuth Authorize] Password match for profile ID: ${profile.id}. Returning user object.`);
            return { 
              id: profile.id, 
              email: profile.email, 
              name: profile.display_name || profile.full_name, 
              image: profile.avatar_url,
              profile: profile as AppProfile 
            };
          } else {
            console.log(`[NextAuth Authorize] Password mismatch for profile ID: ${profile.id}.`);
            return null; 
          }
        } catch (e: any) {
          console.error('[NextAuth Authorize] Exception during authorization process:', e.message, e.stack);
          // Rethrow or return null to indicate failure. Returning null is typical for authorize.
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', 
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile }) {
      if (user) { 
        token.id = user.id; 
        if (user.profile) { 
            token.profile = user.profile;
        }
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token?.profile && session.user) { 
        session.user.profile = token.profile as AppProfile;
        session.user.name = token.name ?? (token.profile as AppProfile).display_name ?? (token.profile as AppProfile).full_name;
        session.user.email = token.email ?? (token.profile as AppProfile).email;
        session.user.image = token.picture ?? (token.profile as AppProfile).avatar_url;
      } else if (session.user) { 
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET, 
  // debug: process.env.NODE_ENV === 'development',
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);

    