import { sendSmsAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { MessagingTabs } from "@/components/messaging-tabs";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { estimateCost } from "@/lib/pricing_config";
import { calculateSmsSegments } from "@/lib/sms_segments";

export default async function SendPage() {
  const user = await requireUser();
  const [senderIds, templates, wallet] = await Promise.all([
    prisma.senderId.findMany({ where: { businessId: user.businessId, status: "APPROVED" }, orderBy: { name: "asc" } }),
    prisma.template.findMany({ where: { businessId: user.businessId }, orderBy: { name: "asc" } }),
    prisma.wallet.findUnique({ where: { businessId: user.businessId } }),
  ]);
  const preview = calculateSmsSegments("");

  return (
    <>
      <PageHeader title="Send SMS" description="Send through the configured provider. If no provider is configured, the operation fails without creating a fake success." />
      <PageBody>
        <MessagingTabs active="/messaging/send" />
        {senderIds.length === 0 ? <EmptyState title="No approved sender ID" description="Request a sender ID and wait for approval before sending SMS." /> : (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <ActionForm action={sendSmsAction} submitLabel="Confirm and send" className="space-y-4">
                <div>
                  <Label htmlFor="senderId">Sender ID</Label>
                  <select id="senderId" name="senderId" required className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm">
                    {senderIds.map((sender) => <option key={sender.id} value={sender.id}>{sender.name}</option>)}
                  </select>
                </div>
                <div><Label htmlFor="recipientPhone">Recipient</Label><Input id="recipientPhone" name="recipientPhone" placeholder="+2348010000000" required /></div>
                <div><Label htmlFor="body">Message</Label><textarea id="body" name="body" rows={8} required className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm" /></div>
              </ActionForm>
            </div>
            <aside className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-semibold">Send requirements</h2>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                <p>Wallet balance: {formatNaira((wallet?.balanceKobo ?? 0) / 100)}</p>
                <p>Current preview defaults to {preview.encoding}; message cost is calculated on submission server-side.</p>
                <p>One segment currently costs {formatNaira(estimateCost(1))}.</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {templates.length === 0 ? <Badge>No templates yet</Badge> : templates.map((template) => <Badge key={template.id} variant="brand">{template.name}</Badge>)}
              </div>
            </aside>
          </section>
        )}
      </PageBody>
    </>
  );
}
