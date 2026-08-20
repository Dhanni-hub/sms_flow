import { requestSenderIdAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SenderIdsPage() {
  const user = await requireUser();
  const senderIds = await prisma.senderId.findMany({ where: { businessId: user.businessId }, orderBy: { submittedAt: "desc" } });
  return (
    <>
      <PageHeader title="Sender IDs" description="Request and track branded sender IDs." />
      <PageBody>
        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="font-semibold">Request sender ID</h2>
            <ActionForm action={requestSenderIdAction} submitLabel="Submit request" className="mt-4 space-y-3">
              <div><Label htmlFor="name">Sender ID</Label><Input id="name" name="name" maxLength={11} required /></div>
              <div><Label htmlFor="industry">Industry</Label><Input id="industry" name="industry" /></div>
              <div><Label htmlFor="website">Website</Label><Input id="website" name="website" placeholder="https://example.com" /></div>
              <div><Label htmlFor="useCase">Use case</Label><textarea id="useCase" name="useCase" rows={4} required className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm" /></div>
            </ActionForm>
          </div>
          {senderIds.length === 0 ? <EmptyState title="No sender IDs yet" description="Request a sender ID before sending branded SMS." /> : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
              {senderIds.map((sender) => (
                <div key={sender.id} className="p-4">
                  <div className="flex items-center justify-between gap-4"><p className="font-mono font-semibold">{sender.name}</p><span className="rounded-md border border-[var(--border)] px-2 py-1 text-xs">{sender.status.toLowerCase()}</span></div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{sender.useCase}</p>
                  {sender.rejectionReason && <p className="mt-2 text-sm text-[var(--error)]">{sender.rejectionReason}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}
