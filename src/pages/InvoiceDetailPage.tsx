import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, Trash2, Edit3, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Invoice, Client } from '../lib/types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';
import { CardSkeleton } from '../components/ui/Skeleton';
import ConfirmModal from '../components/ui/ConfirmModal';

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

  const downloadPdf = () => {
    addToast('info', 'Generating PDF...');
    const el = document.getElementById('invoice-preview');
    if (!el) {
      addToast('error', 'PDF generation failed', { label: 'Retry', onClick: downloadPdf });
      return;
    }
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText = 'position:fixed;left:-9999px;top:0;width:700px;padding:40px;background:#0B0F14;color:#F9FAFB;font-family:sans-serif;';
    document.body.appendChild(clone);

    import('html2pdf.js').then((mod) => {
      const generator = mod.default();
      generator.set({
        margin: [10, 10, 10, 10],
        filename: `${invoice?.invoice_number || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0B0F14' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(clone).save().then(() => {
        document.body.removeChild(clone);
        addToast('success', 'Invoice downloaded');
      }).catch(() => {
        document.body.removeChild(clone);
        addToast('error', 'PDF generation failed', { label: 'Retry', onClick: downloadPdf });
      });
    }).catch(() => {
      document.body.removeChild(clone);
      addToast('error', 'PDF export not available', { label: 'Retry', onClick: downloadPdf });
    });
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
          <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={downloadPdf}>PDF</Button>
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
