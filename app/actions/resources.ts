"use server";

import { MessageStatus, Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nairaToKobo } from "@/lib/money";
import { createToken, hashToken } from "@/lib/security";
import { estimateCostKobo } from "@/lib/pricing_config";
import { calculateSmsSegments, extractTemplateVariables } from "@/lib/sms_segments";
import { getSmsProvider, SmsProviderConfigurationError } from "@/lib/sms_provider";
import { initializePaystackTransaction, PaystackConfigurationError } from "@/lib/paystack";
import { campaignSchema, contactSchema, groupSchema, sendSmsSchema, senderIdSchema, templateSchema } from "@/lib/validation";

export interface FormState {
  error?: string;
  success?: string;
}

function formArray(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function jsonArray(value?: string | null) {
  return JSON.stringify(value ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : []);
}

function validateSenderId(name: string, useCase: string) {
  const reserved = new Set(["SMSFLOW", "TERMII", "PAYSTACK", "ADMIN", "SUPPORT", "VERIFY", "OTP"]);
  if (!/^[A-Z0-9]{3,11}$/.test(name)) return "Sender ID must be 3-11 uppercase letters or numbers.";
  if (reserved.has(name)) return "This sender ID is reserved.";
  if (/(.)\1{5,}/.test(name)) return "Sender ID cannot contain suspicious repeated characters.";
  if (useCase.trim().length < 10) return "Describe a valid business use case.";
  return null;
}

const SENDER_NAME_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function formatBusinessSenderName(value?: string | null) {
  const cleaned = (value ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 11).toUpperCase();
  return cleaned.length >= 3 ? cleaned : null;
}

async function resolveEffectiveSenderName(businessId: string, senderId?: string | null) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true, senderName: true, senderNameSetAt: true },
  });
  if (business?.senderName) {
    return business.senderName;
  }
  if (senderId) {
    const approvedSender = await prisma.senderId.findFirst({
      where: { id: senderId, businessId, status: "APPROVED" },
      select: { name: true },
    });
    if (approvedSender) return approvedSender.name;
  }
  return formatBusinessSenderName(business?.name) ?? "SMSFLOW";
}

export async function createContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = contactSchema.safeParse({ ...Object.fromEntries(formData), groupIds: formArray(formData, "groupIds") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check contact details." };

  try {
    await prisma.contact.create({
      data: {
        businessId: user.businessId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        tags: jsonArray(parsed.data.tags),
        groups: { create: parsed.data.groupIds.map((groupId) => ({ groupId })) },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A contact with this phone number already exists." };
    }
    return { error: "Could not create contact." };
  }

  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
  return { success: "Contact created." };
}

export async function updateContactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = contactSchema.safeParse({ ...Object.fromEntries(formData), groupIds: formArray(formData, "groupIds") });
  if (!parsed.success || !parsed.data.id) return { error: parsed.success ? "Missing contact ID." : parsed.error.issues[0]?.message };

  await prisma.$transaction([
    prisma.contact.updateMany({
      where: { id: parsed.data.id, businessId: user.businessId },
      data: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || null, tags: jsonArray(parsed.data.tags) },
    }),
    prisma.contactGroupMember.deleteMany({ where: { contactId: parsed.data.id } }),
    ...parsed.data.groupIds.map((groupId) =>
      prisma.contactGroupMember.create({ data: { contactId: parsed.data.id!, groupId } })
    ),
  ]);

  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
  return { success: "Contact updated." };
}

export async function saveContactAction(formData: FormData) {
  await updateContactAction({}, formData);
  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
}

export async function deleteContactAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.contact.deleteMany({ where: { id, businessId: user.businessId } });
  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
}

export async function createGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    await prisma.contactGroup.create({ data: { businessId: user.businessId, name: parsed.data.name, description: parsed.data.description || null } });
  } catch {
    return { error: "Could not create group. The name may already exist." };
  }
  revalidatePath("/groups");
  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
  return { success: "Group created." };
}

export async function deleteGroupAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.contactGroup.deleteMany({ where: { id, businessId: user.businessId } });
  revalidatePath("/groups");
  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
}

