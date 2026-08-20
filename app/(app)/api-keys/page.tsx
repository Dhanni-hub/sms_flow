import { createApiKeyAction, revokeApiKeyAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ApiKeysPage() {
  const user = await requireUser();
  const apiKeys = await prisma.apiKey.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader title="API Keys" description="Create and revoke hashed API credentials for server-to-server SMSFlow access." />
      <PageBody>
        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="app-panel rounded-2xl p-5">
            <h2 className="font-semibold">Create API key</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">The full secret is shown only once after creation. Stored keys are hashed.</p>
            <ActionForm action={createApiKeyAction} submitLabel="Create key" className="mt-5 space-y-4">
              <div><Label htmlFor="label">Label</Label><Input id="label" name="label" placeholder="Production backend" required /></div>
            </ActionForm>
          </div>
          <div className="app-panel rounded-2xl p-5">
            <h2 className="font-semibold">Keys</h2>
            {apiKeys.length === 0 ? <div className="mt-4"><EmptyState title="No API keys" description="Create an API key when you are ready to integrate from your backend." /></div> : (
              <div className="mt-4 divide-y divide-[var(--border)]">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{key.label}</p>
                      <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">{key.keyPreview} · {key.revokedAt ? "revoked" : "active"} · {key.createdAt.toLocaleString("en-NG")}</p>
                    </div>
                    {!key.revokedAt && (
                      <form action={revokeApiKeyAction}>
                        <input type="hidden" name="id" value={key.id} />
                        <ConfirmSubmitButton message={`Revoke ${key.label}?`} variant="destructive" size="sm">Revoke</ConfirmSubmitButton>
                      </form>
                    )}
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
