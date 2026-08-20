import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { koboToNaira } from "@/lib/money";

export default async function ActivityLogsPage() {
  const user = await requireUser();
  const [messages, transactions, campaigns] = await Promise.all([
    prisma.message.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.transaction.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.campaign.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const rows = [
    ...messages.map((message) => ({ type: "Message", title: message.recipientPhone, detail: message.status.toLowerCase(), date: message.createdAt })),
    ...transactions.map((transaction) => ({ type: "Transaction", title: transaction.description, detail: formatNaira(koboToNaira(transaction.amountKobo), { showSign: true }), date: transaction.createdAt })),
    ...campaigns.map((campaign) => ({ type: "Campaign", title: campaign.name, detail: campaign.status.toLowerCase(), date: campaign.createdAt })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 50);

  return (
    <>
      <PageHeader title="Activity Logs" description="Chronological workspace events from messages, campaigns, and wallet transactions." />
      <PageBody>
        <section className="app-panel rounded-2xl p-5">
          {rows.length === 0 ? <EmptyState title="No activity yet" description="Activity logs will appear after real workspace operations occur." /> : (
            <div className="divide-y divide-[var(--border)]">
              {rows.map((row) => (
                <div key={`${row.type}-${row.title}-${row.date.toISOString()}`} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><Badge variant="brand">{row.type}</Badge><p className="truncate font-medium">{row.title}</p></div>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{row.detail}</p>
                  </div>
                  <time className="text-sm text-[var(--text-muted)]" dateTime={row.date.toISOString()}>{row.date.toLocaleString("en-NG")}</time>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}
