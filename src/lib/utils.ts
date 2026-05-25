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

function waitForRender(container: HTMLElement, retries = 2): Promise<void> {
  return new Promise((resolve) => {
    const check = (remaining: number) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container.scrollHeight > 0 || remaining <= 0) {
            resolve();
            return;
          }
          check(remaining - 1);
        });
      });
    };
    check(retries);
  });
}

function waitForImages(container: HTMLElement): Promise<void> {
  const images = container.querySelectorAll('img');
  if (images.length === 0) return Promise.resolve();
  return Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) { resolve(); return; }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
}

export async function generatePdf(
  htmlContent: string,
  filename: string,
): Promise<void> {
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:700px;padding:40px;background:#0B0F14;color:#F9FAFB;font-family:"Plus Jakarta Sans",sans-serif;line-height:24px;font-size:14px;';
  document.body.appendChild(container);

  try {
    await waitForRender(container);
    await waitForImages(container);
    await waitForRender(container);

    const mod = await import('html2pdf.js');
    const generator = mod.default();
    await generator
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0B0F14' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
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
