import Link from "next/link";
import { CampaignStatus, MessageStatus, TransactionType } from "@prisma/client";
import { MessagesSentChart, StatusDonutChart } from "@/components/dashboard-charts";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira, formatNumber, formatRelativeTime } from "@/lib/format";
import { koboToNaira } from "@/lib/money";
import { CalendarDays, CheckCircle2, Clock3, MessageSquareText, Send, TrendingUp, Wallet } from "lucide-react";

const statusColors = {
  delivered: "#16A34A",
  pending: "#DC2626",
  failed: "#DC2626",
  queued: "#7C3AED",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const [wallet, contacts, groups, messagesThisWeek, statusGroups, recentCampaigns, transactions, recentContacts] = await Promise.all([
    prisma.wallet.findUnique({ where: { businessId: user.businessId } }),
    prisma.contact.count({ where: { businessId: user.businessId } }),
    prisma.contactGroup.count({ where: { businessId: user.businessId } }),
    prisma.message.findMany({
      where: { businessId: user.businessId, createdAt: { gte: weekStart, lte: weekEnd } },
      select: { createdAt: true, status: true, costKobo: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.message.groupBy({
      by: ["status"],
      where: { businessId: user.businessId, createdAt: { gte: weekStart, lte: weekEnd } },
      _count: { status: true },
    }),
    prisma.campaign.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.transaction.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.contact.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const deliveredThisWeek = messagesThisWeek.filter((message) => message.status === MessageStatus.DELIVERED).length;
  const sentThisWeek = messagesThisWeek.length;
  const deliveryRate = sentThisWeek === 0 ? 0 : Math.round((deliveredThisWeek / sentThisWeek) * 1000) / 10;
  const weekData = buildWeekData(weekStart, messagesThisWeek);
  const statusData = buildStatusData(statusGroups);
  const activity = buildActivity(transactions, recentContacts, recentCampaigns);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Real-time summary of your SMSFlow workspace using tenant-scoped database records."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text-secondary)]">
              <CalendarDays className="h-4 w-4" />
              <span>
                {weekStart.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} - {weekEnd.toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <Button asChild>
              <Link href="/messaging/send">
                <Send className="h-4 w-4" />
                Send SMS
              </Link>
            </Button>
          </div>
        }
      />
      <PageBody>
        <section className="app-panel rounded-2xl px-4 py-4 sm:px-5">
          <div className="grid gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<Wallet className="h-6 w-6" />} label="Wallet Balance" value={formatNaira(koboToNaira(wallet?.balanceKobo ?? 0))} context="Available verified balance" />
            <Metric icon={<MessageSquareText className="h-6 w-6" />} label="SMS Credits" value={`${formatNumber(wallet?.smsCredits ?? 0)} SMS`} context="Credits available for sending" />
            <Metric icon={<Send className="h-6 w-6" />} label="Sent This Week" value={formatNumber(sentThisWeek)} context={`${formatNumber(contacts)} contacts · ${formatNumber(groups)} groups`} />
            <Metric icon={<TrendingUp className="h-6 w-6" />} label="Delivery Rate" value={`${deliveryRate}%`} context={sentThisWeek ? `${formatNumber(deliveredThisWeek)} delivered this week` : "No sent messages yet"} last />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
          <div className="app-panel rounded-2xl p-5">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Messages Sent</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Monday to Sunday message volume.</p>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)]">This Week</span>
                <span className="rounded-lg border border-[var(--border)] px-3 py-2 text-[var(--text-secondary)]">Daily</span>
              </div>
            </div>
            <MessagesSentChart data={weekData} />
          </div>

          <div className="app-panel rounded-2xl p-5">
            <div className="mb-6">
              <h2 className="text-base font-semibold">Messages by Status</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Provider/database status distribution for the selected week.</p>
            </div>
            <StatusDonutChart data={statusData} />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.9fr)]">
          <div className="app-panel rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">Recent Campaigns</h2>
              <Link href="/messaging/campaigns" className="text-sm font-medium text-[var(--brand-hover)] hover:underline">View all</Link>
            </div>
            {recentCampaigns.length === 0 ? (
              <EmptyState title="No campaigns yet" description="Create your first campaign after adding contacts." />
            ) : (
              <div className="responsive-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Recipients</th>
                      <th>Sent</th>
                      <th>Delivered</th>
                      <th>Delivery Rate</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCampaigns.map((campaign) => {
                      const rate = campaign.sentCount ? Math.round((campaign.deliveredCount / campaign.sentCount) * 1000) / 10 : 0;
                      return (
                        <tr key={campaign.id}>
                          <td data-label="Campaign" className="font-medium">{campaign.name}</td>
                          <td data-label="Recipients" className="tabular">{formatNumber(campaign.recipientCount)}</td>
                          <td data-label="Sent" className="tabular">{formatNumber(campaign.sentCount)}</td>
                          <td data-label="Delivered" className="tabular">{formatNumber(campaign.deliveredCount)}</td>
                          <td data-label="Delivery Rate" className="tabular">{rate}%</td>
                          <td data-label="Status"><CampaignBadge status={campaign.status} /></td>
                          <td data-label="Date" className="text-[var(--text-secondary)]">{formatRelativeTime(campaign.createdAt.toISOString())}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="app-panel rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold">Recent Activity</h2>
              <Link href="/settings" className="text-sm font-medium text-[var(--brand-hover)] hover:underline">View settings</Link>
            </div>
            {activity.length === 0 ? (
              <EmptyState title="No activity yet" description="SMS, wallet, contact, and campaign activity will appear here as your workspace is used." />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {activity.map((item) => (
                  <div key={`${item.title}-${item.timestamp}`} className="flex gap-3 py-4">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium">{item.title}</p>
                        <time className="shrink-0 text-xs text-[var(--text-muted)]" dateTime={item.timestamp}>{formatRelativeTime(item.timestamp)}</time>
                      </div>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </PageBody>
    </>
  );
}

function Metric({ icon, label, value, context, last }: { icon: React.ReactNode; label: string; value: string; context: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-1 py-2 sm:px-5 ${last ? "" : "xl:border-r xl:border-[var(--border)]"}`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-subtle-border)] bg-[var(--brand-subtle)] text-[var(--brand-hover)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <p className="tabular mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{context}</p>
      </div>
    </div>
  );
}

function CampaignBadge({ status }: { status: CampaignStatus }) {
  const variants: Record<CampaignStatus, "neutral" | "brand" | "success" | "warning" | "error" | "info"> = {
    DRAFT: "neutral",
    SCHEDULED: "info",
    PROCESSING: "warning",
    SENT: "success",
    CANCELLED: "error",
    FAILED: "error",
  };
  return <Badge variant={variants[status]} dot>{status.toLowerCase()}</Badge>;
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function buildWeekData(weekStart: Date, messages: { createdAt: Date }[]) {
  return Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return {
      label: day.toLocaleDateString("en-NG", { weekday: "long" }),
      count: messages.filter((message) => message.createdAt.toDateString() === day.toDateString()).length,
    };
  });
}

function buildStatusData(groups: { status: MessageStatus; _count: { status: number } }[]) {
  const count = (statuses: MessageStatus[]) => groups.filter((group) => statuses.includes(group.status)).reduce((sum, group) => sum + group._count.status, 0);
  return [
    { label: "Delivered", count: count([MessageStatus.DELIVERED]), color: statusColors.delivered },
    { label: "Pending", count: count([MessageStatus.PENDING, MessageStatus.SENT]), color: statusColors.pending },
    { label: "Failed", count: count([MessageStatus.FAILED]), color: statusColors.failed },
    { label: "Queued", count: count([MessageStatus.QUEUED]), color: statusColors.queued },
  ];
}

function buildActivity(
  transactions: { description: string; amountKobo: number; type: TransactionType; createdAt: Date }[],
  contacts: { name: string; createdAt: Date }[],
  campaigns: { name: string; status: CampaignStatus; createdAt: Date }[]
) {
  return [
    ...transactions.map((transaction) => ({
      title: transaction.type === TransactionType.WALLET_FUNDING ? "Wallet funded" : transaction.amountKobo < 0 ? "SMS spend recorded" : "Wallet transaction",
      description: `${transaction.description} · ${formatNaira(koboToNaira(transaction.amountKobo), { showSign: true })}`,
      timestamp: transaction.createdAt.toISOString(),
      tone: transaction.amountKobo < 0 ? "bg-[var(--brand-subtle)] text-[var(--brand-hover)]" : "bg-[var(--success-subtle)] text-[var(--success)]",
      icon: transaction.amountKobo < 0 ? <MessageSquareText className="h-5 w-5" /> : <Wallet className="h-5 w-5" />,
    })),
    ...contacts.map((contact) => ({
      title: "Contact added",
      description: contact.name,
      timestamp: contact.createdAt.toISOString(),
      tone: "bg-[var(--info-subtle)] text-[var(--info)]",
      icon: <CheckCircle2 className="h-5 w-5" />,
    })),
    ...campaigns.map((campaign) => ({
      title: campaign.status === CampaignStatus.FAILED ? "Campaign failed" : "Campaign updated",
      description: `${campaign.name} · ${campaign.status.toLowerCase()}`,
      timestamp: campaign.createdAt.toISOString(),
      tone: campaign.status === CampaignStatus.FAILED ? "bg-[var(--error-subtle)] text-[var(--error)]" : "bg-[var(--warning-subtle)] text-[var(--warning)]",
      icon: <Clock3 className="h-5 w-5" />,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
}
