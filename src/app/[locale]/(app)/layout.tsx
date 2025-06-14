import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({
  children,
  params: {locale} // locale is available from URL parameters
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  return (
    <SidebarProvider defaultOpen> {/* Manage sidebar state */}
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader /> {/* AppHeader will use useTranslations internally for its texts */}
        <div className="flex flex-1 pt-16"> {/* Add padding-top to account for fixed AppHeader height */}
          <AppSidebar /> {/* AppSidebar will use useTranslations for its texts */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
