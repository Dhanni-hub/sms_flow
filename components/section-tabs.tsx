import Link from "next/link";

export function SectionTabs({ items, active }: { items: Array<{ href: string; label: string }>; active: string }) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Section navigation">
      {items.map((item) => {
        const selected = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              selected
                ? "border-[var(--brand-subtle-border)] bg-[var(--brand-subtle)] text-[var(--brand-hover)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
