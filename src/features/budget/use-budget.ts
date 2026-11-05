import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useWedding } from '@/providers/wedding-provider';
import type { BudgetItem, Category, Project } from '@/types/database';

export type CategoryWithItems = Category & { budget_items: BudgetItem[] };
export type ProjectWithCategories = Project & { categories: CategoryWithItems[] };

type Loaded = {
  weddingId: string;
  projects: ProjectWithCategories[];
  error: string | null;
};

// Numeric columns arrive as strings or numbers depending on the driver; normalize.
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchBudget(weddingId: string): Promise<Loaded> {
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, name, spending_cap, position, categories(id, project_id, name, spending_cap, position, budget_items(*))'
    )
    .eq('wedding_id', weddingId)
    .order('position')
    .order('position', { referencedTable: 'categories' })
    .order('position', { referencedTable: 'categories.budget_items' });

  if (error) return { weddingId, projects: [], error: 'Não foi possível carregar o orçamento.' };

  const projects = (data as ProjectWithCategories[]).map((project) => ({
    ...project,
    spending_cap: toNumber(project.spending_cap),
    categories: project.categories.map((category) => ({
      ...category,
      spending_cap: toNumber(category.spending_cap),
      budget_items: category.budget_items.map((item) => ({
        ...item,
        estimated_amount: toNumber(item.estimated_amount),
        actual_amount: toNumber(item.actual_amount),
      })),
    })),
  }));

  return { weddingId, projects, error: null };
}

// Projects -> categories -> items for the current wedding.
export function useBudget() {
  const { wedding } = useWedding();
  const weddingId = wedding?.id ?? null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!weddingId) return;
    let isActive = true;
    fetchBudget(weddingId).then((result) => {
      if (isActive) setLoaded(result);
    });
    return () => {
      isActive = false;
    };
  }, [weddingId]);

  const refresh = useCallback(async () => {
    if (!weddingId) return;
    setIsRefreshing(true);
    setLoaded(await fetchBudget(weddingId));
    setIsRefreshing(false);
  }, [weddingId]);

  const current = loaded && loaded.weddingId === weddingId ? loaded : null;

  return {
    projects: current?.projects ?? [],
    error: current?.error ?? null,
    isLoading: !!weddingId && !current,
    isRefreshing,
    refresh,
  };
}
