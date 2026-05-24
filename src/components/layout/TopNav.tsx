import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Menu, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getInitials, debounce } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface SearchResult {
  id: string;
  type: 'invoice' | 'client' | 'receipt';
  label: string;
  sublabel: string;
  status?: string;
}

interface TopNavProps {
  onToggleSidebar: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);

    const [invoiceRes, clientRes, receiptRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, invoice_number, status, clients(name)')
        .eq('user_id', user?.id)
        .or(`invoice_number.ilike.%${query}%,notes.ilike.%${query}%`)
        .limit(5),
      supabase
        .from('clients')
        .select('id, name, email')
        .eq('user_id', user?.id)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5),
      supabase
        .from('receipts')
        .select('id, receipt_number, invoices(invoice_number)')
        .eq('user_id', user?.id)
        .ilike('receipt_number', `%${query}%`)
        .limit(5),
    ]);

    const r: SearchResult[] = [];
    (invoiceRes.data || []).forEach((inv: any) =>
      r.push({ id: inv.id, type: 'invoice', label: inv.invoice_number, sublabel: inv.clients?.name || 'No client', status: inv.status })
    );
    (clientRes.data || []).forEach((cl: any) =>
      r.push({ id: cl.id, type: 'client', label: cl.name, sublabel: cl.email })
    );
    (receiptRes.data || []).forEach((rc: any) =>
      r.push({ id: rc.id, type: 'receipt', label: rc.receipt_number, sublabel: rc.invoices?.invoice_number || '' })
    );

    setResults(r);
    setSearchLoading(false);
  }, [user?.id]);

  const debouncedSearch = useCallback(debounce(doSearch, 300), [doSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchQuery('');
    setResults([]);
    if (result.type === 'invoice') navigate(`/invoices/${result.id}`);
    else if (result.type === 'client') navigate(`/clients`);
    else if (result.type === 'receipt') navigate(`/receipts/${result.id}`);
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-full w-full bg-base-surface border-b border-base-border flex items-center px-4 gap-4">
      <button onClick={onToggleSidebar} className="md:hidden text-text-secondary hover:text-text-primary">
        <Menu className="w-5 h-5" />
      </button>

      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search across Kashlet"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
              debouncedSearch(e.target.value);
            }}
            onFocus={() => setSearchOpen(true)}
            className="h-9 w-full rounded-sm bg-base-bg border border-base-border pl-9 pr-3 text-body-m text-text-primary placeholder:text-text-muted focus:outline-none focus:border-base-border-focus"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-caption text-text-muted border border-base-border rounded px-1 hidden sm:inline">
            ⌘K
          </kbd>
        </div>

        {searchOpen && (searchQuery || results.length > 0) && (
          <div className="absolute top-full mt-1 w-full bg-base-card border border-base-border rounded-md shadow-xl overflow-hidden">
            {searchLoading && (
              <div className="px-3 py-2 text-body-m text-text-muted">Searching...</div>
            )}
            {!searchLoading && results.length === 0 && searchQuery && (
              <div className="px-3 py-4 text-body-m text-text-muted text-center">
                No results for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
            {!searchLoading && results.length > 0 && (
              <div className="py-1">
                {results.map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleResultClick(r)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-base-surface text-left"
                  >
                    <span className="text-body-m text-text-primary font-medium">{r.label}</span>
                    <span className="text-caption text-text-muted">{r.sublabel}</span>
                    {r.status && <Badge variant={r.status as any} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => navigate('/invoices/new')}>
          <span className="hidden sm:inline">New Invoice</span>
        </Button>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-caption font-semibold hover:bg-accent/30 transition-colors"
          >
            {getInitials(profile?.business_name || user?.email || '')}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-base-card border border-base-border rounded-md shadow-xl overflow-hidden py-1 z-50">
              <div className="px-3 py-2 border-b border-base-border">
                <p className="text-body-m text-text-primary font-medium truncate">{profile?.business_name || 'User'}</p>
                <p className="text-caption text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-body-m text-text-secondary hover:bg-base-surface hover:text-text-primary text-left"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-body-m text-status-error hover:bg-base-surface text-left"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
