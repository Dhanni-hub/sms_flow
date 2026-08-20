import { MessageStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeProviderStatus } from "@/lib/sms_provider";

type InfobipReport = {
  messageId?: string;
  status?: {
    groupName?: string;
    name?: string;
    description?: string;
  };
  error?: {
    name?: string;
    description?: string;
  };
  doneAt?: string;
};

type InfobipWebhook = {
  results?: InfobipReport[];
  messageId?: string;
  status?: InfobipReport["status"];
  error?: InfobipReport["error"];
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as InfobipWebhook;
  const reports = payload.results?.length
    ? payload.results
    : [{ messageId: payload.messageId, status: payload.status, error: payload.error }];

  for (const report of reports) {
    const providerMessageId = report.messageId;
    if (!providerMessageId) continue;

    const providerStatus = report.status?.groupName ?? report.status?.name ?? report.status?.description ?? null;
    const status = normalizeProviderStatus(providerStatus) as MessageStatus;
    const message = await prisma.message.findFirst({ where: { provider: "infobip", providerMessageId } });
    if (!message) continue;
    if (message.status === status && message.providerStatus === providerStatus) continue;

    await prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: { id: message.id },
        data: {
          status,
          providerStatus,
          failureReason: status === MessageStatus.FAILED ? report.error?.description ?? report.error?.name ?? "Provider reported failure." : message.failureReason,
          deliveredAt: status === MessageStatus.DELIVERED ? new Date() : message.deliveredAt,
        },
      });

      if (message.campaignId) {
        const campaignMessages = await tx.message.findMany({ where: { campaignId: message.campaignId }, select: { status: true } });
        await tx.campaign.update({
          where: { id: message.campaignId },
          data: {
            sentCount: campaignMessages.filter((m) => m.status === MessageStatus.SENT || m.status === MessageStatus.DELIVERED).length,
            deliveredCount: campaignMessages.filter((m) => m.status === MessageStatus.DELIVERED).length,
            failedCount: campaignMessages.filter((m) => m.status === MessageStatus.FAILED).length,
            pendingCount: campaignMessages.filter((m) => m.status === MessageStatus.PENDING || m.status === MessageStatus.QUEUED).length,
          },
        });
      }
    });
  }

  return NextResponse.json({ ok: true });
}
