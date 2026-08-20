// ============================================================================
// SMSFlow — Core Domain Types
// These are the data contracts the UI is built against. The backend
// (Codex) should shape API responses to match these shapes, or an
// adapter layer should translate provider responses into them.
// Provider-specific fields (Infobip or otherwise) must NEVER leak past
// the `lib/services/*` layer into these shared types or into components.
// ============================================================================

export type ThemeMode = "light" | "dark" | "system";

export type AccountType = "business" | "organization" | "personal";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified?: boolean;
  avatarUrl?: string;
  accountType: AccountType;
  businessName?: string;
  createdAt: string; // ISO 8601
  onboardingCompleted: boolean;
}

// ---- Wallet & Billing ---------------------------------------------------

export interface WalletBalance {
  ngnBalance: number; // naira, minor-unit-free (backend should clarify kobo vs naira)
  smsCredits: number;
  lastFundedAt?: string;
}

export type TransactionType = "wallet_funding" | "sms_usage" | "refund" | "adjustment";
export type TransactionStatus = "pending" | "successful" | "failed" | "cancelled";

export interface Transaction {
  id: string;
  reference: string;
  type: TransactionType;
  description: string;
  amount: number; // signed: positive = credit, negative = debit
  status: TransactionStatus;
  createdAt: string;
  meta?: Record<string, string>;
}

export type FundingChannel = "card" | "bank_transfer" | "ussd";

export interface FundingOption {
  amountNgn: number;
  bonusCredits?: number; // e.g. promotional bonus, optional
  label?: string;
}

// ---- Contacts -------------------------------------------------------------

export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164 format expected, e.g. +2348012345678
  groupIds: string[];
  createdAt: string;
  tags?: string[];
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  createdAt: string;
  color?: string;
}

// ---- Sender IDs -------------------------------------------------------------

export type SenderIdStatus = "approved" | "pending" | "rejected";

export interface SenderId {
  id: string;
  name: string; // max 11 alphanumeric chars per GSM sender ID convention
  status: SenderIdStatus;
  businessName: string;
  website?: string;
  registrationInfo?: string;
  industry: string;
  useCase: string;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ---- Messaging -------------------------------------------------------------

export type MessageStatus = "queued" | "sent" | "delivered" | "failed" | "pending";
export type RecipientMode = "single" | "contact" | "group" | "csv";

export interface SmsSegmentInfo {
  characterCount: number;
  charLimit: number; // 160 for GSM-7, 70 for UCS-2
  segments: number;
  encoding: "GSM-7" | "UCS-2";
}

export interface SmsMessage {
  id: string;
  recipientPhone: string;
  recipientName?: string;
  senderId: string;
  body: string;
  status: MessageStatus;
  segments: number;
  cost: number;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failureReason?: string;
  providerStatus?: string; // opaque passthrough for the details view only
  providerMessageId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  body: string; // may contain {{variable}} placeholders
  variables: string[];
  lastUsedAt?: string;
  createdAt: string;
  useCount: number;
}

export type CampaignStatus = "draft" | "scheduled" | "processing" | "sent" | "cancelled" | "failed";

export interface Campaign {
  id: string;
  name: string;
  senderId: string;
  body: string;
  recipientMode: RecipientMode;
  recipientCount: number;
  segmentsTotal: number;
  estimatedCost: number;
  status: CampaignStatus;
  scheduledFor?: string;
  createdAt: string;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
}

// ---- Analytics -------------------------------------------------------------

export interface UsagePoint {
  date: string; // ISO date
  sent: number;
  delivered: number;
  failed: number;
}

export interface AnalyticsSummary {
  totalSent: number;
  deliveryRate: number; // 0-1
  totalFailed: number;
  totalSpend: number;
  creditsUsed: number;
  periodLabel: string;
  series: UsagePoint[];
}

// ---- API / Developer -------------------------------------------------------

export interface ApiKey {
  id: string;
  label: string;
  keyPreview: string; // e.g. "sk_live_••••••••4f2a" — never the full secret
  createdAt: string;
  lastUsedAt?: string;
  status: "active" | "revoked";
}

export interface ApiRequestLogEntry {
  id: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  statusCode: number;
  createdAt: string;
  latencyMs: number;
}

// ---- Notifications / Toasts -------------------------------------------------

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastPayload {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

// ---- Admin (internal concept only) -----------------------------------------

export interface AdminOverviewMetrics {
  totalUsers: number;
  activeUsersToday: number;
  totalRevenue: number;
  providerCost: number;
  margin: number;
  smsSentToday: number;
  failedMessagesToday: number;
  pendingSenderIdRequests: number;
  openSupportIssues: number;
}

// ---- Network / PWA state ---------------------------------------------------

export type ConnectivityState = "online" | "offline";