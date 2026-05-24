export interface User {
  id: string;
  email: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_logo_url: string;
  currency: string;
  tax_enabled: boolean;
  tax_rate: number;
  invoice_prefix: string;
  next_invoice_number: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  tax: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string | null;
  items: InvoiceItem[];
  subtotal: number;
  tax_total: number;
  discount: number;
  total: number;
  currency: string;
  notes: string;
  payment_terms: string;
  created_at: string;
  updated_at: string;
  clients?: Client;
}

export interface Receipt {
  id: string;
  user_id: string;
  invoice_id: string;
  receipt_number: string;
  issued_at: string;
  created_at: string;
  invoices?: Invoice;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
}

export interface InvoiceFormData {
  client_id: string;
  invoice_date: string;
  due_date: string;
  items: InvoiceItem[];
  discount: number;
  notes: string;
  payment_terms: string;
}
