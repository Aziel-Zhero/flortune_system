import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back!"
      description={`Log in to your ${APP_NAME} account to manage your finances.`}
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkHref="/signup"
    >
      <LoginForm />
    </AuthLayout>
  );
}
