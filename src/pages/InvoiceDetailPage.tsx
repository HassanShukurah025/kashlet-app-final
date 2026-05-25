import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, Trash2, Edit3, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate, generatePdf } from '../lib/utils';
import type { Invoice, Client } from '../lib/types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import { CardSkeleton } from '../components/ui/Skeleton';
import ConfirmModal from '../components/ui/ConfirmModal';

function buildInvoiceHtml(invoice: Invoice, client: Client | null, profile: any): string {
  const currency = invoice.currency || 'USD';
  const logoUrl = profile?.business_logo_url;

  const itemsHtml = invoice.items.length
    ? `<table style="width:100%;font-size:14px;border-collapse:collapse;">
        <thead>
          <tr style="color:#6B7280;border-bottom:1px solid #2A2F3A;">
            <th style="text-align:left;padding:8px 0;">Description</th>
            <th style="text-align:right;padding:8px 0;">Qty</th>
            <th style="text-align:right;padding:8px 0;">Rate</th>
            <th style="text-align:right;padding:8px 0;">Tax</th>
            <th style="text-align:right;padding:8px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item) => `
            <tr style="border-bottom:1px solid #2A2F3A;">
              <td style="padding:12px 0;color:#F9FAFB;">${item.description}</td>
              <td style="padding:12px 0;text-align:right;color:#9CA3AF;">${item.quantity}</td>
              <td style="padding:12px 0;text-align:right;color:#9CA3AF;">${formatCurrency(item.rate, currency)}</td>
              <td style="padding:12px 0;text-align:right;color:#9CA3AF;">${item.tax}%</td>
              <td style="padding:12px 0;text-align:right;color:#F9FAFB;">${formatCurrency(item.total, currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`
    : '';

  const discountHtml = invoice.discount > 0
    ? `<div style="display:flex;justify-content:space-between;font-size:14px;">
         <span style="color:#9CA3AF;">Discount</span>
         <span style="color:#EF4444;">-${formatCurrency(invoice.discount, currency)}</span>
       </div>`
    : '';

  const paymentTermsHtml = invoice.payment_terms
    ? `<div style="margin-bottom:12px;">
         <h4 style="font-size:11px;font-weight:500;color:#6B7280;text-transform:uppercase;margin:0 0 4px;">Payment Terms</h4>
         <p style="font-size:14px;color:#9CA3AF;margin:0;">${invoice.payment_terms}</p>
       </div>`
    : '';

  const notesHtml = invoice.notes
    ? `<div>
         <h4 style="font-size:11px;font-weight:500;color:#6B7280;text-transform:uppercase;margin:0 0 4px;">Notes</h4>
         <p style="font-size:14px;color:#9CA3AF;margin:0;">${invoice.notes}</p>
       </div>`
    : '';

  const extrasHtml = (invoice.notes || invoice.payment_terms)
    ? `<div style="margin-top:32px;border-top:1px solid #2A2F3A;padding-top:24px;">
         ${paymentTermsHtml}${notesHtml}
       </div>`
    : '';

  return `
    <div style="display:flex;justify-content:space-between;margin-bottom:32px;">
      <div style="display:flex;align-items:start;gap:16px;">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="width:48px;height:48px;object-fit:contain;margin:0;" />` : ''}
        <div>
          <h2 style="font-size:20px;font-weight:600;color:#F9FAFB;margin:0 0 4px;">${profile?.business_name || 'Your Business'}</h2>
          <p style="font-size:14px;color:#9CA3AF;margin:0;">${profile?.business_email || ''}</p>
          <p style="font-size:14px;color:#9CA3AF;margin:0;">${profile?.business_address || ''}</p>
          <p style="font-size:14px;color:#9CA3AF;margin:0;">${profile?.business_phone || ''}</p>
        </div>
      </div>
      <div style="text-align:right;">
        <h3 style="font-size:18px;font-weight:600;color:#F9FAFB;margin:0 0 4px;">INVOICE</h3>
        <p style="font-size:14px;color:#9CA3AF;margin:0;">${invoice.invoice_number}</p>
        <p style="font-size:14px;color:#9CA3AF;margin:0;">Date: ${formatDate(invoice.invoice_date)}</p>
        <p style="font-size:14px;color:#9CA3AF;margin:0;">Due: ${formatDate(invoice.due_date)}</p>
      </div>
    </div>
    <div style="margin-bottom:32px;">
      <h4 style="font-size:11px;font-weight:500;color:#6B7280;text-transform:uppercase;margin:0 0 8px;">Bill To</h4>
      <p style="font-size:14px;color:#F9FAFB;font-weight:500;margin:0;">${client?.name || 'No client'}</p>
      <p style="font-size:14px;color:#9CA3AF;margin:0;">${client?.email || ''}</p>
      <p style="font-size:14px;color:#9CA3AF;margin:0;">${client?.address || ''}</p>
    </div>
    ${itemsHtml ? `<div style="margin-bottom:24px;">${itemsHtml}</div>` : ''}
    <div style="display:flex;justify-content:flex-end;">
      <div style="width:256px;">
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:#9CA3AF;">Subtotal</span>
          <span style="color:#F9FAFB;">${formatCurrency(invoice.subtotal, currency)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:#9CA3AF;">Tax</span>
          <span style="color:#F9FAFB;">${formatCurrency(invoice.tax_total, currency)}</span>
        </div>
        ${discountHtml}
        <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;border-top:1px solid #2A2F3A;padding-top:8px;margin-top:8px;">
          <span style="color:#F9FAFB;">Total</span>
          <span style="color:#F9FAFB;">${formatCurrency(invoice.total, currency)}</span>
        </div>
      </div>
    </div>
    ${extrasHtml}
  `;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);

    const [invRes, profileRes] = await Promise.all([
      supabase.from('invoices').select('*, clients(*)').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('users').select('*').eq('id', user.id).maybeSingle(),
    ]);

    if (invRes.error || !invRes.data) {
      setError('Invoice not found');
      setLoading(false);
      return;
    }

    setInvoice(invRes.data as Invoice);
    setClient((invRes.data as any)?.clients || null);
    setProfile(profileRes.data);
    setLoading(false);
  }, [user, id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const markAsPaid = async () => {
    if (!invoice || !user) return;
    setMarkingPaid(true);
    const prevStatus = invoice.status;
    setInvoice({ ...invoice, status: 'paid' });

    const { error: err } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id);
    if (err) {
      setInvoice({ ...invoice, status: prevStatus });
      addToast('error', 'Failed to mark invoice as paid');
      setMarkingPaid(false);
      return;
    }

    const receiptNum = `RCPT-${String(profile?.next_invoice_number || 1).padStart(4, '0')}`;
    const { error: receiptErr } = await supabase.from('receipts').insert({ user_id: user.id, invoice_id: invoice.id, receipt_number: receiptNum });

    if (receiptErr) {
      addToast('warning', 'Invoice marked as paid, but receipt generation failed. Retry from receipts page.');
    } else {
      await supabase.from('users').update({ next_invoice_number: (profile?.next_invoice_number || 1) + 1 }).eq('id', user.id);
      addToast('success', 'Invoice marked as paid', { label: 'View receipt', onClick: () => navigate('/receipts') });
    }

    setMarkingPaid(false);
    fetchInvoice();
  };

  const markAsSent = async () => {
    if (!invoice || !user) return;
    const prevStatus = invoice.status;
    setInvoice({ ...invoice, status: 'sent' });

    const { error: err } = await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoice.id);
    if (err) {
      setInvoice({ ...invoice, status: prevStatus });
      addToast('error', 'Failed to update invoice status');
      return;
    }
    addToast('success', 'Invoice marked as sent');
    fetchInvoice();
  };

  const deleteInvoice = async () => {
    if (!invoice) return;
    setDeleteLoading(true);
    const { error: err } = await supabase.from('invoices').delete().eq('id', invoice.id);
    setDeleteLoading(false);
    if (err) {
      addToast('error', 'Failed to delete invoice');
    } else {
      addToast('success', 'Invoice deleted');
      navigate('/invoices');
    }
    setDeleteModal(false);
  };

  const [downloading, setDownloading] = useState(false);

  const downloadPdf = async () => {
    if (!invoice || loading || downloading) return;
    setDownloading(true);
    addToast('info', 'Generating PDF...');

    try {
      const html = buildInvoiceHtml(invoice, client, profile);
      await generatePdf(html, `${invoice.invoice_number}.pdf`);
      addToast('success', 'Invoice downloaded');
    } catch {
      addToast('error', 'PDF generation failed', { label: 'Retry', onClick: downloadPdf });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div>
        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/invoices')}>Back to Invoices</Button>
        <ErrorState message={error || 'Invoice not found'} onRetry={fetchInvoice} />
      </div>
    );
  }

  const currency = invoice.currency || 'USD';
  const logoUrl = profile?.business_logo_url;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/invoices')}>Back</Button>
          <h1 className="text-h1 font-semibold text-text-primary">{invoice.invoice_number}</h1>
          <Badge variant={invoice.status} />
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'draft' && (
            <Button variant="secondary" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={markAsSent}>Mark as Sent</Button>
          )}
          {invoice.status !== 'paid' && (
            <Button variant="primary" size="sm" icon={<CheckCircle className="w-3.5 h-3.5" />} onClick={markAsPaid} loading={markingPaid}>Mark as Paid</Button>
          )}
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={downloadPdf} loading={downloading} disabled={loading}>PDF</Button>
          <Button variant="ghost" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>Edit</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteModal(true)} />
        </div>
      </div>

      <div id="invoice-preview" className="rounded-card border border-base-border bg-base-card p-8">
        <div className="flex justify-between mb-8">
          <div className="flex items-start gap-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-sm shrink-0" crossOrigin="anonymous" />
            )}
            <div>
              <h2 className="text-h2 font-semibold text-text-primary mb-1">{profile?.business_name || 'Your Business'}</h2>
              <p className="text-body-m text-text-secondary">{profile?.business_email || ''}</p>
              <p className="text-body-m text-text-secondary">{profile?.business_address || ''}</p>
              <p className="text-body-m text-text-secondary">{profile?.business_phone || ''}</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-h3 font-semibold text-text-primary mb-1">INVOICE</h3>
            <p className="text-body-m text-text-secondary">{invoice.invoice_number}</p>
            <p className="text-body-m text-text-secondary">Date: {formatDate(invoice.invoice_date)}</p>
            <p className="text-body-m text-text-secondary">Due: {formatDate(invoice.due_date)}</p>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-caption font-medium text-text-muted uppercase mb-2">Bill To</h4>
          <p className="text-body-m text-text-primary font-medium">{client?.name || 'No client'}</p>
          <p className="text-body-m text-text-secondary">{client?.email || ''}</p>
          <p className="text-body-m text-text-secondary">{client?.address || ''}</p>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="text-caption text-text-muted border-b border-base-border">
              <th className="text-left py-2 font-medium">Description</th>
              <th className="text-right py-2 font-medium">Qty</th>
              <th className="text-right py-2 font-medium">Rate</th>
              <th className="text-right py-2 font-medium">Tax</th>
              <th className="text-right py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-border">
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="py-3 text-body-m text-text-primary">{item.description}</td>
                <td className="py-3 text-body-m text-text-secondary text-right">{item.quantity}</td>
                <td className="py-3 text-body-m text-text-secondary text-right">{formatCurrency(item.rate, currency)}</td>
                <td className="py-3 text-body-m text-text-secondary text-right">{item.tax}%</td>
                <td className="py-3 text-body-m text-text-primary text-right">{formatCurrency(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-body-m">
              <span className="text-text-secondary">Subtotal</span>
              <span className="text-text-primary">{formatCurrency(invoice.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-body-m">
              <span className="text-text-secondary">Tax</span>
              <span className="text-text-primary">{formatCurrency(invoice.tax_total, currency)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-body-m">
                <span className="text-text-secondary">Discount</span>
                <span className="text-status-error">-{formatCurrency(invoice.discount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-body-m font-semibold border-t border-base-border pt-2">
              <span className="text-text-primary">Total</span>
              <span className="text-text-primary">{formatCurrency(invoice.total, currency)}</span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.payment_terms) && (
          <div className="mt-8 pt-6 border-t border-base-border">
            {invoice.payment_terms && (
              <div className="mb-3">
                <h4 className="text-caption font-medium text-text-muted uppercase mb-1">Payment Terms</h4>
                <p className="text-body-m text-text-secondary">{invoice.payment_terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <h4 className="text-caption font-medium text-text-muted uppercase mb-1">Notes</h4>
                <p className="text-body-m text-text-secondary">{invoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={deleteInvoice}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice.invoice_number}?`}
        warning="This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
}
