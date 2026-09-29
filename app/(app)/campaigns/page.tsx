import { cancelCampaignAction, createCampaignAction, deleteCampaignAction } from "@/app/actions/resources";
import { ActionForm } from "@/components/action-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MessagingTabs } from "@/components/messaging-tabs";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { Input, Label } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { koboToNaira } from "@/lib/money";

export default async function CampaignsPage() {
  const user = await requireUser();
  const [campaigns, groups, contacts] = await Promise.all([
    prisma.campaign.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: "desc" } }),
    prisma.contactGroup.findMany({ where: { businessId: user.businessId }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({ where: { businessId: user.businessId }, orderBy: { name: "asc" }, take: 100 }),
  ]);
  return (
    <>
      <PageHeader title="Campaigns" description="Create drafts, schedule recipient batches, and track performance." />
      <PageBody>
        <MessagingTabs active="/messaging/campaigns" />
        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="font-semibold">Create campaign</h2>
            <ActionForm action={createCampaignAction} submitLabel="Create campaign" className="mt-4 space-y-3">
              <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
              <div><Label htmlFor="body">Message</Label><textarea id="body" name="body" rows={5} required className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-sm" /></div>
              <div className="space-y-2">{groups.map((group) => <label key={group.id} className="block text-sm"><input type="checkbox" name="groupIds" value={group.id} /> {group.name}</label>)}</div>
              <div className="space-y-2">{contacts.slice(0, 10).map((contact) => <label key={contact.id} className="block text-sm"><input type="checkbox" name="contactIds" value={contact.id} /> {contact.name}</label>)}</div>
              <div><Label htmlFor="scheduledFor">Schedule for</Label><Input id="scheduledFor" name="scheduledFor" type="datetime-local" /></div>
            </ActionForm>
          </div>
          {campaigns.length === 0 ? <EmptyState title="No campaigns yet" description="Create a campaign after adding recipients." /> : (
            <div className="space-y-3">{campaigns.map((campaign) => <article key={campaign.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><div className="flex justify-between gap-4"><div><h2 className="font-semibold">{campaign.name}</h2><p className="text-sm text-[var(--text-secondary)]">{campaign.status.toLowerCase()} · {campaign.recipientCount} recipients · {formatNaira(koboToNaira(campaign.totalCostKobo))}</p></div><div className="flex gap-2"><form action={cancelCampaignAction}><input type="hidden" name="id" value={campaign.id} /><ConfirmSubmitButton message={`Cancel campaign ${campaign.name}?`} variant="secondary" size="sm">Cancel</ConfirmSubmitButton></form><form action={deleteCampaignAction}><input type="hidden" name="id" value={campaign.id} /><ConfirmSubmitButton message={`Delete campaign ${campaign.name}?`} variant="destructive" size="sm">Delete</ConfirmSubmitButton></form></div></div></article>)}</div>
          )}
        </section>
      </PageBody>
    </>
  );
}
