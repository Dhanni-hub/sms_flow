export function formatNaira(amount: number, opts?: { showSign?: boolean }): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (opts?.showSign) {
    return amount < 0 ? `-${formatted}` : `+${formatted}`;
  }
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-NG").format(n);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(iso);
}

export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  const match = cleaned.match(/^\+234(\d{3})(\d{3})(\d{4})$/);
  if (match) return `+234 ${match[1]} ${match[2]} ${match[3]}`;
  return phone;
}

export function normalizeNigerianPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+234\d{10}$/.test(digits)) return digits;
  if (/^234\d{10}$/.test(digits)) return `+${digits}`;
  if (/^0\d{10}$/.test(digits)) return `+234${digits.slice(1)}`;
  if (/^\d{10}$/.test(digits)) return `+234${digits}`;
  return null;
}

export function truncateMiddle(str: string, keepStart = 8, keepEnd = 4): string {
  if (str.length <= keepStart + keepEnd + 3) return str;
  return `${str.slice(0, keepStart)}...${str.slice(-keepEnd)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
