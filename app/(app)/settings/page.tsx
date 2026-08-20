import { createApiKeyAction, createWebhookAction, deleteWebhookAction, markNotificationReadAction, revokeApiKeyAction, updateBusinessSettingsAction, updateProfileAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { SectionTabs } from "@/components/section-tabs";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const settingsTabs = [
  { href: "#general", label: "General" },
  { href: "#profile", label: "Profile" },
  { href: "#notifications", label: "Notifications" },
  { href: "#integrations", label: "Integrations" },
  { href: "#api-keys", label: "API Keys" },
  { href: "#security", label: "Security" },
  { href: "#appearance", label: "Appearance" },
];

export default async function SettingsPage() {
  const user = await requireUser();
  const [notifications, webhooks, apiKeys] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.webhook.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } }),
    prisma.apiKey.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader title="Settings" description="Account, business, integrations, API access, notifications, and security in one place." />
      <PageBody>
        <SectionTabs items={settingsTabs} active="#general" />

        <section id="general" className="app-panel scroll-mt-28 rounded-2xl p-5">
          <h2 className="font-semibold">General</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Business profile used across SMSFlow.</p>
          <ActionForm action={updateBusinessSettingsAction} submitLabel="Save business" className="mt-5 max-w-xl space-y-4">
            <div><Label htmlFor="businessName">Business name</Label><Input id="businessName" name="businessName" defaultValue={user.business.name} required /></div>
          </ActionForm>
        </section>

        <section id="profile" className="app-panel scroll-mt-28 rounded-2xl p-5">
          <h2 className="font-semibold">Profile</h2>
          <ActionForm action={updateProfileAction} submitLabel="Save profile" className="mt-5 max-w-xl space-y-4">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={user.name} required /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" value={user.email} readOnly disabled /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={user.phone ?? ""} /></div>
          </ActionForm>
        </section>

        <section id="notifications" className="app-panel scroll-mt-28 rounded-2xl p-5">
          <h2 className="font-semibold">Notifications</h2>
          {notifications.length === 0 ? <div className="mt-4"><EmptyState title="No notifications" description="Campaign, billing, sender ID, and import events will appear here." /></div> : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{notification.body}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{notification.createdAt.toLocaleString("en-NG")} · {notification.readAt ? "read" : "unread"}</p>
                  </div>
                  {!notification.readAt && <form action={markNotificationReadAction}><input type="hidden" name="id" value={notification.id} /><ConfirmSubmitButton message="Mark this notification as read?" variant="secondary" size="sm">Mark read</ConfirmSubmitButton></form>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="integrations" className="app-panel scroll-mt-28 rounded-2xl p-5">
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div>
              <h2 className="font-semibold">Integrations</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Create webhook endpoints for delivery, payment, and sender ID events.</p>
              <ActionForm action={createWebhookAction} submitLabel="Create webhook" className="mt-5 space-y-4">
                <div><Label htmlFor="url">Endpoint URL</Label><Input id="url" name="url" placeholder="https://example.com/webhooks/smsflow" required /></div>
                <div className="grid gap-2 text-sm text-[var(--text-secondary)]">
                  {["message.delivered", "message.failed", "payment.successful", "sender_id.reviewed"].map((event) => (
                    <label key={event} className="flex min-h-10 items-center gap-2"><input type="checkbox" name="events" value={event} /> {event}</label>
                  ))}
                </div>
              </ActionForm>
            </div>
            <div>
              <h3 className="font-medium">Webhook endpoints</h3>
              {webhooks.length === 0 ? <p className="mt-3 text-sm text-[var(--text-muted)]">No webhooks configured.</p> : (
                <div className="mt-3 divide-y divide-[var(--border)]">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0"><p className="truncate font-medium">{webhook.url}</p><p className="text-xs text-[var(--text-muted)]">{webhook.enabled ? "enabled" : "disabled"}</p></div>
                      <form action={deleteWebhookAction}><input type="hidden" name="id" value={webhook.id} /><ConfirmSubmitButton message="Delete webhook?" variant="destructive" size="sm">Delete</ConfirmSubmitButton></form>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="api-keys" className="app-panel scroll-mt-28 rounded-2xl p-5">
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div>
              <h2 className="font-semibold">API Keys</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Secrets are hashed and only displayed once on creation.</p>
              <ActionForm action={createApiKeyAction} submitLabel="Create key" className="mt-5 space-y-4">
                <div><Label htmlFor="label">Label</Label><Input id="label" name="label" placeholder="Production backend" required /></div>
              </ActionForm>
            </div>
            <div>
              <h3 className="font-medium">Keys</h3>
              {apiKeys.length === 0 ? <p className="mt-3 text-sm text-[var(--text-muted)]">No API keys created.</p> : (
                <div className="mt-3 divide-y divide-[var(--border)]">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><p className="font-medium">{key.label}</p><p className="font-mono text-xs text-[var(--text-muted)]">{key.keyPreview} · {key.revokedAt ? "revoked" : "active"}</p></div>
                      {!key.revokedAt && <form action={revokeApiKeyAction}><input type="hidden" name="id" value={key.id} /><ConfirmSubmitButton message={`Revoke ${key.label}?`} variant="destructive" size="sm">Revoke</ConfirmSubmitButton></form>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="security" className="app-panel scroll-mt-28 rounded-2xl p-5">
          <h2 className="font-semibold">Security</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Authentication uses server-backed sessions. Provider credentials, payment secrets, and API key hashes remain server-side and are not exposed in client components.</p>
          <Button asChild variant="secondary" className="mt-4"><a href="/forgot-password">Reset password</a></Button>
        </section>

        <section id="appearance" className="app-panel scroll-mt-28 rounded-2xl p-5">
          <h2 className="font-semibold">Appearance</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Use the theme button in the top bar to switch between light and dark modes. Your choice is persisted by the application theme provider.</p>
        </section>
      </PageBody>
    </>
  );
}
