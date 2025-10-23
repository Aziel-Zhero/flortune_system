"use client";

import { AlertTriangle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mr-2">
    <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.22c-.46 2.07-2.13 3.42-4.09 3.42a5.34 5.34 0 0 1-5.34-5.34a5.34 5.34 0 0 1 5.34-5.34c1.41 0 2.42.52 3.2 1.26l1.96-1.96A8.74 8.74 0 0 0 12.18 2a9.34 9.34 0 0 0-9.34 9.34a9.34 9.34 0 0 0 9.34 9.34c5.04 0 8.92-3.76 8.92-8.92c0-.61-.05-1.11-.15-1.56Z"/>
  </svg>
);


export function SignupForm() {
  const router = useRouter();

  const handleMockSignup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Cadastro Simulado",
      description: "Redirecionando para o painel...",
    });
    router.push('/dashboard');
  };

  const handleGoogleSignIn = () => {
    toast({
      title: "Cadastro com Google (Desativado)",
      description: "A autenticação está desativada. Redirecionando para o painel.",
    });
    router.push('/dashboard');
  };


  return (
    <div className="space-y-6">
       <Alert variant="default" className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Modo de Demonstração</AlertTitle>
        <AlertDescription>A autenticação está desativada. Esta página é apenas um placeholder visual.</AlertDescription>
      </Alert>
      <form onSubmit={handleMockSignup} className="space-y-4 text-center text-muted-foreground">
        <p>O formulário de cadastro foi desativado temporariamente.</p>
        <Button type="submit" className="w-full">
          Ir para o Painel <UserPlus className="ml-2 h-4 w-4" />
        </Button>
      </form>
      
      <Separator />
      
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
        <GoogleIcon /> Inscrever-se com Google (Simulado)
      </Button>
    </div>
  );
}
