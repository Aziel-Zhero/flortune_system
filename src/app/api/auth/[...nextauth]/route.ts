
import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import type { Profile as AppProfile } from '@/types/database.types';

// Declarações de módulo para estender tipos do NextAuth
// Estes já foram movidos para src/types/next-auth.d.ts, mas é bom ter aqui para referência rápida.
// Certifique-se que src/types/next-auth.d.ts é o arquivo mestre para estas definições.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string; // ID do perfil do Supabase
      profile?: Omit<AppProfile, 'hashed_password'> | null; // SEM hashed_password
    } & Omit<DefaultSession['user'], 'id'>;
  }

  interface User { // Retorno da função authorize
    id: string; // ID do perfil do Supabase
    name?: string | null;
    email?: string | null;
    image?: string | null;
    profile?: Omit<AppProfile, 'hashed_password'> | null; // SEM hashed_password
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string; // ID do perfil do Supabase
    profile?: Omit<AppProfile, 'hashed_password'> | null; // SEM hashed_password
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
          return null; // Retorna null para indicar falha de autorização
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log(`[NextAuth Authorize] Fetching profile for email: ${email}`);
          // Selecionar explicitamente os campos necessários, incluindo hashed_password
          const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('id, email, hashed_password, full_name, display_name, avatar_url, account_type, created_at, updated_at')
            .eq('email', email)
            .single();

          if (dbError) {
            console.error('[NextAuth Authorize] Supabase DB error fetching profile:', dbError.message, 'Code:', dbError.code);
            if (dbError.code === 'PGRST116') { // PGRST116: "Query result returned no rows"
                 console.log(`[NextAuth Authorize] Profile not found for email: ${email}`);
            }
            return null; // Erro no DB ou perfil não encontrado
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { hashed_password, ...profileForSession } = profile; // Crucial: remover hashed_password
            
            return { // Este é o objeto User que vai para o callback jwt
              id: profileForSession.id, 
              email: profileForSession.email, 
              name: profileForSession.display_name || profileForSession.full_name, 
              image: profileForSession.avatar_url,
              profile: profileForSession as Omit<AppProfile, 'hashed_password'> // Garantir que o tipo está correto
            };
          } else {
            console.log(`[NextAuth Authorize] Password mismatch for profile ID: ${profile.id}.`);
            return null; 
          }
        } catch (e: any) {
          console.error('[NextAuth Authorize] Exception during authorization process:', e.message, e.stack);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', 
  },
  callbacks: {
    async jwt({ token, user }) { // user aqui é o retorno da função authorize
      if (user) { 
        token.id = user.id; 
        token.profile = user.profile; // user.profile já está sem hashed_password
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) { // token aqui é o retorno da função jwt
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      if (token?.profile && session.user) { 
        session.user.profile = token.profile as Omit<AppProfile, 'hashed_password'>; // Garantir tipo
        // Atualizar campos da sessão se eles vêm do token.profile (que é mais completo)
        session.user.name = token.name ?? token.profile.display_name ?? token.profile.full_name;
        session.user.email = token.email ?? token.profile.email;
        session.user.image = token.picture ?? token.profile.avatar_url;
      } else if (session.user) { // Fallback se token.profile não estiver lá por algum motivo
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // error: '/login', // Opcional: para onde redirecionar em caso de erro de auth
  },
  secret: process.env.AUTH_SECRET, 
  // debug: process.env.NODE_ENV === 'development', // Descomente para logs detalhados do NextAuth
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig);

    