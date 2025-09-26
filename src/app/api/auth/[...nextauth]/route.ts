
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

// --- Environment Variable Reading ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
const nextAuthSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// --- Helper function to check for valid URL ---
function isValidSupabaseUrl(url: string | undefined): url is string {
  return !!url && url.startsWith('http') && !url.includes('<');
}

// --- Log Environment Variable Status for easier debugging ---
if (!isValidSupabaseUrl(supabaseUrl)) console.warn("⚠️ WARNING: NEXT_PUBLIC_SUPABASE_URL is not set or is invalid. Supabase-related features will fail.");
if (!supabaseServiceRoleKey || supabaseServiceRoleKey.includes('<')) console.warn("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is not set or is a placeholder. Supabase Adapter and DB operations will fail.");
if (!nextAuthSecret) console.warn("⚠️ WARNING: AUTH_SECRET is not set. Authentication will fail.");
if (!googleClientId || !googleClientSecret) console.warn("⚠️ WARNING: GoogleProvider credentials are not set. Login with Google will be unavailable.");


// --- Provider Configuration ---
const providers: NextAuthConfig['providers'] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const email = credentials.email as string;
      const password = credentials.password as string;
      
      if (!isValidSupabaseUrl(supabaseUrl) || !supabaseServiceRoleKey) {
          console.error('[NextAuth Authorize] Supabase credentials are not configured or invalid.');
          return null;
      }
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
      try {
        // A fonte da verdade para login com credenciais é a nossa tabela `profiles`
        const { data: profile, error: dbError } = await supabaseAdmin.from('profiles').select('*').eq('email', email).single();
        if (dbError || !profile) {
          console.error('[NextAuth Authorize Failed] Profile not found or DB error:', dbError?.message);
          return null;
        }
        // Se o usuário se cadastrou via Google, ele não terá uma senha.
        if (!profile.hashed_password) {
            console.error('[NextAuth Authorize Failed] User registered with OAuth has no password.');
            return null; // Não permita login com senha para contas OAuth
        }
        const passwordsMatch = await bcrypt.compare(password, profile.hashed_password);
        if (passwordsMatch) {
          // Retornar um objeto que o NextAuth entende, com o perfil completo anexado
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...userProfile } = profile;
          return { id: userProfile.id, email: userProfile.email, name: userProfile.display_name || userProfile.full_name, image: userProfile.avatar_url, profile: userProfile };
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
}

// --- Main NextAuth Configuration ---
export const authConfig: NextAuthConfig = {
  providers,
  // O adapter é responsável por criar o usuário em `next_auth.users` e `next_auth.accounts`
  adapter: SupabaseAdapter({ 
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      secret: process.env.SUPABASE_SERVICE_ROLE_KEY! 
  }),
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      // No primeiro login (seja Credentials ou OAuth), `user` está presente.
      if (user) {
        token.sub = user.id;
        // Se o `authorize` retornou um perfil (caso do Credentials), use-o
        if (user.profile) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hashed_password, ...safeProfile } = user.profile;
          token.profile = safeProfile;
        } 
        // Se foi um login OAuth (Google), o `user.profile` não existe.
        // Precisamos buscar ou criar o perfil em `public.profiles`.
        else if (account?.provider !== 'credentials' && isValidSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
          const { data: dbProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
          
          if (dbProfile) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { hashed_password, ...safeProfile } = dbProfile;
            token.profile = safeProfile;
          } else {
            // O trigger foi removido. Se o perfil não existe, criamos um aqui.
            // Esta é a nova lógica de sincronização para OAuth.
            console.log(`[JWT Callback] Perfil para o usuário ${user.id} não encontrado. Criando um novo...`);
            const { data: newProfile, error: insertError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email!,
                full_name: user.name,
                display_name: user.name,
                avatar_url: user.image,
                account_type: 'pessoa', // Default para OAuth
              })
              .select()
              .single();

            if (insertError) {
              console.error("[JWT Callback] Falha ao criar perfil para usuário OAuth:", insertError);
            } else if (newProfile) {
              console.log(`[JWT Callback] Perfil criado com sucesso para ${user.id}`);
              token.profile = newProfile;
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      // Anexar o perfil (que agora está garantido no token) à sessão
      if (token.profile) {
        session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>;
        session.user.name = session.user.profile.display_name || session.user.profile.full_name || session.user.name;
        session.user.image = session.user.profile.avatar_url || session.user.image;
        session.user.email = session.user.profile.email || session.user.email;
      }
      // Gerar o token de acesso Supabase para uso no cliente
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

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);
