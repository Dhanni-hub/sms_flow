import { createContactAction, createGroupAction, deleteContactAction, deleteGroupAction, importContactsCsvAction, saveContactAction, updateGroupAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPhoneDisplay } from "@/lib/format";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const q = params.q ?? "";
  const page = Math.max(1, Number(params.page ?? 1));
  const take = 10;
  const where = { businessId: user.businessId, ...(q ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] } : {}) };
  const [contacts, total, groups] = await Promise.all([
    prisma.contact.findMany({ where, include: { groups: { include: { group: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * take, take }),
    prisma.contact.count({ where }),
    prisma.contactGroup.findMany({ where: { businessId: user.businessId }, include: { _count: { select: { members: true } } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Contacts" description="Create, search, import, and manage tenant-scoped contacts." />
      <PageBody>
        <nav className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Contacts sections">
          <a href="#contacts" className="shrink-0 rounded-lg border border-[var(--brand-subtle-border)] bg-[var(--brand-subtle)] px-3 py-2 text-sm font-medium text-[var(--brand-hover)]">All contacts</a>
          <a href="#groups" className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">Groups</a>
          <a href="#import" className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">Import</a>
        </nav>
        <section id="contacts" className="grid scroll-mt-28 gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-semibold">Add contact</h2>
              <ActionForm action={createContactAction} submitLabel="Create contact" className="mt-4 space-y-3">
                <Field name="name" label="Name" required />
                <Field name="phone" label="Phone" required />
                <Field name="email" label="Email" type="email" />
                <Field name="tags" label="Tags" placeholder="vip, wholesale" />
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="groupIds" value={group.id} />{group.name}</label>
                ))}
              </ActionForm>
            </div>
            <div id="import" className="scroll-mt-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h2 className="font-semibold">Import CSV</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">CSV must include `name` and `phone` columns. Duplicate/invalid rows are skipped and reported.</p>
              <ActionForm action={importContactsCsvAction} submitLabel="Import contacts" className="mt-4 space-y-3">
                <Input name="file" type="file" accept=".csv,text/csv" required />
              </ActionForm>
            </div>
          </div>
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <form className="flex gap-2 border-b border-[var(--border)] p-3">
              <Input name="q" placeholder="Search contacts" defaultValue={q} />
              <Button type="submit">Search</Button>
            </form>
            {contacts.length === 0 ? (
              <div className="p-4"><EmptyState title="No contacts yet" description="Add or import contacts to start sending SMS." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-sunken)] text-left text-[var(--text-secondary)]"><tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Groups</th><th className="p-3 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td className="p-3">
                          <form id={`contact-${contact.id}`} action={saveContactAction} className="grid gap-2">
                            <input type="hidden" name="id" value={contact.id} />
                            <Input name="name" defaultValue={contact.name} aria-label="Contact name" required />
                            <Input name="email" defaultValue={contact.email ?? ""} aria-label="Contact email" />
                          </form>
                        </td>
                        <td className="p-3"><Input form={`contact-${contact.id}`} name="phone" defaultValue={formatPhoneDisplay(contact.phone)} aria-label="Contact phone" required /></td>
                        <td className="p-3 text-sm">{contact.groups.map(({ group }) => group.name).join(", ") || "None"}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button form={`contact-${contact.id}`} type="submit" variant="secondary" size="sm">Save</Button>
                            <form action={deleteContactAction}>
                              <input type="hidden" name="id" value={contact.id} />
                              <ConfirmSubmitButton message={`Delete ${contact.name}?`} variant="destructive" size="sm">Delete</ConfirmSubmitButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]">
              <span>{total} contacts</span>
              <div className="flex gap-2">
                <Button asChild variant="secondary" size="sm"><a href={`/contacts?q=${encodeURIComponent(q)}&page=${Math.max(1, page - 1)}`}>Previous</a></Button>
                <Button asChild variant="secondary" size="sm"><a href={`/contacts?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</a></Button>
              </div>
            </div>
          </section>
        </section>
        <section id="groups" className="scroll-mt-28 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div>
              <h2 className="font-semibold">Create group</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Groups power targeted and bulk SMS sends.</p>
              <ActionForm action={createGroupAction} submitLabel="Create group" className="mt-4 space-y-3">
                <div><Label htmlFor="groupName">Name</Label><Input id="groupName" name="name" required /></div>
                <div><Label htmlFor="groupDescription">Description</Label><Input id="groupDescription" name="description" /></div>
              </ActionForm>
            </div>
            {groups.length === 0 ? (
              <EmptyState title="No groups yet" description="Create groups to target campaign recipients." />
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {groups.map((group) => (
                  <div key={group.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
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
          </div>
        </section>
      </PageBody>
    </>
  );
}

function Field({ name, label, type = "text", required, placeholder }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }) {
  return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required={required} placeholder={placeholder} /></div>;
}
