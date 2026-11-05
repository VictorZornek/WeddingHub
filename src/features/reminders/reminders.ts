import { supabase } from '@/lib/supabase';
import type { Reminder } from '@/types/database';

export async function fetchReminders(weddingId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('wedding_id', weddingId)
    .is('installment_id', null)
    .order('remind_at');
  return error ? null : (data as Reminder[]);
}

export async function fetchReminder(reminderId: string) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('id', reminderId)
    .maybeSingle<Reminder>();
  return error ? null : data;
}

export type ReminderInput = { title: string; notes: string | null; remind_at: string };

export function createReminder(weddingId: string, input: ReminderInput) {
  return supabase.from('reminders').insert({ ...input, wedding_id: weddingId });
}

export function updateReminder(reminderId: string, input: Partial<ReminderInput & { done: boolean }>) {
  return supabase.from('reminders').update(input).eq('id', reminderId);
}

export function deleteReminder(reminderId: string) {
  return supabase.from('reminders').delete().eq('id', reminderId);
}
