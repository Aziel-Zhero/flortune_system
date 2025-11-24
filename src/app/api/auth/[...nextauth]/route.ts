// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

// Função de verificação de senha temporária e INSEGURA
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  console.warn('⚠️ AVISO: Verificação de senha em modo de compatibilidade. NÃO USE EM PRODUÇÃO REAL.');
  // Esta lógica é apenas para permitir o deploy funcionar sem o bcrypt.
  // A senha digitada deve ser '12345678Aa!' e o hash no banco 'temp_hashed_password'.
  return plainPassword === '12345678Aa!' && hashedPassword === 'temp_hashed_password';
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nextAuthSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!supabaseUrl || !supabaseServiceRoleKey || !nextAuthSecret || !googleClientId || !googleClientSecret) {
  throw new Error('Variáveis de ambiente de autenticação faltando.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Credenciais não fornecidas');
          return null;
        }

        try {
          const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', credentials.email.toLowerCase().trim())
            .single();

          if (error || !profile) {
            console.error('Usuário não encontrado ou erro no Supabase:', error?.message);
            return null;
          }

          if (!profile.hashed_password) {
            console.error('Usuário não possui senha cadastrada (provavelmente usa OAuth)');
            return null;
          }
          
          const isValidPassword = await verifyPassword(credentials.password, profile.hashed_password);

          if (!isValidPassword) {
            console.log('Senha inválida para:', credentials.email);
            return null;
          }

          return {
            id: profile.id,
            email: profile.email,
            name: profile.display_name,
            image: profile.avatar_url,
          };
        } catch (err) {
          console.error("Erro inesperado no authorize:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
     async jwt({ token, user, account }) {
      if (account && user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
    // Adicionar outras páginas customizadas se necessário
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
