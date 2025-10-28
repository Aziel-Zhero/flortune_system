// src/app/(app)/dev/scrum-analytics/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Esta página foi desativada para centralizar as análises no Quadro Kanban.
// Redirecionamos para a página de análise do Kanban como um padrão.
export default function ObsoleteScrumAnalyticsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dev/kanban-analytics");
  }, [router]);

  return (
    <div>
      <p>Redirecionando para a Análise Kanban...</p>
    </div>
  );
}
