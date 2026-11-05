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

export type BudgetItemStatus = 'to_define' | 'included' | 'closed';

export type BudgetItem = {
  id: string;
  category_id: string;
  name: string;
  estimated_amount: number | null;
  actual_amount: number | null;
  status: BudgetItemStatus;
  notes: string | null;
  position: number;
};

export type Category = {
  id: string;
  project_id: string;
  name: string;
  spending_cap: number | null;
  position: number;
};

export type Project = {
  id: string;
  name: string;
  spending_cap: number | null;
  position: number;
};
