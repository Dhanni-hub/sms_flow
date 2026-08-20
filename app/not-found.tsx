import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-16 text-[var(--text-primary)]">
      <section className="mx-auto max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-lg)]">
        <p className="text-sm font-medium text-[var(--brand-hover)]">404</p>
        <h1 className="mt-3 text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          This SMSFlow page does not exist or may have moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
