/**
 * Format a number in Danish currency format
 * Uses dot as thousands separator and displays 'kr' suffix
 */
export function formatDanishCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
