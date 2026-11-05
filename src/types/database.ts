// Row shapes used by the app. Keep in sync with supabase/migrations.

export type Wedding = {
  id: string;
  name: string;
  wedding_date: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
};

export type MemberRole = 'owner' | 'partner';
