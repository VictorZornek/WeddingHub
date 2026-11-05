import { supabase } from '@/lib/supabase';

import type { Guest, Rsvp } from './summary';

export async function fetchGuests(weddingId: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('name');
  return error ? null : (data as Guest[]);
}

export async function fetchGuest(guestId: string) {
  const { data, error } = await supabase.from('guests').select('*').eq('id', guestId).maybeSingle<Guest>();
  return error ? null : data;
}

export type GuestInput = Omit<Guest, 'id' | 'created_at'>;

export function createGuest(weddingId: string, input: GuestInput) {
  return supabase.from('guests').insert({ ...input, wedding_id: weddingId });
}

export function updateGuest(guestId: string, input: Partial<GuestInput>) {
  return supabase.from('guests').update(input).eq('id', guestId);
}

export function setGuestRsvp(guestId: string, rsvp: Rsvp) {
  return updateGuest(guestId, { rsvp });
}

export function deleteGuest(guestId: string) {
  return supabase.from('guests').delete().eq('id', guestId);
}