export async function updateGroupAction(formData: FormData) {
  const user = await requireUser();
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.id) return;
  await prisma.contactGroup.updateMany({
    where: { id: parsed.data.id, businessId: user.businessId },
    data: { name: parsed.data.name, description: parsed.data.description || null },
  });
  revalidatePath("/groups");
  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
}

export async function createTemplateAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = templateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  await prisma.template.create({
    data: {
      businessId: user.businessId,
      name: parsed.data.name,
      body: parsed.data.body,
      variables: JSON.stringify(extractTemplateVariables(parsed.data.body)),
    },
  });
  revalidatePath("/templates");
  revalidatePath("/messaging/templates");
  return { success: "Template created." };
}

export async function deleteTemplateAction(formData: FormData) {
  const user = await requireUser();
  await prisma.template.deleteMany({ where: { id: String(formData.get("id") ?? ""), businessId: user.businessId } });
  revalidatePath("/templates");
  revalidatePath("/messaging/templates");
}

export async function updateTemplateAction(formData: FormData) {
  const user = await requireUser();
  const parsed = templateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !parsed.data.id) return;
  await prisma.template.updateMany({
    where: { id: parsed.data.id, businessId: user.businessId },
    data: {
      name: parsed.data.name,
      body: parsed.data.body,
      variables: JSON.stringify(extractTemplateVariables(parsed.data.body)),
    },
  });
  revalidatePath("/templates");
  revalidatePath("/messaging/templates");
}

export async function requestSenderIdAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = senderIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const rejectionReason = validateSenderId(parsed.data.name, parsed.data.useCase);
  try {
    await prisma.senderId.create({
      data: {
        businessId: user.businessId,
        name: parsed.data.name,
        status: rejectionReason ? "REJECTED" : "APPROVED",
        industry: parsed.data.industry || null,
        website: parsed.data.website || null,
        useCase: parsed.data.useCase,
        rejectionReason,
        reviewedAt: new Date(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "A sender ID with this name already exists for this workspace." };
    }
    return { error: "Could not submit sender ID request." };
  }
  revalidatePath("/sender-ids");
  revalidatePath("/messaging/send");
  revalidatePath("/messaging/bulk");
  return rejectionReason ? { error: `Sender ID rejected: ${rejectionReason}` } : { success: "Sender ID validated and approved." };
}

export async function sendSmsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = sendSmsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const contact = await prisma.contact.findFirst({
    where: { businessId: user.businessId, phone: parsed.data.recipientPhone },
    select: { id: true, name: true },
  });
  if (!contact) return { error: "Choose a contact saved in this workspace." };

  const senderId = parsed.data.senderId?.trim() || null;
  const sender = senderId ? await prisma.senderId.findFirst({ where: { id: senderId, businessId: user.businessId, status: "APPROVED" } }) : null;

  const segments = calculateSmsSegments(parsed.data.body);
  const costKobo = estimateCostKobo(segments.segments);
  const wallet = await prisma.wallet.findUnique({ where: { businessId: user.businessId } });
  if (!wallet) return { error: "Wallet is not initialized for this workspace." };
  const freeMessageUsed = wallet.freeMessageUsed;
  const chargeKobo = freeMessageUsed ? costKobo : 0;
  if (chargeKobo > 0 && wallet.balanceKobo < chargeKobo) return { error: "Insufficient wallet balance." };
  const senderName = await resolveEffectiveSenderName(user.businessId, senderId);

  let providerResult;
  try {
    providerResult = await getSmsProvider().send({ sender: senderName, to: parsed.data.recipientPhone, body: parsed.data.body });
  } catch (error) {
    if (error instanceof SmsProviderConfigurationError) return { error: error.message };
    return { error: error instanceof Error ? error.message : "SMS provider failed." };
  }

  await prisma.$transaction(async (tx) => {
    const walletUpdate: Prisma.WalletUpdateInput = { freeMessageUsed: true };
    if (chargeKobo > 0) {
      walletUpdate.balanceKobo = { decrement: chargeKobo };
      walletUpdate.smsCredits = { decrement: segments.segments };
    }
    await tx.wallet.update({ where: { businessId: user.businessId }, data: walletUpdate });
    await tx.message.create({
      data: {
        businessId: user.businessId,
        contactId: contact.id,
        senderIdId: sender?.id ?? null,
        senderName,
        recipientPhone: parsed.data.recipientPhone,
        recipientName: contact.name,
        body: parsed.data.body,
        encoding: segments.encoding,
        segments: segments.segments,
        costKobo: chargeKobo,
        status: "SENT",
        sentAt: new Date(),
        provider: providerResult.provider,
        providerMessageId: providerResult.providerMessageId,
        providerStatus: providerResult.providerStatus,
      },
    });
    if (chargeKobo > 0) {
      await tx.transaction.create({
        data: {
          businessId: user.businessId,
          reference: `SMS-${Date.now()}`,
          type: TransactionType.SMS_USAGE,
          status: TransactionStatus.SUCCESSFUL,
          amountKobo: -chargeKobo,
          description: `SMS to ${parsed.data.recipientPhone}`,
        },
      });
    }
  });

  revalidatePath("/send");
  revalidatePath("/messaging/send");
  revalidatePath("/messages");
  revalidatePath("/messaging/history");
  redirect("/messaging/history");
}

