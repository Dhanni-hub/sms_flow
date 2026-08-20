import { createApiKeyAction, createWebhookAction, deleteWebhookAction, revokeApiKeyAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DeveloperPage() {
  const user = await requireUser();
  const [apiKeys, webhooks, logs] = await Promise.all([
    prisma.apiKey.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } }),
    prisma.webhook.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } }),
    prisma.message.findMany({ where: { businessId: user.businessId, providerMessageId: { not: null } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <>
      <PageHeader title="Developer" description="Manage API keys, webhook endpoints, and provider request history." />
      <PageBody>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="font-semibold">Create API key</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Secrets are hashed in the database and only shown once.</p>
            <ActionForm action={createApiKeyAction} submitLabel="Create key" className="mt-4 space-y-3">
              <div><Label htmlFor="label">Label</Label><Input id="label" name="label" placeholder="Production" required /></div>
            </ActionForm>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="font-semibold">Create webhook</h2>
            <ActionForm action={createWebhookAction} submitLabel="Create webhook" className="mt-4 space-y-3">
              <div><Label htmlFor="url">URL</Label><Input id="url" name="url" placeholder="https://example.com/webhooks/smsflow" required /></div>
              {["message.delivered", "message.failed", "payment.successful", "sender_id.reviewed"].map((event) => (
                <label key={event} className="block text-sm"><input type="checkbox" name="events" value={event} /> {event}</label>
              ))}
            </ActionForm>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-3 font-semibold">API keys</div>
          {apiKeys.length === 0 ? <div className="p-4"><EmptyState title="No API keys" description="Create an API key for server-to-server integration." /></div> : (
            <div className="divide-y divide-[var(--border)]">{apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between gap-4 p-4">
                <div><p className="font-medium">{key.label}</p><p className="font-mono text-xs text-[var(--text-muted)]">{key.keyPreview} · {key.revokedAt ? "revoked" : "active"}</p></div>
                {!key.revokedAt && <form action={revokeApiKeyAction}><input type="hidden" name="id" value={key.id} /><ConfirmSubmitButton message={`Revoke ${key.label}?`} variant="destructive" size="sm">Revoke</ConfirmSubmitButton></form>}
              </div>
            ))}</div>
          )}
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] p-3 font-semibold">Webhooks</div>
          {webhooks.length === 0 ? <div className="p-4"><EmptyState title="No webhooks" description="Add endpoints to receive SMSFlow events." /></div> : (
            <div className="divide-y divide-[var(--border)]">{webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between gap-4 p-4">
                <div><p className="font-medium">{webhook.url}</p><p className="text-xs text-[var(--text-muted)]">{webhook.enabled ? "enabled" : "disabled"}</p></div>
                <form action={deleteWebhookAction}><input type="hidden" name="id" value={webhook.id} /><ConfirmSubmitButton message="Delete webhook?" variant="destructive" size="sm">Delete</ConfirmSubmitButton></form>
              </div>
            ))}</div>
          )}
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="font-semibold">API usage and request history</h2>
          {logs.length === 0 ? <p className="mt-2 text-sm text-[var(--text-secondary)]">No provider-backed API activity yet.</p> : logs.map((log) => <p key={log.id} className="mt-2 text-sm">{log.providerMessageId} · {log.providerStatus}</p>)}
          <Button asChild variant="secondary" className="mt-4"><a href="/messages">View message records</a></Button>
        </section>
      </PageBody>
    </>
  );
}
