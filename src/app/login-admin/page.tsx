// src/app/login-admin/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Esta página agora é obsoleta, pois o login foi unificado.
// Redirecionando para a página de login principal.
export default function ObsoleteAdminLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div>
      <p>Redirecionando para a página de login...</p>
    </div>
  );
}