export async function sendBulkSmsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const senderId = String(formData.get("senderId") ?? "").trim() || null;
  const body = String(formData.get("body") ?? "").trim();
  const name = String(formData.get("name") ?? "Bulk SMS").trim() || "Bulk SMS";
  const scheduledForRaw = String(formData.get("scheduledFor") ?? "");
  const contactIds = formArray(formData, "contactIds");
  const groupIds = formArray(formData, "groupIds");

  if (!body) return { error: "Message is required." };

  const sender = senderId ? await prisma.senderId.findFirst({ where: { id: senderId, businessId: user.businessId, status: "APPROVED" } }) : null;

  const contacts = await prisma.contact.findMany({
    where: {
      businessId: user.businessId,
      OR: [
        { id: { in: contactIds } },
        { groups: { some: { groupId: { in: groupIds } } } },
      ],
    },
  });
  const recipients = Array.from(new Map(contacts.map((contact) => [contact.phone, contact])).values());
  if (recipients.length === 0) return { error: "Choose at least one recipient." };

  const segments = calculateSmsSegments(body);
  const costPerRecipientKobo = estimateCostKobo(segments.segments);
  const totalEstimatedCostKobo = costPerRecipientKobo * recipients.length;
  const wallet = await prisma.wallet.findUnique({ where: { businessId: user.businessId } });
  if (!wallet) return { error: "Wallet is not initialized for this workspace." };
  const estimatedChargeKobo = wallet.freeMessageUsed ? totalEstimatedCostKobo : Math.max(0, totalEstimatedCostKobo - costPerRecipientKobo);
  if (wallet.balanceKobo < estimatedChargeKobo) return { error: "Insufficient wallet balance for this bulk send." };

  const scheduledFor = scheduledForRaw ? new Date(scheduledForRaw) : null;
  if (scheduledFor) {
    const senderName = await resolveEffectiveSenderName(user.businessId, senderId);
    await prisma.campaign.create({
      data: {
        businessId: user.businessId,
        name,
        senderIdId: sender?.id ?? null,
        senderName,
        body,
        status: "SCHEDULED",
        scheduledFor,
        recipientCount: recipients.length,
        pendingCount: recipients.length,
        totalCostKobo: totalEstimatedCostKobo,
        groups: { create: groupIds.map((groupId) => ({ groupId })) },
        recipients: { create: recipients.map((contact) => ({ contactId: contact.id, phone: contact.phone, name: contact.name })) },
      },
    });
    revalidatePath("/messaging/campaigns");
    revalidatePath("/campaigns");
    return { success: `Scheduled campaign for ${recipients.length} recipients.` };
  }

  let provider;
  try {
    provider = getSmsProvider();
  } catch (error) {
    if (error instanceof SmsProviderConfigurationError) return { error: error.message };
    return { error: "SMS provider is not configured correctly." };
  }

  const results: Array<{ contact: (typeof recipients)[number]; status: MessageStatus; provider?: string; providerMessageId?: string; providerStatus?: string; failureReason?: string }> = [];
  const senderName = await resolveEffectiveSenderName(user.businessId, senderId);
  for (const contact of recipients) {
    try {
      const result = await provider.send({ sender: senderName, to: contact.phone, body });
      results.push({ contact, status: MessageStatus.SENT, provider: result.provider, providerMessageId: result.providerMessageId, providerStatus: result.providerStatus });
    } catch (error) {
      if (error instanceof SmsProviderConfigurationError) return { error: error.message };
      results.push({ contact, status: MessageStatus.FAILED, failureReason: error instanceof Error ? error.message : "Provider send failed." });
    }
  }

  const sentCount = results.filter((result) => result.status === MessageStatus.SENT).length;
  const failedCount = results.length - sentCount;
  let freeMessagePending = !wallet.freeMessageUsed && sentCount > 0;
  const chargedResults = results.map((result) => {
    if (result.status !== MessageStatus.SENT) return { ...result, costKobo: 0 };
    if (freeMessagePending) {
      freeMessagePending = false;
      return { ...result, costKobo: 0 };
    }
    return { ...result, costKobo: costPerRecipientKobo };
  });
  const chargedKobo = chargedResults.reduce((sum, result) => sum + result.costKobo, 0);
  const chargedRecipientCount = chargedResults.filter((result) => result.status === MessageStatus.SENT && result.costKobo > 0).length;

  await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        businessId: user.businessId,
        name,
        senderIdId: sender?.id ?? null,
        senderName,
        body,
        status: sentCount ? "SENT" : "FAILED",
        recipientCount: recipients.length,
        sentCount,
        failedCount,
        pendingCount: 0,
        totalCostKobo: chargedKobo,
        groups: { create: groupIds.map((groupId) => ({ groupId })) },
        recipients: { create: results.map((result) => ({ contactId: result.contact.id, phone: result.contact.phone, name: result.contact.name, status: result.status, error: result.failureReason })) },
      },
    });
    await tx.message.createMany({
      data: chargedResults.map((result) => ({
        businessId: user.businessId,
        contactId: result.contact.id,
        campaignId: campaign.id,
        senderIdId: sender?.id ?? null,
        senderName,
        recipientPhone: result.contact.phone,
        recipientName: result.contact.name,
        body,
        encoding: segments.encoding,
        segments: segments.segments,
        costKobo: result.costKobo,
        status: result.status,
        sentAt: result.status === MessageStatus.SENT ? new Date() : null,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        providerStatus: result.providerStatus,
        failureReason: result.failureReason,
      })),
    });
    if (sentCount > 0) {
      const walletUpdate: Prisma.WalletUpdateInput = { freeMessageUsed: true };
      if (chargedKobo > 0) {
        walletUpdate.balanceKobo = { decrement: chargedKobo };
        walletUpdate.smsCredits = { decrement: chargedRecipientCount * segments.segments };
      }
      await tx.wallet.update({ where: { businessId: user.businessId }, data: walletUpdate });
    }
    if (chargedKobo > 0) {
      await tx.transaction.create({
        data: {
          businessId: user.businessId,
          reference: `BULK-${Date.now()}`,
          type: TransactionType.SMS_USAGE,
          status: TransactionStatus.SUCCESSFUL,
          amountKobo: -chargedKobo,
          description: `Bulk SMS - ${name} (${sentCount} recipients)`,
        },
      });
    }
  });

  revalidatePath("/messaging/bulk");
  revalidatePath("/messaging/history");
  revalidatePath("/messaging/campaigns");
  revalidatePath("/dashboard");
  return failedCount ? { success: `Sent ${sentCount} messages. ${failedCount} failed and were not charged.` } : { success: `Bulk SMS sent to ${sentCount} recipients.` };
}

