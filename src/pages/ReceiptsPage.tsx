import { useEffect, useState, useCallback } from 'react';
import { Receipt as ReceiptIcon, Download, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate, generatePdf } from '../lib/utils';
import type { Receipt } from '../lib/types';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { TableSkeleton } from '../components/ui/Skeleton';

function buildReceiptHtml(receipt: Receipt, profile: any): string {
  const inv = (receipt.invoices || {}) as any;
  const logoUrl = profile?.business_logo_url;
  const currency = inv?.currency || 'USD';

  const itemsHtml = inv?.items?.length
    ? `<table style="width:100%;font-size:14px;border-collapse:collapse;">
        <thead>
          <tr style="color:#6B7280;border-bottom:1px solid #2A2F3A;">
            <th style="text-align:left;padding:8px 0;">Description</th>
            <th style="text-align:right;padding:8px 0;">Qty</th>
            <th style="text-align:right;padding:8px 0;">Rate</th>
            <th style="text-align:right;padding:8px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${inv.items.map((item: any) => `
            <tr style="border-bottom:1px solid #2A2F3A;">
              <td style="padding:8px 0;color:#F9FAFB;">${item.description}</td>
              <td style="padding:8px 0;text-align:right;color:#9CA3AF;">${item.quantity}</td>
              <td style="padding:8px 0;text-align:right;color:#9CA3AF;">${formatCurrency(item.rate, currency)}</td>
              <td style="padding:8px 0;text-align:right;color:#F9FAFB;">${formatCurrency(item.total, currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`
    : '';

  return `
    <div style="text-align:center;margin-bottom:32px;">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="width:48px;height:48px;object-fit:contain;margin:0 auto 12px;display:block;" />` : ''}
      <h2 style="font-size:24px;font-weight:700;margin:0 0 4px;">RECEIPT</h2>
      <p style="font-size:14px;color:#9CA3AF;margin:0;">${receipt.receipt_number}</p>
      <p style="font-size:12px;color:#6B7280;margin:4px 0 0;">Issued: ${formatDate(receipt.issued_at)}</p>
    </div>
    <div style="border-top:1px solid #2A2F3A;padding-top:16px;margin-bottom:16px;">
      <p style="font-size:14px;color:#9CA3AF;margin:0 0 4px;">From: ${profile?.business_name || ''}</p>
      <p style="font-size:14px;color:#9CA3AF;margin:0 0 4px;">Invoice: ${inv?.invoice_number || '—'}</p>
      <p style="font-size:18px;font-weight:600;color:#F9FAFB;margin:8px 0 0;">Total: ${inv ? formatCurrency(inv.total, currency) : '—'}</p>
    </div>
    ${itemsHtml ? `<div style="border-top:1px solid #2A2F3A;padding-top:16px;">${itemsHtml}</div>` : ''}
    <div style="margin-top:32px;border-top:1px solid #2A2F3A;padding-top:16px;text-align:center;">
      <p style="font-size:12px;color:#6B7280;margin:0;">Thank you for your business.</p>
    </div>
  `;
}

export default function ReceiptsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchReceipts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const profileRes = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
    setProfile(profileRes.data);

    let query = supabase
      .from('receipts')
      .select('*, invoices(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (searchQuery) query = query.ilike('receipt_number', `%${searchQuery}%`);

    const { data, error: err } = await query;
    if (err) setError('Failed to load receipts');
    else setReceipts((data as Receipt[]) || []);
    setLoading(false);
  }, [user, searchQuery]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const downloadReceiptPdf = async (receipt: Receipt) => {
    if (loading || downloading) return;
    setDownloading(receipt.id);
    addToast('info', 'Generating receipt PDF...');

    try {
      const html = buildReceiptHtml(receipt, profile);
      await generatePdf(html, `${receipt.receipt_number}.pdf`);
      addToast('success', 'Receipt downloaded');
    } catch {
      addToast('error', 'PDF generation failed', { label: 'Retry', onClick: () => downloadReceiptPdf(receipt) });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 font-semibold text-text-primary">Receipts</h1>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search receipts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-sm bg-base-bg border border-base-border pl-9 pr-3 text-body-m text-text-primary placeholder:text-text-muted focus:outline-none focus:border-base-border-focus"
        />
      </div>

      {loading ? (
        <div className="rounded-card border border-base-border bg-base-card"><TableSkeleton rows={5} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReceipts} />
      ) : receipts.length === 0 ? (
        <div className="rounded-card border border-base-border bg-base-card">
          <EmptyState
            icon={<ReceiptIcon className="w-8 h-8" />}
            title={searchQuery ? 'No matching receipts' : 'No receipts yet'}
            description={searchQuery ? 'Try adjusting your search' : 'Receipts are generated automatically when you mark invoices as paid'}
            action={!searchQuery ? <Button variant="secondary" onClick={() => navigate('/invoices')}>View Invoices</Button> : undefined}
          />
        </div>
      ) : (
        <div className="rounded-card border border-base-border bg-base-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-caption text-text-muted border-b border-base-border">
                  <th className="text-left px-5 py-3 font-medium">Receipt</th>
                  <th className="text-left px-5 py-3 font-medium">Invoice</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Issued</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-border">
                {receipts.map((rc) => {
                  const inv = rc.invoices as any;
                  return (
                    <tr key={rc.id} className="hover:bg-base-surface/50 transition-colors">
                      <td className="px-5 py-3 text-body-m text-text-primary font-medium">{rc.receipt_number}</td>
                      <td className="px-5 py-3 text-body-m text-text-secondary">{inv?.invoice_number || '—'}</td>
                      <td className="px-5 py-3 text-body-m text-text-primary">{inv ? formatCurrency(inv.total, inv.currency) : '—'}</td>
                      <td className="px-5 py-3 text-body-m text-text-secondary">{formatDate(rc.issued_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => setViewReceipt(rc)} />
                          <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={() => downloadReceiptPdf(rc)} loading={downloading === rc.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewReceipt && (() => {
        const inv = viewReceipt.invoices as any;
        const logoUrl = profile?.business_logo_url;
        const currency = inv?.currency || 'USD';

        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={() => setViewReceipt(null)}>
            <div className="fixed inset-0 bg-black/60" />
            <div className="relative bg-base-card border border-base-border rounded-card max-w-lg w-full mx-4 shadow-xl p-8" onClick={(e) => e.stopPropagation()}>
              <div>
                <div className="text-center mb-6">
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-sm mx-auto mb-3" />
                  )}
                  <h2 className="text-h2 font-semibold text-text-primary">RECEIPT</h2>
                  <p className="text-body-m text-text-secondary">{viewReceipt.receipt_number}</p>
                  <p className="text-caption text-text-muted">Issued: {formatDate(viewReceipt.issued_at)}</p>
                </div>
                <div className="border-t border-base-border pt-4 mb-4">
                  <p className="text-body-m text-text-secondary mb-1">From: {profile?.business_name || ''}</p>
                  <p className="text-body-m text-text-secondary">Invoice: {inv?.invoice_number || '—'}</p>
                  <p className="text-body-m text-text-primary font-semibold mt-2">Amount: {inv ? formatCurrency(inv.total, currency) : '—'}</p>
                </div>
                {inv?.items && (
                  <div className="border-t border-base-border pt-4">
                    <table className="w-full text-body-m">
                      <thead>
                        <tr className="text-caption text-text-muted border-b border-base-border">
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-right py-2 font-medium">Qty</th>
                          <th className="text-right py-2 font-medium">Rate</th>
                          <th className="text-right py-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-base-border">
                        {inv.items.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="py-2 text-text-primary">{item.description}</td>
                            <td className="py-2 text-text-secondary text-right">{item.quantity}</td>
                            <td className="py-2 text-text-secondary text-right">{formatCurrency(item.rate, currency)}</td>
                            <td className="py-2 text-text-primary text-right">{formatCurrency(item.total, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-base-border text-center">
                  <p className="text-caption text-text-muted">Thank you for your business.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="secondary" onClick={() => downloadReceiptPdf(viewReceipt)} icon={<Download className="w-4 h-4" />} loading={downloading === viewReceipt.id}>Download PDF</Button>
                <Button variant="ghost" onClick={() => setViewReceipt(null)}>Close</Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
