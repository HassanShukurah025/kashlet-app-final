import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { formatCurrency, calculateInvoiceTotals, generateInvoiceNumber } from '../lib/utils';
import type { InvoiceItem, Client } from '../lib/types';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ErrorState from '../components/ui/ErrorState';

const emptyItem = (): InvoiceItem => ({ description: '', quantity: 1, rate: 0, tax: 0, total: 0 });

export default function InvoiceBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { addToast } = useToast();
  const isEditing = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchClients = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('clients').select('*').eq('user_id', user.id).order('name');
    setClients((data as Client[]) || []);
  }, [user]);

  const fetchInvoice = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    const { data } = await supabase.from('invoices').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (data) {
      setClientId(data.client_id || '');
      setInvoiceDate(data.invoice_date || '');
      setDueDate(data.due_date || '');
      setItems(data.items.length ? data.items : [emptyItem()]);
      setDiscount(data.discount);
      setNotes(data.notes);
      setPaymentTerms(data.payment_terms);
    }
    setLoading(false);
  }, [user, id]);

  useEffect(() => { fetchClients(); fetchInvoice(); }, [fetchClients, fetchInvoice]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const q = Number(updated[index].quantity) || 0;
      const r = Number(updated[index].rate) || 0;
      const t = Number(updated[index].tax) || 0;
      const sub = q * r;
      updated[index].total = Math.round((sub + sub * (t / 100)) * 100) / 100;
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!clientId) e.clientId = 'Select a client';
    if (!invoiceDate) e.invoiceDate = 'Invoice date is required';
    items.forEach((item, i) => {
      if (!item.description) e[`item_${i}_desc`] = 'Description required';
      if (item.quantity <= 0) e[`item_${i}_qty`] = 'Quantity must be positive';
      if (item.rate <= 0) e[`item_${i}_rate`] = 'Rate must be positive';
    });
    setErrors(e);
    if (Object.keys(e).length > 0) {
      addToast('error', 'Please fix the highlighted fields');
      return false;
    }
    return true;
  };

  const totals = calculateInvoiceTotals(items, discount);
  const currency = profile?.currency || 'USD';

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!user || !validate()) return;
    setSaving(true);

    try {
      if (isEditing) {
        const { error: err } = await supabase.from('invoices').update({
          client_id: clientId,
          status,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          items,
          subtotal: totals.subtotal,
          tax_total: totals.tax_total,
          discount,
          total: totals.total,
          currency,
          notes,
          payment_terms: paymentTerms,
        }).eq('id', id);

        if (err) throw err;
        addToast('success', 'Invoice updated successfully');
        navigate(`/invoices/${id}`);
      } else {
        const { data: prof } = await supabase.from('users').select('invoice_prefix, next_invoice_number').eq('id', user.id).maybeSingle();
        const invNum = generateInvoiceNumber(prof?.invoice_prefix || 'INV', prof?.next_invoice_number || 1);

        const { data: newInv, error: err } = await supabase.from('invoices').insert({
          user_id: user.id,
          client_id: clientId,
          invoice_number: invNum,
          status,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          items,
          subtotal: totals.subtotal,
          tax_total: totals.tax_total,
          discount,
          total: totals.total,
          currency,
          notes,
          payment_terms: paymentTerms,
        }).select().maybeSingle();

        if (err) throw err;

        await supabase.from('users').update({ next_invoice_number: (prof?.next_invoice_number || 1) + 1 }).eq('id', user.id);

        addToast('success', 'Invoice created successfully');
        navigate(`/invoices/${newInv?.id}`);
      }
    } catch {
      addToast('error', 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-10 bg-base-border rounded w-1/3" /><div className="h-40 bg-base-border rounded" /></div>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => { fetchClients(); fetchInvoice(); }} />;
  }

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>Back</Button>
        <h1 className="text-h1 font-semibold text-text-primary">{isEditing ? 'Edit Invoice' : 'Create Invoice'}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-card border border-base-border bg-base-card p-5">
            <h3 className="text-h3 font-semibold text-text-primary mb-4">Client Details</h3>
            <Select
              label="Client"
              options={clientOptions}
              placeholder="Select a client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              error={errors.clientId}
            />
          </div>

          <div className="rounded-card border border-base-border bg-base-card p-5">
            <h3 className="text-h3 font-semibold text-text-primary mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Invoice Date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                error={errors.invoiceDate}
              />
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-card border border-base-border bg-base-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h3 font-semibold text-text-primary">Items</h3>
              <Button variant="ghost" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addItem}>Add Item</Button>
            </div>

            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 sm:col-span-4">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(i, 'description', e.target.value)}
                      error={errors[`item_${i}_desc`]}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      placeholder="Qty"
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                      error={errors[`item_${i}_qty`]}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Input
                      placeholder="Rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate || ''}
                      onChange={(e) => updateItem(i, 'rate', Number(e.target.value))}
                      error={errors[`item_${i}_rate`]}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Input
                      placeholder="Tax %"
                      type="number"
                      min="0"
                      value={item.tax || ''}
                      onChange={(e) => updateItem(i, 'tax', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-1 flex items-center">
                    <span className="text-body-m text-text-primary font-medium pt-6">{formatCurrency(item.total, currency)}</span>
                  </div>
                  <div className="col-span-1 flex items-center pt-6">
                    <button onClick={() => removeItem(i)} className="text-text-muted hover:text-status-error" disabled={items.length <= 1}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card border border-base-border bg-base-card p-5 space-y-4">
            <Input
              label="Discount"
              type="number"
              min="0"
              step="0.01"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            <Textarea
              label="Payment Terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g. Payment due within 30 days"
            />
            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the client"
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-card border border-base-border bg-base-card p-5 sticky top-20">
            <h3 className="text-h3 font-semibold text-text-primary mb-4">Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-body-m">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">{formatCurrency(totals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-body-m">
                <span className="text-text-secondary">Tax</span>
                <span className="text-text-primary">{formatCurrency(totals.tax_total, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-body-m">
                  <span className="text-text-secondary">Discount</span>
                  <span className="text-status-error">-{formatCurrency(discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-body-m font-semibold border-t border-base-border pt-3">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">{formatCurrency(totals.total, currency)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => handleSave('sent')} loading={saving}>Save & Send</Button>
              <Button variant="secondary" className="w-full" onClick={() => handleSave('draft')} loading={saving}>Save as Draft</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
