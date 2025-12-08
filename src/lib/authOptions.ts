// src/lib/authOptions.ts
import { type NextAuthOptions } from 'next-auth';
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
        try {
          console.log('🔐 Tentando login para:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { data: user, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', credentials.email.toLowerCase().trim())
            .single();

          if (error || !user) {
            console.log('❌ Usuário não encontrado');
            return null;
          }

          if (!user.hashed_password) {
            console.error('Usuário não possui senha cadastrada (provavelmente usa OAuth)');
            return null;
          }
          
          const isValidPassword = await verifyPassword(credentials.password, user.hashed_password);

          if (!isValidPassword) {
            console.log('❌ Senha incorreta');
            return null;
          }

          console.log('✅ Login válido para:', user.email);
          
          return {
            id: user.id,
            email: user.email,
            name: user.display_name || user.full_name,
            image: user.avatar_url,
          };
        } catch (error) {
          console.error('❌ Erro no authorize:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};
