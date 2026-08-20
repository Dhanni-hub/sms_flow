import { markNotificationReadAction } from "@/app/actions/resources";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { EmptyState, PageBody, PageHeader } from "@/components/page";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <>
      <PageHeader title="Notifications" description="Persisted account and delivery events." />
      <PageBody>
        {notifications.length === 0 ? <EmptyState title="No notifications" description="Campaign, billing, sender ID, and import events will appear here." /> : (
          <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-start justify-between gap-4 p-4">
                <div><p className="font-medium">{notification.title}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{notification.body}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{notification.createdAt.toLocaleString("en-NG")} · {notification.readAt ? "read" : "unread"}</p></div>
                {!notification.readAt && <form action={markNotificationReadAction}><input type="hidden" name="id" value={notification.id} /><ConfirmSubmitButton message="Mark this notification as read?" variant="secondary" size="sm">Mark read</ConfirmSubmitButton></form>}
              </div>
            ))}
          </section>
        )}
      </PageBody>
    </>
  );
}
