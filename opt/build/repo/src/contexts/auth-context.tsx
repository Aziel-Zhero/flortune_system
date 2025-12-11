// src/contexts/auth-context.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

import { supabase } from "@/lib/supabase/client";
import type { AuthSession, User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database.types";

type UserWithProfile = User & { profile: Profile | null };

export type Session = Omit<AuthSession, "user"> & {
  user: UserWithProfile | null;
};

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  update: (newSessionData: Partial<Session>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Carrega perfil + monta sessão
   */
  const fetchProfileAndSetSession = useCallback(
    async (incomingSession: AuthSession | null): Promise<void> => {
      // Sem sessão
      if (!incomingSession?.user) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      // Evita re-fetch desnecessário
      const sameUser =
        session?.user?.id && session.user.id === incomingSession.user.id;

      if (!sameUser) {
        setIsLoading(true);
      }

      try {
        const authUser = incomingSession.user;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("AuthContext: Erro ao buscar perfil:", error.message);

          setSession({
            ...incomingSession,
            user: {
              ...authUser,
              profile: null,
            },
          });

          return;
        }

        setSession({
          ...incomingSession,
          user: {
            ...authUser,
            profile: profile ?? null,
          },
        });
      } catch (err) {
        console.error("AuthContext: Exceção ao buscar perfil:", err);

        setSession({
          ...incomingSession,
          user: {
            ...incomingSession.user,
            profile: null,
          },
        });
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id]
  );

  /**
   * Inicialização + listener Auth
   */
  useEffect(() => {
    if (!supabase) {
      console.error("AuthProvider: Supabase não inicializado.");
      setIsLoading(false);
      return;
    }

    const loadSession = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      await fetchProfileAndSetSession(initialSession);
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        await fetchProfileAndSetSession(newSession);
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [fetchProfileAndSetSession]);

  /**
   * Atualização manual da sessão
   */
  const update = async (newSessionData: Partial<Session>) => {
    setSession((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        ...newSessionData,
        user: newSessionData.user
          ? {
              ...prev.user,
              ...newSessionData.user,
            }
          : prev.user,
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        update,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook seguro
 */
export const useSession = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useSession deve ser usado dentro de um AuthProvider.");
  }
  return context;
};
