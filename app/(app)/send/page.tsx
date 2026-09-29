import { sendSmsAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { MessagingTabs } from "@/components/messaging-tabs";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { estimateCost } from "@/lib/pricing_config";
import { calculateSmsSegments } from "@/lib/sms_segments";

export default async function SendPage() {
  const user = await requireUser();
  const [templates, wallet, contacts] = await Promise.all([
    prisma.template.findMany({ where: { businessId: user.businessId }, orderBy: { name: "asc" } }),
    prisma.wallet.findUnique({ where: { businessId: user.businessId } }),
    prisma.contact.findMany({ where: { businessId: user.businessId }, select: { id: true, name: true, phone: true }, orderBy: { name: "asc" } }),
  ]);
  const preview = calculateSmsSegments("");
  const senderName = user.business.senderName
    ? user.business.senderName
    : (user.business.name ?? "SMSFLOW").replace(/[^A-Za-z0-9]/g, "").slice(0, 11).toUpperCase() || "SMSFLOW";

  return (
    <>
      <PageHeader title="Send SMS" description="Send through the configured provider. If no provider is configured, the operation fails without creating a fake success." />
      <PageBody>
        <MessagingTabs active="/messaging/send" />
        {contacts.length === 0 ? <EmptyState title="No contacts available" description="Add a contact before sending an SMS." /> : <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <ActionForm action={sendSmsAction} submitLabel="Confirm and send" className="space-y-4">
                <div>
                  <Label htmlFor="recipientPhone">Saved contact</Label>
                  <select id="recipientPhone" name="recipientPhone" required className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-sm">
                    <option value="">Select a saved contact</option>
                    {contacts.map((contact) => <option key={contact.id} value={contact.phone}>{contact.name} · {contact.phone}</option>)}
                  </select>
                </div>
                <div><Label htmlFor="body">Message</Label><textarea id="body" name="body" rows={8} required className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm" /></div>
              </ActionForm>
            </div>
            <aside className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-semibold">Send requirements</h2>
              <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
                <p>Sender name: {senderName}</p>
                <p>Wallet balance: {formatNaira((wallet?.balanceKobo ?? 0) / 100)}</p>
                <p>Current preview defaults to {preview.encoding}; message cost is calculated on submission server-side.</p>
                <p>One segment currently costs {formatNaira(estimateCost(1))}.</p>
                <p>Your first outbound message is free. Billing starts from the second message.</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {templates.length === 0 ? <Badge>No templates yet</Badge> : templates.map((template) => <Badge key={template.id} variant="brand">{template.name}</Badge>)}
              </div>
            </aside>
          </section>}
      </PageBody>
    </>
  );
}
