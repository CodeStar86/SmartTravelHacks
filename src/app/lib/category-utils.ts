import { logger } from './logger';
const LEGACY_AI_CATEGORY_SLUGS = new Set(['ai-tools', 'news', 'tutorials', 'reviews']);
const LEGACY_AI_CATEGORY_NAMES = new Set(['ai tools', 'news', 'tutorials', 'reviews']);

export function isLegacyAICategory(category: any): boolean {
  const slug = String(category?.slug || '').trim().toLowerCase();
  const name = String(category?.name || '').trim().toLowerCase();
  return LEGACY_AI_CATEGORY_SLUGS.has(slug) || LEGACY_AI_CATEGORY_NAMES.has(name);
}

export function filterLegacyAICategories<T extends { slug?: string; name?: string }>(categories: T[] | null | undefined): T[] {
  if (!Array.isArray(categories)) return [];
  return categories.filter((category) => !isLegacyAICategory(category));
}

export async function cleanupLegacyAICategories(
  listCategories: () => Promise<any[]>,
  deleteCategory: (id: string) => Promise<any>
): Promise<{ removed: number }> {
  let categories: any[] = [];
  try {
    categories = await listCategories();
  } catch (error) {
    logger.warn('Skipping legacy category cleanup because categories API is unavailable:', error);
    return { removed: 0 };
  }
  const legacyCategories = filterLegacyAICategories(categories).length === categories.length
    ? []
    : (categories || []).filter((category) => isLegacyAICategory(category));

  if (legacyCategories.length === 0) {
    return { removed: 0 };
  }

  let removed = 0;
  for (const category of legacyCategories) {
    if (!category?.id) continue;
    try {
      await deleteCategory(category.id);
      removed += 1;
    } catch (error) {
      logger.warn('Failed to remove legacy AI category:', category, error);
    }
  }

  return { removed };
}
