import { useState, useEffect, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { CURRENCIES } from '../lib/utils';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_logo_url: '',
    currency: 'USD',
    tax_enabled: false,
    tax_rate: 0,
    invoice_prefix: 'INV',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || '',
        business_address: profile.business_address || '',
        business_phone: profile.business_phone || '',
        business_logo_url: profile.business_logo_url || '',
        currency: profile.currency || 'USD',
        tax_enabled: profile.tax_enabled || false,
        tax_rate: profile.tax_rate || 0,
        invoice_prefix: profile.invoice_prefix || 'INV',
      });
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile && user) {
      supabase.from('users').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
        if (data) {
          setForm({
            business_name: data.business_name || '',
            business_address: data.business_address || '',
            business_phone: data.business_phone || '',
            business_logo_url: data.business_logo_url || '',
            currency: data.currency || 'USD',
            tax_enabled: data.tax_enabled || false,
            tax_rate: data.tax_rate || 0,
            invoice_prefix: data.invoice_prefix || 'INV',
          });
        }
        setLoading(false);
      });
    }
  }, [profile, user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', 'Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'Logo must be under 2MB');
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/logo.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('logos')
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      addToast('error', 'Failed to upload logo');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase
      .from('users')
      .update({ business_logo_url: publicUrl })
      .eq('id', user.id);

    setUploading(false);

    if (updateErr) {
      addToast('error', 'Failed to save logo URL');
    } else {
      setForm({ ...form, business_logo_url: publicUrl });
      refreshProfile();
      addToast('success', 'Logo uploaded');
    }
  };

  const removeLogo = async () => {
    if (!user) return;
    const { error: err } = await supabase
      .from('users')
      .update({ business_logo_url: '' })
      .eq('id', user.id);

    if (err) {
      addToast('error', 'Failed to remove logo');
    } else {
      setForm({ ...form, business_logo_url: '' });
      refreshProfile();
      addToast('success', 'Logo removed');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error: err } = await supabase.from('users').update(form).eq('id', user.id);
    setSaving(false);
    if (err) {
      addToast('error', 'Failed to save settings');
    } else {
      refreshProfile();
      addToast('success', 'Settings saved');
    }
  };

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const currencyOptions = CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }));

  return (
    <div>
      <h1 className="text-h1 font-semibold text-text-primary mb-6">Settings</h1>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-card border border-base-border bg-base-card p-5">
          <h3 className="text-h3 font-semibold text-text-primary mb-4">Business Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-body-m font-medium text-text-secondary mb-1.5 block">Business Logo</label>
              <div className="flex items-center gap-4">
                {form.business_logo_url ? (
                  <div className="relative w-16 h-16 rounded-sm bg-base-bg border border-base-border overflow-hidden">
                    <img src={form.business_logo_url} alt="Logo" className="w-full h-full object-contain" />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-status-error text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-16 h-16 rounded-sm border-2 border-dashed border-base-border hover:border-accent/50 flex items-center justify-center text-text-muted hover:text-accent transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {form.business_logo_url ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-caption text-text-muted mt-1">PNG, JPG up to 2MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
            <Input label="Business Name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="Your business name" />
            <Input label="Address" value={form.business_address} onChange={(e) => setForm({ ...form, business_address: e.target.value })} placeholder="Business address" />
            <Input label="Phone" value={form.business_phone} onChange={(e) => setForm({ ...form, business_phone: e.target.value })} placeholder="+1 234 567 890" />
          </div>
        </div>

        <div className="rounded-card border border-base-border bg-base-card p-5">
          <h3 className="text-h3 font-semibold text-text-primary mb-4">Invoice Settings</h3>
          <div className="space-y-4">
            <Select label="Currency" options={currencyOptions} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            <Input label="Invoice Prefix" value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} placeholder="INV" helper="Used for invoice numbering (e.g. INV-0001)" />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="tax-enabled"
                checked={form.tax_enabled}
                onChange={(e) => setForm({ ...form, tax_enabled: e.target.checked })}
                className="w-4 h-4 rounded border-base-border bg-base-bg accent-accent"
              />
              <label htmlFor="tax-enabled" className="text-body-m text-text-secondary">Enable tax/VAT</label>
            </div>
            {form.tax_enabled && (
              <Input label="Default Tax Rate (%)" type="number" min="0" max="100" step="0.1" value={form.tax_rate || ''} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} />
            )}
          </div>
        </div>

        <div className="rounded-card border border-base-border bg-base-card p-5">
          <h3 className="text-h3 font-semibold text-text-primary mb-4">Account</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-m text-text-primary">{user?.email}</p>
                <p className="text-caption text-text-muted">Signed in</p>
              </div>
              <Button variant="ghost" onClick={signOut}>Sign out</Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
