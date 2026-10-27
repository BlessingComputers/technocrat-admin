const HOURS_TO_PAY = 72;

export function calculatePaymentPreview(
  totalAmount: number,
  percentage: number,
) {
  const firstPaymentAmount = Math.round(totalAmount * percentage) / 100;
  return {
    firstPaymentAmount,
    balanceAmount: Math.max(0, totalAmount - firstPaymentAmount),
    isFullPayment: percentage === 100,
  };
}

export function defaultPaymentDeadline(now = new Date()): Date {
  return new Date(now.getTime() + HOURS_TO_PAY * 60 * 60 * 1000);
}

export function toDateTimeLocalValue(date: Date): string {
  const watOffsetMs = 60 * 60_000;
  return new Date(date.getTime() + watOffsetMs).toISOString().slice(0, 16);
}

export function westAfricaLocalToIso(value: string): string {
  return new Date(`${value}:00+01:00`).toISOString();
}

export function formatWestAfricaTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function formatNaira(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}
