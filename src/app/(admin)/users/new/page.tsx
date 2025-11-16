// src/app/(admin)/users/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowLeft, Mail, KeyRound, User, Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { createUser } from "@/app/actions/user.actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const newUserSchema = z.object({
  fullName: z.string().min(2, "Nome é obrigatório."),
  email: z.string().email("Email inválido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  role: z.enum(['user', 'admin'], { required_error: "Selecione uma role."}),
});

type NewUserFormData = z.infer<typeof newUserSchema>;

export default function NewUserPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      role: 'user',
    },
  });

  useEffect(() => {
    document.title = `Criar Novo Usuário - ${APP_NAME}`;
  }, []);
  
  const onSubmit = async (data: NewUserFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    
    const result = await createUser(data);

    if (result.error) {
      setFormError(result.error);
      toast({
        title: "Erro ao Criar Usuário",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuário Criado com Sucesso!",
        description: `O usuário ${result.data?.email} foi criado.`,
        action: <CheckCircle className="text-green-500"/>
      });
      reset(); // Limpa o formulário
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Criar Novo Usuário"
        description="Adicione um novo usuário ao sistema definindo suas credenciais e permissões."
        icon={<UserPlus className="h-6 w-6 text-primary" />}
        actions={<Button asChild variant="outline"><Link href="/dashboard-admin"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Link></Button>}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Detalhes do Usuário</CardTitle>
            <CardDescription>
              A senha será criptografada e o usuário será criado com o e-mail já confirmado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {formError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4"/>
                    <AlertTitle>Falha na Criação</AlertTitle>
                    <AlertDescription>{formError}</AlertDescription>
                </Alert>
             )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" {...register("fullName")} className="pl-10" />
              </div>
              {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" {...register("email")} className="pl-10" />
              </div>
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" {...register("password")} className="pl-10" />
              </div>
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>Role (Permissão)</Label>
                <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground"/>
                                <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">Usuário Padrão</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.role && <p className="text-sm text-destructive mt-1">{errors.role.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Criando usuário..." : "Criar Usuário"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
