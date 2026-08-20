export function nairaToKobo(amount: number): number {
  return Math.round(amount * 100);
}

export function koboToNaira(amountKobo: number): number {
  return amountKobo / 100;
}
