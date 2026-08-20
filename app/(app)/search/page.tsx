import Link from "next/link";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira, formatPhoneDisplay } from "@/lib/format";
import { koboToNaira } from "@/lib/money";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const [contacts, messages, campaigns, templates, transactions] = q
    ? await Promise.all([
        prisma.contact.findMany({ where: { businessId: user.businessId, OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] }, take: 8 }),
        prisma.message.findMany({ where: { businessId: user.businessId, OR: [{ body: { contains: q } }, { recipientPhone: { contains: q } }, { recipientName: { contains: q } }] }, take: 8 }),
        prisma.campaign.findMany({ where: { businessId: user.businessId, OR: [{ name: { contains: q } }, { body: { contains: q } }] }, take: 8 }),
        prisma.template.findMany({ where: { businessId: user.businessId, OR: [{ name: { contains: q } }, { body: { contains: q } }] }, take: 8 }),
        prisma.transaction.findMany({ where: { businessId: user.businessId, OR: [{ reference: { contains: q } }, { description: { contains: q } }] }, take: 8 }),
      ])
    : [[], [], [], [], []] as const;

  const hasResults = contacts.length + messages.length + campaigns.length + templates.length + transactions.length > 0;

  return (
    <>
      <PageHeader title="Search" description="Search real contacts, messages, campaigns, templates, and transactions." />
      <PageBody>
        <form className="flex max-w-2xl gap-2"><Input name="q" defaultValue={q} placeholder="Search SMSFlow" /><Button type="submit">Search</Button></form>
        {!q ? <EmptyState title="Search your workspace" description="Enter a query to search tenant-scoped data." /> : !hasResults ? <EmptyState title="No results" description="No matching records were found." /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Results title="Contacts" href="/contacts" items={contacts.map((c) => `${c.name} · ${formatPhoneDisplay(c.phone)}`)} />
            <Results title="Messages" href="/messaging/history" items={messages.map((m) => `${m.status.toLowerCase()} · ${m.body}`)} />
            <Results title="Campaigns" href="/messaging/campaigns" items={campaigns.map((c) => `${c.name} · ${c.status.toLowerCase()}`)} />
            <Results title="Templates" href="/messaging/templates" items={templates.map((t) => `${t.name} · ${t.body}`)} />
            <Results title="Transactions" href="/billing" items={transactions.map((t) => `${t.reference} · ${formatNaira(koboToNaira(t.amountKobo), { showSign: true })}`)} />
          </div>
        )}
      </PageBody>
    </>
  );
}

function Results({ title, href, items }: { title: string; href: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><Link href={href} className="text-sm text-[var(--brand)]">Open</Link></div>
      {items.length === 0 ? <p className="mt-3 text-sm text-[var(--text-muted)]">No matches.</p> : <ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="truncate text-sm text-[var(--text-secondary)]">{item}</li>)}</ul>}
    </section>
  );
}
