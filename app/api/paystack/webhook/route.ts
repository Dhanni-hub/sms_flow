import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaystackSignature } from "@/lib/paystack";
import { creditWalletFromVerifiedPayment, markPaymentFailed } from "@/lib/wallet_service";

type PaystackWebhook = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    metadata?: Record<string, unknown>;
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as PaystackWebhook;
  const reference = payload.data?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  const transaction = await prisma.transaction.findUnique({ where: { reference } });
  const businessId = typeof payload.data?.metadata?.businessId === "string" ? payload.data.metadata.businessId : transaction?.businessId;
  if (!businessId) return NextResponse.json({ ok: true });

  if (payload.event === "charge.success" && payload.data?.status === "success" && payload.data.currency === "NGN") {
    await creditWalletFromVerifiedPayment({
      businessId,
      reference,
      amountKobo: payload.data.amount ?? transaction?.amountKobo ?? 0,
      description: "Wallet funding via Paystack",
      metadata: payload,
    });
    return NextResponse.json({ ok: true });
  }

  if (payload.event?.startsWith("charge.")) {
    await markPaymentFailed({
      businessId,
      reference,
      amountKobo: payload.data?.amount ?? transaction?.amountKobo ?? 0,
      description: `Paystack ${payload.event}`,
      metadata: payload,
    });
  }

  return NextResponse.json({ ok: true });
}
