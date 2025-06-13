import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader /> {/* AppHeader will use useTranslations internally */}
        <div className="flex flex-1">
          <AppSidebar /> {/* AppSidebar will use useTranslations internally */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
