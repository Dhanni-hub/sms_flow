import { createWebhookAction, deleteWebhookAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function IntegrationsPage() {
  const user = await requireUser();
  const webhooks = await prisma.webhook.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader title="Integrations" description="Connect SMSFlow to external systems through secure webhook endpoints." />
      <PageBody>
        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="app-panel rounded-2xl p-5">
            <h2 className="font-semibold">Create webhook</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Webhook secrets are hashed and events are delivered server-side.</p>
            <ActionForm action={createWebhookAction} submitLabel="Create webhook" className="mt-5 space-y-4">
              <div><Label htmlFor="url">Endpoint URL</Label><Input id="url" name="url" placeholder="https://example.com/webhooks/smsflow" required /></div>
              <div className="grid gap-2 text-sm text-[var(--text-secondary)]">
                {["message.delivered", "message.failed", "payment.successful", "sender_id.reviewed"].map((event) => (
                  <label key={event} className="flex min-h-10 items-center gap-2"><input type="checkbox" name="events" value={event} /> {event}</label>
                ))}
              </div>
            </ActionForm>
          </div>
          <div className="app-panel rounded-2xl p-5">
            <h2 className="font-semibold">Webhook endpoints</h2>
            {webhooks.length === 0 ? <div className="mt-4"><EmptyState title="No integrations yet" description="Add a webhook endpoint to receive SMSFlow events." /></div> : (
              <div className="mt-4 divide-y divide-[var(--border)]">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{webhook.url}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{webhook.enabled ? "enabled" : "disabled"} · {webhook.createdAt.toLocaleString("en-NG")}</p>
                    </div>
                    <form action={deleteWebhookAction}>
                      <input type="hidden" name="id" value={webhook.id} />
                      <ConfirmSubmitButton message="Delete webhook?" variant="destructive" size="sm">Delete</ConfirmSubmitButton>
                    </form>
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
