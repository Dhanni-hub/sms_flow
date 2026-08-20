import { startFundingAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { koboToNaira } from "@/lib/money";
import { getCostPerSegmentNgn, getPricing } from "@/lib/pricing_config";

export default async function WalletPage() {
  const user = await requireUser();
  const [wallet, transactions] = await Promise.all([
    prisma.wallet.findUnique({ where: { businessId: user.businessId } }),
    prisma.transaction.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const segmentPrice = getCostPerSegmentNgn(getPricing());
  return (
    <>
      <PageHeader title="Billing" description="Wallet balance, SMS credits, segment pricing, funding, and transaction history." />
      <PageBody>
        <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Billing sections">
          <a href="#wallet" className="shrink-0 rounded-lg border border-[var(--brand-subtle-border)] bg-[var(--brand-subtle)] px-3 py-2 text-sm font-medium text-[var(--brand-hover)]">Wallet</a>
          <a href="#funding" className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">Funding</a>
          <a href="#transactions" className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">Transactions</a>
          <a href="#pricing" className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">Pricing</a>
        </nav>
        <div id="wallet" className="grid scroll-mt-28 gap-4 sm:grid-cols-3">
          <Metric label="Balance" value={formatNaira(koboToNaira(wallet?.balanceKobo ?? 0))} />
          <Metric label="SMS credits" value={`${wallet?.smsCredits ?? 0}`} />
          <Metric label="Segment price" value={formatNaira(segmentPrice)} />
        </div>
        <section id="funding" className="scroll-mt-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="font-semibold">Fund wallet</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Payment provider credentials are required before funding can start.</p>
          <ActionForm action={startFundingAction} submitLabel="Start payment" className="mt-4 max-w-sm space-y-3">
            <input type="hidden" name="amount" value="5000" />
          </ActionForm>
        </section>
        <section id="transactions" className="scroll-mt-28 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-3 font-semibold">Transactions</div>
          {transactions.length === 0 ? <div className="p-4"><EmptyState title="No wallet activity" description="Funding, charges, and refunds will appear here." /></div> : <TransactionTable transactions={transactions} />}
        </section>
        <section id="pricing" className="scroll-mt-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="font-semibold">Pricing</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Current SMS segment price is {formatNaira(segmentPrice)}. Final charges are calculated server-side from real segment counts and recipient totals.</p>
        </section>
      </PageBody>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-sm text-[var(--text-secondary)]">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value}</p></div>;
}

function TransactionTable({ transactions }: { transactions: Array<{ id: string; description: string; amountKobo: number; status: string; reference: string; createdAt: Date }> }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm"><tbody className="divide-y divide-[var(--border)]">{transactions.map((t) => <tr key={t.id}><td className="p-3">{t.description}<div className="text-xs text-[var(--text-muted)]">{t.reference} · {t.status.toLowerCase()}</div></td><td className={`p-3 text-right font-mono font-semibold ${t.amountKobo < 0 ? "text-[var(--error)]" : "text-[var(--success)]"}`}>{formatNaira(koboToNaira(t.amountKobo), { showSign: true })}</td><td className="p-3 text-right text-[var(--text-muted)]">{t.createdAt.toLocaleString("en-NG")}</td></tr>)}</tbody></table></div>;
}
