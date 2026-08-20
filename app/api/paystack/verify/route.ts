import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { creditWalletFromVerifiedPayment, markPaymentFailed } from "@/lib/wallet_service";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/billing?payment=missing-reference", request.url));

  const transaction = await prisma.transaction.findUnique({ where: { reference } });
  if (!transaction) return NextResponse.redirect(new URL("/billing?payment=unknown-reference", request.url));

  try {
    const verified = await verifyPaystackTransaction(reference);
    const metadata = typeof verified.metadata === "object" && verified.metadata ? verified.metadata : {};
    const businessId = typeof metadata.businessId === "string" ? metadata.businessId : transaction.businessId;

    if (verified.status === "success" && verified.currency === "NGN" && verified.amount === transaction.amountKobo) {
      await creditWalletFromVerifiedPayment({
        businessId,
        reference,
        amountKobo: verified.amount,
        description: "Wallet funding via Paystack",
        metadata: { verified },
      });
      return NextResponse.redirect(new URL("/billing?payment=success", request.url));
    }

    await markPaymentFailed({
      businessId,
      reference,
      amountKobo: transaction.amountKobo,
      description: "Paystack payment was not successful",
      metadata: { verified },
    });
    return NextResponse.redirect(new URL("/billing?payment=failed", request.url));
  } catch {
    return NextResponse.redirect(new URL("/billing?payment=verification-error", request.url));
  }
}
