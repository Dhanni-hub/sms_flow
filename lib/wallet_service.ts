import { TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { estimateCredits } from "@/lib/pricing_config";

export async function creditWalletFromVerifiedPayment(input: {
  businessId: string;
  reference: string;
  amountKobo: number;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const existing = await prisma.transaction.findUnique({ where: { reference: input.reference } });
  if (existing?.status === TransactionStatus.SUCCESSFUL) return { credited: false, transaction: existing };

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.upsert({
      where: { reference: input.reference },
      update: {
        status: TransactionStatus.SUCCESSFUL,
        amountKobo: input.amountKobo,
        description: input.description,
        metadata: JSON.stringify(input.metadata ?? {}),
      },
      create: {
        businessId: input.businessId,
        reference: input.reference,
        type: TransactionType.WALLET_FUNDING,
        status: TransactionStatus.SUCCESSFUL,
        amountKobo: input.amountKobo,
        description: input.description,
        metadata: JSON.stringify(input.metadata ?? {}),
      },
    });
    await tx.wallet.upsert({
      where: { businessId: input.businessId },
      update: {
        balanceKobo: { increment: input.amountKobo },
        smsCredits: { increment: estimateCredits(input.amountKobo / 100) },
      },
      create: {
        businessId: input.businessId,
        balanceKobo: input.amountKobo,
        smsCredits: estimateCredits(input.amountKobo / 100),
      },
    });
    return { credited: true, transaction };
  });
}

export async function markPaymentFailed(input: {
  businessId: string;
  reference: string;
  amountKobo: number;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.transaction.upsert({
    where: { reference: input.reference },
    update: {
      status: TransactionStatus.FAILED,
      amountKobo: input.amountKobo,
      description: input.description,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
    create: {
      businessId: input.businessId,
      reference: input.reference,
      type: TransactionType.WALLET_FUNDING,
      status: TransactionStatus.FAILED,
      amountKobo: input.amountKobo,
      description: input.description,
      metadata: JSON.stringify(input.metadata ?? {}),
    },
  });
}
