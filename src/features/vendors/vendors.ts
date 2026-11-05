import { toNumber } from '@/features/budget/items';
import { supabase } from '@/lib/supabase';

export type QuoteStatus = 'open' | 'chosen' | 'rejected';

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  open: 'Em aberto',
  chosen: 'Escolhida',
  rejected: 'Descartada',
};

export type Quote = {
  id: string;
  vendor_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  includes: string | null;
  valid_until: string | null;
  status: QuoteStatus;
  notes: string | null;
  created_at: string;
};

export type Vendor = {
  id: string;
  category_id: string | null;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type VendorWithQuotes = Vendor & {
  quotes: Quote[];
  categories: { name: string } | null;
};

function normalizeQuote(quote: Quote): Quote {
  return { ...quote, amount: toNumber(quote.amount) ?? 0 };
}

function normalizeVendor(vendor: VendorWithQuotes): VendorWithQuotes {
  return { ...vendor, quotes: vendor.quotes.map(normalizeQuote) };
}

const VENDOR_SELECT = '*, quotes(*), categories(name)';

export async function fetchVendors(weddingId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('wedding_id', weddingId)
    .order('name');
  return error ? null : (data as VendorWithQuotes[]).map(normalizeVendor);
}

export async function fetchVendor(vendorId: string) {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_SELECT)
    .eq('id', vendorId)
    .maybeSingle<VendorWithQuotes>();
  return error || !data ? null : normalizeVendor(data);
}

export type VendorInput = Omit<Vendor, 'id' | 'created_at'>;

export function createVendor(weddingId: string, input: VendorInput) {
  return supabase
    .from('vendors')
    .insert({ ...input, wedding_id: weddingId })
    .select('id')
    .single<{ id: string }>();
}

export function updateVendor(vendorId: string, input: VendorInput) {
  return supabase.from('vendors').update(input).eq('id', vendorId);
}

export function deleteVendor(vendorId: string) {
  return supabase.from('vendors').delete().eq('id', vendorId);
}

export async function fetchQuote(quoteId: string) {
  const { data, error } = await supabase.from('quotes').select('*').eq('id', quoteId).maybeSingle<Quote>();
  return error || !data ? null : normalizeQuote(data);
}

export type QuoteInput = Pick<
  Quote,
  'category_id' | 'description' | 'amount' | 'includes' | 'valid_until' | 'notes'
>;

export function createQuote(weddingId: string, vendorId: string, input: QuoteInput) {
  return supabase.from('quotes').insert({ ...input, wedding_id: weddingId, vendor_id: vendorId });
}

export function updateQuote(quoteId: string, input: QuoteInput) {
  return supabase.from('quotes').update(input).eq('id', quoteId);
}

export function deleteQuote(quoteId: string) {
  return supabase.from('quotes').delete().eq('id', quoteId);
}

export type CategoryOption = { id: string; name: string; project: string };

// Every category of the wedding, with its project name for context.
export async function fetchCategoryOptions(weddingId: string): Promise<CategoryOption[]> {
  const { data } = await supabase
    .from('categories')
    .select('id, name, position, projects(name, position)')
    .eq('wedding_id', weddingId);
  type Row = { id: string; name: string; position: number; projects: { name: string; position: number } | null };
  return ((data ?? []) as unknown as Row[])
    .sort(
      (a, b) =>
        (a.projects?.position ?? 0) - (b.projects?.position ?? 0) || a.position - b.position
    )
    .map((row) => ({ id: row.id, name: row.name, project: row.projects?.name ?? '' }));
}

// Lowest open-or-chosen quote of a vendor, for the list.
export function bestQuote(quotes: Quote[]) {
  return quotes
    .filter((q) => q.status !== 'rejected')
    .reduce<Quote | null>((best, q) => (!best || q.amount < best.amount ? q : best), null);
}
