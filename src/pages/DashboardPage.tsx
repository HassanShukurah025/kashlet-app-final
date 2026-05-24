import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, DollarSign, Clock, AlertTriangle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Invoice } from '../lib/types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';

interface Stats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [invRes, paidRes, pendingRes, overdueRes, recentRes] = await Promise.all([
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('invoices').select('total').eq('user_id', user.id).eq('status', 'paid'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'sent'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'overdue'),
      supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (invRes.error || recentRes.error) {
      setError('Failed to load dashboard data');
      setLoading(false);
      return;
    }

    const totalRevenue = (paidRes.data || []).reduce((sum, i) => sum + Number(i.total), 0);

    setStats({
      total: invRes.count || 0,
      paid: paidRes.data?.length || 0,
      pending: pendingRes.count || 0,
      overdue: overdueRes.count || 0,
      totalRevenue,
    });
    setRecentInvoices(recentRes.data as Invoice[] || []);
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, [user]);

  if (loading) {
    return (
      <div>
        <h1 className="text-h1 font-semibold text-text-primary mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-h1 font-semibold text-text-primary mb-6">Dashboard</h1>
        <ErrorState message={error} onRetry={fetchDashboard} />
      </div>
    );
  }

  const currency = profile?.currency || 'USD';

  return (
    <div>
      <h1 className="text-h1 font-semibold text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-card border border-base-border bg-base-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-accent" />
            </div>
            <span className="text-body-m text-text-secondary">Total Invoices</span>
          </div>
          <p className="text-h2 font-semibold text-text-primary">{stats?.total || 0}</p>
        </div>

        <div className="rounded-card border border-base-border bg-base-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-status-success/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-status-success" />
            </div>
            <span className="text-body-m text-text-secondary">Revenue</span>
          </div>
          <p className="text-h2 font-semibold text-text-primary">{formatCurrency(stats?.totalRevenue || 0, currency)}</p>
        </div>

        <div className="rounded-card border border-base-border bg-base-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-status-info/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-status-info" />
            </div>
            <span className="text-body-m text-text-secondary">Pending</span>
          </div>
          <p className="text-h2 font-semibold text-text-primary">{stats?.pending || 0}</p>
        </div>

        <div className="rounded-card border border-base-border bg-base-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-status-error/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-status-error" />
            </div>
            <span className="text-body-m text-text-secondary">Overdue</span>
          </div>
          <p className="text-h2 font-semibold text-text-primary">{stats?.overdue || 0}</p>
        </div>
      </div>

      <div className="rounded-card border border-base-border bg-base-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-border">
          <h2 className="text-h3 font-semibold text-text-primary">Recent Invoices</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>View all</Button>
        </div>

        {recentInvoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No invoices yet"
            description="Create your first invoice to get started"
            action={
              <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/invoices/new')}>
                Create Invoice
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-caption text-text-muted border-b border-base-border">
                  <th className="text-left px-5 py-3 font-medium">Invoice</th>
                  <th className="text-left px-5 py-3 font-medium">Client</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-border">
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="hover:bg-base-surface/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-body-m text-text-primary font-medium">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-body-m text-text-secondary">{(inv.clients as any)?.name || '—'}</td>
                    <td className="px-5 py-3 text-body-m text-text-primary">{formatCurrency(inv.total, inv.currency)}</td>
                    <td className="px-5 py-3"><Badge variant={inv.status} /></td>
                    <td className="px-5 py-3 text-body-m text-text-secondary">{formatDate(inv.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
