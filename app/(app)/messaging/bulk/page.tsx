import { BulkSmsForm } from "@/components/bulk-sms-form";
import { MessagingTabs } from "@/components/messaging-tabs";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BulkMessagingPage() {
  const user = await requireUser();
  const [contacts, groups, wallet] = await Promise.all([
    prisma.contact.findMany({ where: { businessId: user.businessId }, select: { id: true, name: true, phone: true }, orderBy: { name: "asc" }, take: 250 }),
    prisma.contactGroup.findMany({ where: { businessId: user.businessId }, select: { id: true, name: true, _count: { select: { members: true } } }, orderBy: { name: "asc" } }),
    prisma.wallet.findUnique({ where: { businessId: user.businessId }, select: { freeMessageUsed: true } }),
  ]);

  return (
    <>
      <PageHeader title="Bulk SMS" description="Send one message to many real contacts through the configured SMS provider." />
      <PageBody>
        <MessagingTabs active="/messaging/bulk" />
        {contacts.length === 0 ? (
          <EmptyState title="No contacts available" description="Add or import contacts before creating a bulk SMS campaign." />
        ) : (
          <BulkSmsForm
            contacts={contacts}
            groups={groups.map((group) => ({ id: group.id, name: group.name, count: group._count.members }))}
            freeMessageUsed={wallet?.freeMessageUsed ?? false}
          />
        )}
      </PageBody>
    </>
  );
}
