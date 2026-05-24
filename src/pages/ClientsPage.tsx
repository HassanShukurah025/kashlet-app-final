import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Edit3, Trash2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { Client, ClientFormData } from '../lib/types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { TableSkeleton } from '../components/ui/Skeleton';
import ConfirmModal from '../components/ui/ConfirmModal';

const emptyForm: ClientFormData = { name: '', email: '', phone: '', address: '', tax_id: '' };

export default function ClientsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    let query = supabase.from('clients').select('*').eq('user_id', user.id).order('name');
    if (searchQuery) query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    const { data, error: err } = await query;
    if (err) setError('Failed to load clients');
    else setClients((data as Client[]) || []);
    setLoading(false);
  }, [user, searchQuery]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const openCreateModal = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setForm({ name: client.name, email: client.email, phone: client.phone, address: client.address, tax_id: client.tax_id });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!user || !validate()) return;
    setSaving(true);

    try {
      if (editingClient) {
        const { error: err } = await supabase.from('clients').update(form).eq('id', editingClient.id);
        if (err) throw err;
        addToast('success', 'Client updated');
      } else {
        const { error: err } = await supabase.from('clients').insert({ ...form, user_id: user.id });
        if (err) throw err;
        addToast('success', 'Client added');
      }
      setModalOpen(false);
      fetchClients();
    } catch {
      addToast('error', 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = async () => {
    if (!deleteModal.client) return;
    setDeleteLoading(true);
    const { error: err } = await supabase.from('clients').delete().eq('id', deleteModal.client.id);
    setDeleteLoading(false);
    if (err) {
      addToast('error', 'Failed to delete client');
    } else {
      setClients((prev) => prev.filter((c) => c.id !== deleteModal.client!.id));
      addToast('success', 'Client deleted');
    }
    setDeleteModal({ open: false, client: null });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 font-semibold text-text-primary">Clients</h1>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>Add Client</Button>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-sm bg-base-bg border border-base-border pl-9 pr-3 text-body-m text-text-primary placeholder:text-text-muted focus:outline-none focus:border-base-border-focus"
        />
      </div>

      {loading ? (
        <div className="rounded-card border border-base-border bg-base-card"><TableSkeleton rows={5} /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchClients} />
      ) : clients.length === 0 ? (
        <div className="rounded-card border border-base-border bg-base-card">
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={searchQuery ? 'No matching clients' : 'No clients yet'}
            description={searchQuery ? 'Try adjusting your search' : 'Add your first client to start creating invoices'}
            action={<Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>Add Client</Button>}
          />
        </div>
      ) : (
        <div className="rounded-card border border-base-border bg-base-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-caption text-text-muted border-b border-base-border">
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Phone</th>
                  <th className="text-left px-5 py-3 font-medium">Address</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-border">
                {clients.map((cl) => (
                  <tr key={cl.id} className="hover:bg-base-surface/50 transition-colors">
                    <td className="px-5 py-3 text-body-m text-text-primary font-medium">{cl.name}</td>
                    <td className="px-5 py-3 text-body-m text-text-secondary">{cl.email || '—'}</td>
                    <td className="px-5 py-3 text-body-m text-text-secondary">{cl.phone || '—'}</td>
                    <td className="px-5 py-3 text-body-m text-text-secondary max-w-[200px] truncate">{cl.address || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" icon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => openEditModal(cl)} />
                        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteModal({ open: true, client: cl })} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClient ? 'Edit Client' : 'Add Client'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>{editingClient ? 'Save Changes' : 'Add Client'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Client name" error={formErrors.name} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" error={formErrors.email} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          <Input label="Tax ID" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} placeholder="Tax identification number" />
        </div>
      </Modal>

      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, client: null })}
        onConfirm={deleteClient}
        title="Delete Client"
        message={`Are you sure you want to delete ${deleteModal.client?.name}?`}
        warning="Associated invoices will lose their client reference."
        loading={deleteLoading}
      />
    </div>
  );
}
