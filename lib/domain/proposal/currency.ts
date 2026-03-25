export function getCurrencyLocale(currency: string): string {
  return currency === "INR" ? "en-IN" : "en-US";
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  return amount.toLocaleString(getCurrencyLocale(currency), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}
