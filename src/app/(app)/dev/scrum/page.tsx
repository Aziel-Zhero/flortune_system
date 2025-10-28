// src/app/(app)/dev/scrum/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Esta página foi desativada e seu link removido do menu.
// O foco foi movido para as ferramentas Kanban.
// Redirecionamos para o quadro Kanban como um padrão sensato.
export default function ObsoleteScrumPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dev/kanban");
  }, [router]);

  return (
    <div>
      <p>Redirecionando para o Quadro Kanban...</p>
    </div>
  );
}
