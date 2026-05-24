import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, MoreHorizontal, Download, Trash2, CheckCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate, classNames } from '../lib/utils';
import type { Invoice, InvoiceStatus } from '../lib/types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { TableSkeleton } from '../components/ui/Skeleton';
import ConfirmModal from '../components/ui/ConfirmModal';

const statusFilters: { value: InvoiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from('invoices')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (searchQuery) query = query.or(`invoice_number.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`);

    const { data, error: err } = await query;
    if (err) {
      setError('Failed to load invoices');
    } else {
      setInvoices((data as Invoice[]) || []);
    }
    setLoading(false);
  }, [user, statusFilter, searchQuery]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  useEffect(() => {
    const handler = () => setOpenMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const markAsPaid = async (invoice: Invoice) => {
    const prevStatus = invoice.status;
    setInvoices((prev) => prev.map((i) => i.id === invoice.id ? { ...i, status: 'paid' } : i));

    const { error: err } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoice.id);

    if (err) {
      setInvoices((prev) => prev.map((i) => i.id === invoice.id ? { ...i, status: prevStatus } : i));
      addToast('error', 'Failed to update invoice status');
      return;
    }

    const { data: prof } = await supabase.from('users').select('next_invoice_number').eq('id', user!.id).maybeSingle();
    const nextNum = prof?.next_invoice_number || 1;
    const receiptNum = `RCPT-${String(nextNum).padStart(4, '0')}`;
    const { error: receiptErr } = await supabase.from('receipts').insert({
      user_id: user!.id,
      invoice_id: invoice.id,
      receipt_number: receiptNum,
    });

    if (receiptErr) {
      addToast('warning', 'Invoice marked as paid, but receipt generation failed. Retry from receipts page.');
    } else {
      await supabase.from('users').update({ next_invoice_number: nextNum + 1 }).eq('id', user!.id);
      addToast('success', 'Invoice marked as paid', {
        label: 'View receipt',
        onClick: () => navigate('/receipts'),
      });
    }

    fetchInvoices();
  };

  const deleteInvoice = async () => {
    if (!deleteModal.invoice) return;
    setDeleteLoading(true);
    const { error: err } = await supabase.from('invoices').delete().eq('id', deleteModal.invoice.id);
    setDeleteLoading(false);
    if (err) {
      addToast('error', 'Failed to delete invoice');
    } else {
      setInvoices((prev) => prev.filter((i) => i.id !== deleteModal.invoice!.id));
      addToast('success', 'Invoice deleted');
    }
    setDeleteModal({ open: false, invoice: null });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 font-semibold text-text-primary">Invoices</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-base-card rounded-sm border border-base-border p-0.5">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={classNames(
                'px-3 py-1.5 rounded-sm text-body-m font-medium transition-colors',
                statusFilter === f.value ? 'bg-base-surface text-text-primary' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-sm bg-base-bg border border-base-border pl-9 pr-3 text-body-m text-text-primary placeholder:text-text-muted focus:outline-none focus:border-base-border-focus"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-card border border-base-border bg-base-card">
          <TableSkeleton rows={6} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInvoices} />
      ) : invoices.length === 0 ? (
        <div className="rounded-card border border-base-border bg-base-card">
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title={searchQuery || statusFilter !== 'all' ? 'No matching invoices' : 'No invoices yet'}
            description={searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Create your first invoice to get started'}
            action={
              <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/invoices/new')}>
                Create Invoice
              </Button>
            }
          />
        </div>
      ) : (
        <div className="rounded-card border border-base-border bg-base-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-caption text-text-muted border-b border-base-border">
                  <th className="text-left px-5 py-3 font-medium">Invoice</th>
                  <th className="text-left px-5 py-3 font-medium">Client</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                  <th className="text-left px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-border">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="hover:bg-base-surface/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-body-m text-text-primary font-medium">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-body-m text-text-secondary">{(inv.clients as any)?.name || '—'}</td>
                    <td className="px-5 py-3 text-body-m text-text-primary">{formatCurrency(inv.total, inv.currency)}</td>
                    <td className="px-5 py-3"><Badge variant={inv.status} /></td>
                    <td className="px-5 py-3 text-body-m text-text-secondary">{formatDate(inv.invoice_date)}</td>
                    <td className="px-5 py-3 text-body-m text-text-secondary">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === inv.id ? null : inv.id); }}
                          className="p-1 text-text-muted hover:text-text-secondary"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {openMenu === inv.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-base-card border border-base-border rounded-md shadow-xl z-10 py-1">
                            <button
                              onClick={() => { setOpenMenu(null); navigate(`/invoices/${inv.id}`); }}
                              className="w-full text-left px-3 py-2 text-body-m text-text-secondary hover:bg-base-surface hover:text-text-primary"
                            >
                              View
                            </button>
                            {inv.status !== 'paid' && (
                              <button
                                onClick={() => { setOpenMenu(null); markAsPaid(inv); }}
                                className="w-full text-left px-3 py-2 text-body-m text-status-success hover:bg-base-surface flex items-center gap-2"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
                              </button>
                            )}
                            <button
                              onClick={() => { setOpenMenu(null); setDeleteModal({ open: true, invoice: inv }); }}
                              className="w-full text-left px-3 py-2 text-body-m text-status-error hover:bg-base-surface flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, invoice: null })}
        onConfirm={deleteInvoice}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteModal.invoice?.invoice_number}?`}
        warning="This action cannot be undone."
        loading={deleteLoading}
      />
    </div>
  );
}
