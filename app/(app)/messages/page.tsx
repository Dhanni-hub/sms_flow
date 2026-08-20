import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { MessagingTabs } from "@/components/messaging-tabs";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira, formatPhoneDisplay } from "@/lib/format";
import { koboToNaira } from "@/lib/money";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q ?? "";
  const status = params.status ?? "";
  const page = Math.max(1, Number(params.page ?? 1));
  const where = {
    businessId: user.businessId,
    ...(status ? { status: status.toUpperCase() as never } : {}),
    ...(q ? { OR: [{ recipientPhone: { contains: q } }, { recipientName: { contains: q } }, { body: { contains: q } }] } : {}),
  };
  const [messages, total] = await Promise.all([
    prisma.message.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20 }),
    prisma.message.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Messages" description="Search, filter, and inspect provider-backed SMS records." />
      <PageBody>
        <MessagingTabs active="/messaging/history" />
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <form className="grid gap-2 border-b border-[var(--border)] p-3 sm:grid-cols-[1fr_180px_auto]">
            <Input name="q" placeholder="Search recipient or message" defaultValue={q} />
            <select name="status" defaultValue={status} className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm">
              <option value="">All statuses</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="pending">Pending</option><option value="failed">Failed</option>
            </select>
            <button className="rounded-lg bg-[var(--brand)] px-4 text-sm font-semibold text-[var(--text-on-brand)]">Filter</button>
          </form>
          {messages.length === 0 ? <div className="p-4"><EmptyState title="No messages yet" description="Messages appear here after a provider accepts them." /></div> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[var(--surface-sunken)] text-left"><tr><th className="p-3">Recipient</th><th className="p-3">Message</th><th className="p-3">Status</th><th className="p-3">Cost</th><th className="p-3">Provider ref</th><th className="p-3">Date</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{messages.map((message) => <tr key={message.id}><td className="p-3 font-mono">{formatPhoneDisplay(message.recipientPhone)}</td><td className="max-w-md truncate p-3">{message.body}</td><td className="p-3">{message.status.toLowerCase()}</td><td className="p-3 font-mono">{formatNaira(koboToNaira(message.costKobo))}</td><td className="p-3">{message.providerMessageId || "None"}</td><td className="p-3">{message.createdAt.toLocaleString("en-NG")}</td></tr>)}</tbody></table></div>
          )}
          <div className="border-t border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]">{total} messages</div>
        </section>
      </PageBody>
    </>
  );
}
