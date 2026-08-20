export interface PricingConfig {
  costPerSegmentKobo: number;
  fundingPresets: number[];
  currency: "NGN";
}

const DEFAULT_SEGMENT_PRICE_KOBO = 785;

export function getPricing(): PricingConfig {
  const configured = Number(process.env.SMS_SEGMENT_PRICE_KOBO ?? DEFAULT_SEGMENT_PRICE_KOBO);
  return {
    costPerSegmentKobo: Number.isFinite(configured) && configured > 0 ? Math.round(configured) : DEFAULT_SEGMENT_PRICE_KOBO,
    fundingPresets: [500, 1000, 2500, 5000, 10000],
    currency: "NGN",
  };
}

export function getCostPerSegmentNgn(pricing: PricingConfig = getPricing()): number {
  return pricing.costPerSegmentKobo / 100;
}

export function estimateCostKobo(segments: number, recipients = 1, pricing: PricingConfig = getPricing()): number {
  return Math.max(0, segments) * Math.max(0, recipients) * pricing.costPerSegmentKobo;
}

export function estimateCost(segments: number, pricing: PricingConfig = getPricing()): number {
  return estimateCostKobo(segments, 1, pricing) / 100;
}

export function estimateCredits(ngnAmount: number, pricing: PricingConfig = getPricing()): number {
  return Math.floor((Math.max(0, ngnAmount) * 100) / pricing.costPerSegmentKobo);
}
