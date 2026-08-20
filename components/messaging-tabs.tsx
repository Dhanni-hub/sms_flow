import { SectionTabs } from "@/components/section-tabs";

export const messagingTabs = [
  { href: "/messaging/send", label: "Send SMS" },
  { href: "/messaging/bulk", label: "Bulk SMS" },
  { href: "/messaging/campaigns", label: "Campaigns" },
  { href: "/messaging/history", label: "History" },
  { href: "/messaging/templates", label: "Templates" },
];

export function MessagingTabs({ active }: { active: string }) {
  return <SectionTabs items={messagingTabs} active={active} />;
}
