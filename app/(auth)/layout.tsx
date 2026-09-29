import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)]">
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--border-subtle)] pb-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--brand-subtle-border)] bg-[linear-gradient(135deg,var(--brand-gold-light),var(--brand-red))] text-base font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)]">SF</span>
          <div>
            <p className="text-lg font-semibold leading-none text-[var(--text-primary)]">SMSFlow</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Business SMS, wallet and delivery tools</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
