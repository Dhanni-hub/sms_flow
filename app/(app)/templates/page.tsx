import { createTemplateAction, deleteTemplateAction, updateTemplateAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MessagingTabs } from "@/components/messaging-tabs";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function TemplatesPage() {
  const user = await requireUser();
  const templates = await prisma.template.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Templates" description="Reusable SMS copy with variables such as {{name}}, {{order}}, {{amount}}, and {{date}}." />
      <PageBody>
        <MessagingTabs active="/messaging/templates" />
        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="font-semibold">Create template</h2>
            <ActionForm action={createTemplateAction} submitLabel="Create template" className="mt-4 space-y-3">
              <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
              <div><Label htmlFor="body">Body</Label><textarea id="body" name="body" rows={6} required className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm" /></div>
            </ActionForm>
          </div>
          {templates.length === 0 ? <EmptyState title="No templates yet" description="Create templates to speed up repeat messages." /> : (
            <div className="space-y-3">
              {templates.map((template) => (
                <article key={template.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <form id={`template-${template.id}`} action={updateTemplateAction} className="grid flex-1 gap-2">
                      <input type="hidden" name="id" value={template.id} />
                      <Input name="name" defaultValue={template.name} aria-label="Template name" required />
                      <textarea name="body" defaultValue={template.body} rows={4} required className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm" />
                    </form>
                    <div className="flex gap-2">
                      <Button form={`template-${template.id}`} type="submit" variant="secondary" size="sm">Save</Button>
                      <form action={deleteTemplateAction}><input type="hidden" name="id" value={template.id} /><ConfirmSubmitButton message={`Delete template ${template.name}?`} variant="destructive" size="sm">Delete</ConfirmSubmitButton></form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}
