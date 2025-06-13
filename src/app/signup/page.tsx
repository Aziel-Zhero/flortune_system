import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { APP_NAME } from "@/lib/constants";

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create an Account"
      description={`Join ${APP_NAME} and start cultivating your financial well-being.`}
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerLinkHref="/login"
    >
      <SignupForm />
    </AuthLayout>
  );
}
