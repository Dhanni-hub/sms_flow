import { CheckCircle2, Clock, XCircle, ArrowUpRight, Loader2, Ban, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  MessageStatus,
  TransactionStatus,
  SenderIdStatus,
  CampaignStatus,
} from "@/types";

// Every status badge shows BOTH an icon and text — never color alone —
// per the accessibility requirement that status can't rely on color.

const messageStatusMap: Record<MessageStatus, { variant: "success" | "warning" | "error" | "info" | "neutral"; icon: React.ElementType; label: string }> = {
  delivered: { variant: "success", icon: CheckCircle2, label: "Delivered" },
  sent: { variant: "info", icon: ArrowUpRight, label: "Sent" },
  pending: { variant: "warning", icon: Clock, label: "Pending" },
  queued: { variant: "neutral", icon: Clock, label: "Queued" },
  failed: { variant: "error", icon: AlertTriangle, label: "Failed" },
};

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  const cfg = messageStatusMap[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {cfg.label}
    </Badge>
  );
}

const transactionStatusMap: Record<TransactionStatus, { variant: "success" | "warning" | "error" | "neutral"; icon: React.ElementType; label: string }> = {
  successful: { variant: "success", icon: CheckCircle2, label: "Successful" },
  pending: { variant: "warning", icon: Loader2, label: "Processing" },
  failed: { variant: "error", icon: XCircle, label: "Failed" },
  cancelled: { variant: "neutral", icon: Ban, label: "Cancelled" },
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const cfg = transactionStatusMap[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className={`h-3 w-3 ${status === "pending" ? "animate-spin" : ""}`} strokeWidth={2.5} />
      {cfg.label}
    </Badge>
  );
}

const senderIdStatusMap: Record<SenderIdStatus, { variant: "success" | "warning" | "error"; icon: React.ElementType; label: string }> = {
  approved: { variant: "success", icon: CheckCircle2, label: "Approved" },
  pending: { variant: "warning", icon: Clock, label: "Pending review" },
  rejected: { variant: "error", icon: XCircle, label: "Rejected" },
};

export function SenderIdStatusBadge({ status }: { status: SenderIdStatus }) {
  const cfg = senderIdStatusMap[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {cfg.label}
    </Badge>
  );
}

const campaignStatusMap: Record<CampaignStatus, { variant: "success" | "warning" | "error" | "info" | "neutral"; icon: React.ElementType; label: string }> = {
  draft: { variant: "neutral", icon: Clock, label: "Draft" },
  scheduled: { variant: "info", icon: Clock, label: "Scheduled" },
  processing: { variant: "warning", icon: Loader2, label: "Processing" },
  sent: { variant: "success", icon: CheckCircle2, label: "Sent" },
  cancelled: { variant: "neutral", icon: Ban, label: "Cancelled" },
  failed: { variant: "error", icon: XCircle, label: "Failed" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = campaignStatusMap[status];
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant}>
      <Icon className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} strokeWidth={2.5} />
      {cfg.label}
    </Badge>
  );
}