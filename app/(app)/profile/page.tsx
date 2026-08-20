import { updateProfileAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { PageBody, PageHeader } from "@/components/page";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Profile" description="Manage your account profile." />
      <PageBody>
        <section className="max-w-xl rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <ActionForm action={updateProfileAction} submitLabel="Save profile" className="space-y-3">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={user.name} required /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" name="email" defaultValue={user.email} disabled /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" defaultValue={user.phone ?? ""} /></div>
          </ActionForm>
        </section>
      </PageBody>
    </>
  );
}
