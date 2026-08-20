import { MessageStatus } from "@prisma/client";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira, formatNumber } from "@/lib/format";
import { koboToNaira } from "@/lib/money";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  const [messages, campaigns] = await Promise.all([
    prisma.message.findMany({ where: { businessId: user.businessId, createdAt: { gte: start } }, orderBy: { createdAt: "asc" } }),
    prisma.campaign.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const sent = messages.length;
  const delivered = messages.filter((m) => m.status === MessageStatus.DELIVERED).length;
  const failed = messages.filter((m) => m.status === MessageStatus.FAILED).length;
  const spend = messages.reduce((sum, m) => sum + m.costKobo, 0);
  const maxDay = Math.max(1, ...Array.from({ length: 30 }).map((_, idx) => messages.filter((m) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return m.createdAt.toDateString() === d.toDateString();
  }).length));
  return (
    <>
      <PageHeader title="Analytics" description="Usage, delivery, and spending from database message records." />
      <PageBody>
        <div className="grid gap-4 sm:grid-cols-4"><Metric label="SMS volume" value={formatNumber(sent)} /><Metric label="Delivery rate" value={`${sent ? Math.round((delivered / sent) * 100) : 0}%`} /><Metric label="Failure rate" value={`${sent ? Math.round((failed / sent) * 100) : 0}%`} /><Metric label="Spend" value={formatNaira(koboToNaira(spend))} /></div>
        {messages.length === 0 ? <EmptyState title="No analytics yet" description="Charts populate after real messages are sent and status updates are recorded." /> : <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><h2 className="font-semibold">30-day trend</h2><div className="mt-4 flex h-48 items-end gap-1">{Array.from({ length: 30 }).map((_, idx) => { const d = new Date(start); d.setDate(start.getDate() + idx); const count = messages.filter((m) => m.createdAt.toDateString() === d.toDateString()).length; return <div key={idx} className="flex-1 rounded-t bg-[var(--brand)]" style={{ height: `${Math.max(4, (count / maxDay) * 100)}%` }} title={`${count} messages`} />; })}</div></div>}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><h2 className="font-semibold">Top campaigns</h2>{campaigns.length === 0 ? <p className="mt-2 text-sm text-[var(--text-secondary)]">No campaigns yet.</p> : campaigns.map((c) => <p key={c.id} className="mt-2 text-sm">{c.name}: {c.deliveredCount}/{c.recipientCount} delivered</p>)}</section>
      </PageBody>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-sm text-[var(--text-secondary)]">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value}</p></div>;
}
