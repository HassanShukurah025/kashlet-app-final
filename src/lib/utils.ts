export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function generateInvoiceNumber(prefix: string, number: number): string {
  return `${prefix}-${String(number).padStart(4, '0')}`;
}

export function calculateItemTotal(quantity: number, rate: number, tax: number): number {
  const subtotal = quantity * rate;
  return subtotal + subtotal * (tax / 100);
}

export function calculateInvoiceTotals(
  items: { quantity: number; rate: number; tax: number }[],
  discount: number
): { subtotal: number; tax_total: number; total: number } {
  let subtotal = 0;
  let taxTotal = 0;

  for (const item of items) {
    const itemSubtotal = item.quantity * item.rate;
    subtotal += itemSubtotal;
    taxTotal += itemSubtotal * (item.tax / 100);
  }

  const total = subtotal + taxTotal - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_total: Math.round(taxTotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'NGN', name: 'Nigerian Naira' },
];
