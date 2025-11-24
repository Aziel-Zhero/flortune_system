// src/app/(app)/dev/scrum-analytics/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page was deprecated to centralize analytics in the Kanban board.
// Redirecting to the Kanban analytics page as a sensible default.
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
