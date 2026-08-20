import { createGroupAction, deleteGroupAction, updateGroupAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function GroupsPage() {
  const user = await requireUser();
  const groups = await prisma.contactGroup.findMany({ where: { businessId: user.businessId }, include: { _count: { select: { members: true } } }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Groups" description="Organize contacts for bulk SMS campaigns." />
      <PageBody>
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="font-semibold">Create group</h2>
            <ActionForm action={createGroupAction} submitLabel="Create group" className="mt-4 space-y-3">
              <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
              <div><Label htmlFor="description">Description</Label><Input id="description" name="description" /></div>
            </ActionForm>
          </div>
          {groups.length === 0 ? <EmptyState title="No groups yet" description="Create groups to target campaign recipients." /> : (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between gap-4 p-4">
                  <form id={`group-${group.id}`} action={updateGroupAction} className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={group.id} />
                    <Input name="name" defaultValue={group.name} aria-label="Group name" required />
                    <Input name="description" defaultValue={group.description ?? ""} aria-label="Group description" />
                    <p className="text-sm text-[var(--text-secondary)] sm:col-span-2">{group._count.members} members</p>
                  </form>
                  <div className="flex gap-2">
                    <Button form={`group-${group.id}`} type="submit" variant="secondary" size="sm">Save</Button>
                    <form action={deleteGroupAction}><input type="hidden" name="id" value={group.id} /><ConfirmSubmitButton message={`Delete group ${group.name}?`} variant="destructive" size="sm">Delete</ConfirmSubmitButton></form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageBody>
    </>
  );
}
