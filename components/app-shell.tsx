import { requireUser } from "@/lib/auth";
import { AppShellNav } from "@/components/app-shell-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShellNav businessName={user.business.name} userName={user.name} userEmail={user.email}>
      {children}
    </AppShellNav>
  );
}
