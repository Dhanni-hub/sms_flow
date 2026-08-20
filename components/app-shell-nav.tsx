"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/format";
import {
  BarChart3,
  Bell,
  BookUser,
  CreditCard,
  Gauge,
  KeyRound,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Search,
  Send,
  Settings,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/messaging", label: "Messaging", icon: MessageSquareText },
  { href: "/contacts", label: "Contacts", icon: BookUser },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/sender-ids", label: "Sender IDs", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

type AppShellNavProps = {
  businessName: string;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
};

export function AppShellNav({ businessName, userName, userEmail, children }: AppShellNavProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent text-[var(--text-primary)] lg:grid lg:h-screen lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden border-r border-[var(--border)] bg-[var(--surface-sunken)] backdrop-blur-xl lg:flex lg:h-screen lg:flex-col">
        <SidebarContent businessName={businessName} pathname={pathname} />
        <div className="border-t border-[var(--border)] p-4">
          <div className="mb-3 rounded-xl border border-[var(--brand-subtle-border)] bg-[var(--brand-subtle)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--warning)] shadow-[0_0_16px_rgb(251_191_36_/_0.8)]" />
              Workspace
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{businessName}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary" className="w-full">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 lg:h-screen lg:overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)] px-4 py-4 backdrop-blur-xl sm:px-6 lg:h-[var(--topbar-height)] lg:px-8">
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <form onSubmit={submitSearch} className="min-w-0 flex-1 sm:max-w-xl">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                leadingIcon={<Search className="h-4 w-4" />}
                trailingElement={<span className="hidden rounded-md border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] sm:inline">⌘ K</span>}
                placeholder="Search anything..."
                aria-label="Search SMSFlow"
              />
            </form>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/messaging/send">
                <Send className="h-4 w-4" />
                Send SMS
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label="Notifications">
              <Link href="/settings?tab=notifications">
                <Bell className="h-5 w-5" />
              </Link>
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
              <Moon className="h-5 w-5" />
            </Button>
            <Link href="/settings?tab=profile" className="hidden min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 transition hover:bg-[var(--surface-hover)] md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--brand-subtle-border)] bg-[var(--brand-subtle)] text-xs font-semibold text-[var(--brand-hover)]">
                {initials(userName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{userName}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{userEmail}</span>
              </span>
            </Link>
          </div>
        </header>
        {children}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="absolute inset-0 bg-black/60" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-[min(88vw,340px)] flex-col border-r border-[var(--border-strong)] bg-[var(--surface-sunken)] shadow-[0_0_70px_rgb(124_60_255_/_0.28)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <Brand businessName={businessName} />
              <Button type="button" variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarLinks pathname={pathname} />
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ businessName, pathname }: { businessName: string; pathname: string }) {
  return (
    <>
      <div className="border-b border-[var(--border)] p-5">
        <Brand businessName={businessName} />
      </div>
      <SidebarLinks pathname={pathname} />
    </>
  );
}

function Brand({ businessName }: { businessName: string }) {
  return (
    <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#635bff,#8b5cf6)] text-white shadow-[0_0_32px_rgb(124_60_255_/_0.42)]">
        <MessageSquareText className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-semibold leading-none">SMSFlow</span>
        <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{businessName}</span>
      </span>
    </Link>
  );
}

function SidebarLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4 [scrollbar-color:rgb(124_60_255_/_0.35)_transparent] [scrollbar-width:thin]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
              active || (item.href === "/messaging" && ["/send", "/messages", "/campaigns", "/templates"].some((prefix) => pathname.startsWith(prefix))) || (item.href === "/contacts" && pathname.startsWith("/groups")) || (item.href === "/billing" && pathname.startsWith("/wallet"))
                ? "bg-[linear-gradient(90deg,rgb(124_60_255_/_0.88),rgb(74_58_255_/_0.52))] text-white shadow-[0_0_28px_rgb(124_60_255_/_0.22)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