export async function createCampaignAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = campaignSchema.safeParse({ ...Object.fromEntries(formData), groupIds: formArray(formData, "groupIds"), contactIds: formArray(formData, "contactIds") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const senderId = parsed.data.senderId?.trim() || null;
  const sender = senderId ? await prisma.senderId.findFirst({ where: { id: senderId, businessId: user.businessId, status: "APPROVED" } }) : null;

  const contacts = await prisma.contact.findMany({
    where: {
      businessId: user.businessId,
      OR: [
        { id: { in: parsed.data.contactIds } },
        { groups: { some: { groupId: { in: parsed.data.groupIds } } } },
      ],
    },
  });
  const unique = Array.from(new Map(contacts.map((contact) => [contact.phone, contact])).values());
  if (unique.length === 0) return { error: "Choose at least one recipient." };

  const segments = calculateSmsSegments(parsed.data.body);
  const totalCostKobo = estimateCostKobo(segments.segments, unique.length);
  const scheduledFor = parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null;
  const senderName = await resolveEffectiveSenderName(user.businessId, senderId);

  await prisma.campaign.create({
    data: {
      businessId: user.businessId,
      name: parsed.data.name,
      senderIdId: sender?.id ?? null,
      senderName,
      body: parsed.data.body,
      status: scheduledFor ? "SCHEDULED" : "DRAFT",
      scheduledFor,
      recipientCount: unique.length,
      pendingCount: unique.length,
      totalCostKobo,
      groups: { create: parsed.data.groupIds.map((groupId) => ({ groupId })) },
      recipients: { create: unique.map((contact) => ({ contactId: contact.id, phone: contact.phone, name: contact.name })) },
    },
  });

  revalidatePath("/campaigns");
  revalidatePath("/messaging/campaigns");
  return { success: scheduledFor ? "Campaign scheduled." : "Campaign draft created." };
}

export async function cancelCampaignAction(formData: FormData) {
  const user = await requireUser();
  await prisma.campaign.updateMany({
    where: { id: String(formData.get("id") ?? ""), businessId: user.businessId, status: { in: ["DRAFT", "SCHEDULED"] } },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/campaigns");
  revalidatePath("/messaging/campaigns");
}

export async function deleteCampaignAction(formData: FormData) {
  const user = await requireUser();
  await prisma.campaign.deleteMany({
    where: { id: String(formData.get("id") ?? ""), businessId: user.businessId, status: { in: ["DRAFT", "SCHEDULED", "CANCELLED", "FAILED"] } },
  });
  revalidatePath("/campaigns");
  revalidatePath("/messaging/campaigns");
}

export async function startFundingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const amountNgn = Number(formData.get("amount") ?? 0);
  if (!Number.isFinite(amountNgn) || amountNgn < 100) return { error: "Enter a funding amount of at least ₦100." };
  const amountKobo = nairaToKobo(amountNgn);
  const reference = `FUND-${user.businessId}-${Date.now()}`;

  try {
    const payment = await initializePaystackTransaction({
      email: user.email,
      amountKobo,
      reference,
      callbackUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/api/paystack/verify?reference=${encodeURIComponent(reference)}`,
      metadata: { businessId: user.businessId, userId: user.id, purpose: "wallet_funding" },
    });

    await prisma.transaction.create({
      data: {
        businessId: user.businessId,
        reference,
        type: TransactionType.WALLET_FUNDING,
        status: TransactionStatus.PENDING,
        amountKobo,
        description: "Wallet funding via Paystack",
        metadata: JSON.stringify({ accessCode: payment.access_code }),
      },
    });

    redirect(payment.authorization_url);
  } catch (error) {
    if (error instanceof PaystackConfigurationError) return { error: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Payment reference already exists. Try again." };
    return { error: error instanceof Error ? error.message : "Could not initialize payment." };
  }
}

export async function importContactsCsvAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Upload a CSV file." };
  const text = await file.text();
  const rows = text.split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim())).filter((row) => row.some(Boolean));
  const [header, ...bodyRows] = rows;
  if (!header || bodyRows.length === 0) return { error: "CSV must include a header row and contacts." };
  const nameIndex = header.findIndex((h) => h.toLowerCase() === "name");
  const phoneIndex = header.findIndex((h) => h.toLowerCase() === "phone");
  const emailIndex = header.findIndex((h) => h.toLowerCase() === "email");
  if (nameIndex === -1 || phoneIndex === -1) return { error: "CSV must include name and phone columns." };

  let imported = 0;
  let skipped = 0;
  for (const row of bodyRows) {
    const parsed = contactSchema.safeParse({ name: row[nameIndex], phone: row[phoneIndex], email: emailIndex >= 0 ? row[emailIndex] : "", groupIds: [] });
    if (!parsed.success) {
      skipped++;
      continue;
    }
    try {
      await prisma.contact.create({
        data: { businessId: user.businessId, name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email || null },
      });
      imported++;
    } catch {
      skipped++;
    }
  }
  revalidatePath("/contacts");
  revalidatePath("/messaging/bulk");
  return { success: `Imported ${imported} contacts. Skipped ${skipped}.` };
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (name.length < 2) return { error: "Name is required." };
  await prisma.user.update({ where: { id: user.id }, data: { name, phone: phone || null } });
  revalidatePath("/profile");
  revalidatePath("/settings");
  return { success: "Profile updated." };
}

export async function updateBusinessSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(formData.get("businessName") ?? "").trim();
  const senderName = String(formData.get("senderName") ?? "").trim();
  if (name.length < 2) return { error: "Business name is required." };

  const updates: Prisma.BusinessUpdateInput = { name };
  if (senderName) {
    const normalizedSenderName = formatBusinessSenderName(senderName);
    if (!normalizedSenderName) return { error: "Sender name must be 3-11 letters or numbers." };

    const currentBusiness = await prisma.business.findUnique({
      where: { id: user.businessId },
      select: { senderName: true, senderNameSetAt: true },
    });
    const updateWindowOpen = !currentBusiness?.senderNameSetAt || Date.now() - currentBusiness.senderNameSetAt.getTime() >= SENDER_NAME_MONTH_MS;
    if (!updateWindowOpen && currentBusiness?.senderName !== normalizedSenderName) {
      return { error: "You can update your sender name once every 30 days." };
    }

    if (updateWindowOpen) {
      updates.senderName = normalizedSenderName;
      updates.senderNameSetAt = new Date();
    }
  }

  await prisma.business.update({ where: { id: user.businessId }, data: updates });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: "Business settings updated." };
}

export async function createApiKeyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const label = String(formData.get("label") ?? "").trim();
  if (label.length < 2) return { error: "API key label is required." };
  const secret = `sms_${createToken(32)}`;
  await prisma.apiKey.create({
    data: {
      businessId: user.businessId,
      label,
      keyHash: hashToken(secret),
      keyPreview: `${secret.slice(0, 8)}...${secret.slice(-4)}`,
    },
  });
  revalidatePath("/developer");
  revalidatePath("/settings");
  revalidatePath("/api-keys");
  return { success: `API key created. Copy it now: ${secret}` };
}

export async function revokeApiKeyAction(formData: FormData) {
  const user = await requireUser();
  await prisma.apiKey.updateMany({
    where: { id: String(formData.get("id") ?? ""), businessId: user.businessId },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/developer");
  revalidatePath("/settings");
  revalidatePath("/api-keys");
}

export async function createWebhookAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const url = String(formData.get("url") ?? "").trim();
  try {
    new URL(url);
  } catch {
    return { error: "Enter a valid webhook URL." };
  }
  const secret = createToken(24);
  await prisma.webhook.create({
    data: {
      businessId: user.businessId,
      url,
      events: JSON.stringify(formData.getAll("events").map(String)),
      secretHash: hashToken(secret),
    },
  });
  revalidatePath("/developer");
  revalidatePath("/settings");
  revalidatePath("/integrations");
  return { success: `Webhook created. Signing secret: ${secret}` };
}

export async function deleteWebhookAction(formData: FormData) {
  const user = await requireUser();
  await prisma.webhook.deleteMany({ where: { id: String(formData.get("id") ?? ""), businessId: user.businessId } });
  revalidatePath("/developer");
  revalidatePath("/settings");
  revalidatePath("/integrations");
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id: String(formData.get("id") ?? ""), userId: user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
  revalidatePath("/settings");
}
