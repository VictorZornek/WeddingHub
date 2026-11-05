// Pure guest-list math (no database), so it can be tested on its own.

export type Rsvp = 'pending' | 'confirmed' | 'declined';

export const RSVP_LABELS: Record<Rsvp, string> = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  declined: 'Não vai',
};

export type Guest = {
  id: string;
  name: string;
  group_name: string | null;
  companions: number;
  rsvp: Rsvp;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

/** People = the guest plus their companions. */
export function peopleOf(guest: Pick<Guest, 'companions'>) {
  return 1 + guest.companions;
}

export type GuestSummary = {
  invites: number;
  people: number;
  confirmedPeople: number;
  pendingPeople: number;
  declinedPeople: number;
};

export function summarizeGuests(guests: Pick<Guest, 'companions' | 'rsvp'>[]): GuestSummary {
  const sumFor = (rsvp: Rsvp) =>
    guests.filter((g) => g.rsvp === rsvp).reduce((sum, g) => sum + peopleOf(g), 0);
  return {
    invites: guests.length,
    people: guests.reduce((sum, g) => sum + peopleOf(g), 0),
    confirmedPeople: sumFor('confirmed'),
    pendingPeople: sumFor('pending'),
    declinedPeople: sumFor('declined'),
  };
}

// Guests grouped by group name (no group last), each group sorted by name.
export function groupGuests<T extends Pick<Guest, 'name' | 'group_name'>>(guests: T[]) {
  const groups = new Map<string, T[]>();
  for (const guest of guests) {
    const key = guest.group_name?.trim() || '';
    groups.set(key, [...(groups.get(key) ?? []), guest]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
    .map(([name, list]) => ({
      name: name || 'Sem grupo',
      guests: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
