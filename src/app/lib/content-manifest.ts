import type { Category, Post, Tag } from '../types';

export interface ContentManifest {
  generatedAt: string;
  siteUrl: string;
  posts: Post[];
  categories: Category[];
  tags: Tag[];
}

declare global {
  interface Window {
    __CONTENT_MANIFEST__?: ContentManifest;
  }
}

let manifestPromise: Promise<ContentManifest | null> | null = null;

export function normalizeTaxonomyValue(value: any) {
  return String(value || '').trim().toLowerCase();
}

export function slugifyTaxonomyValue(value: any) {
  return normalizeTaxonomyValue(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function taxonomyCandidateValues(value: any): any[] {
  if (value === null || value === undefined) return [];

  // Existing posts have been saved by different app versions. Some store taxonomy
  // selections as IDs, some as slugs/names, and some as full tag/category objects.
  // Normalize all of those shapes so public tag/category pages can find posts.
  if (typeof value === 'object') {
    return [value.id, value.slug, value.name, value.title, value.label, value.value]
      .filter((entry) => entry !== null && entry !== undefined && entry !== '');
  }

  return [value];
}

function taxonomyValues(values: any): any[] {
  if (Array.isArray(values)) return values.flatMap(taxonomyCandidateValues);
  if (typeof values === 'string' && values.includes(',')) return values.split(',').flatMap(taxonomyCandidateValues);
  return taxonomyCandidateValues(values);
}

export function itemMatchesTaxonomy(value: any, taxonomy: any, slug?: string) {
  const accepted = new Set(
    [...taxonomyCandidateValues(taxonomy), slug]
      .filter(Boolean)
      .flatMap((entry) => {
        const normalized = normalizeTaxonomyValue(entry);
        const slugified = slugifyTaxonomyValue(entry);
        return [normalized, slugified];
      })
      .filter(Boolean)
  );

  return taxonomyCandidateValues(value).some((candidate) => {
    const normalized = normalizeTaxonomyValue(candidate);
    const slugified = slugifyTaxonomyValue(candidate);
    return accepted.has(normalized) || accepted.has(slugified);
  });
}

export function postMatchesCategory(post: any, category: any, slug?: string) {
  return taxonomyValues(post?.categories).some((value: any) => itemMatchesTaxonomy(value, category, slug));
}

export function postMatchesTag(post: any, tag: any, slug?: string) {
  return taxonomyValues(post?.tags).some((value: any) => itemMatchesTaxonomy(value, tag, slug));
}

export function filterMatchingTaxonomies(values: any[] | undefined, taxonomies: any[] = []) {
  return taxonomyValues(values).length
    ? taxonomies.filter((taxonomy) => taxonomyValues(values).some((value) => itemMatchesTaxonomy(value, taxonomy)))
    : [];
}


export async function getContentManifest(): Promise<ContentManifest | null> {
  if (typeof window !== 'undefined' && window.__CONTENT_MANIFEST__) {
    return window.__CONTENT_MANIFEST__;
  }

  if (!manifestPromise) {
    manifestPromise = fetch('/data/content-manifest.json')
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }

  const manifest = await manifestPromise;
  if (typeof window !== 'undefined' && manifest) {
    window.__CONTENT_MANIFEST__ = manifest;
  }
  return manifest;
}

export async function getPublishedPostsFromManifest() {
  const manifest = await getContentManifest();
  return manifest?.posts ?? [];
}

export async function getPostBySlugFromManifest(slug: string) {
  const posts = await getPublishedPostsFromManifest();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getCategoryBySlugFromManifest(slug: string) {
  const manifest = await getContentManifest();
  return manifest?.categories.find((category) => category.slug === slug) ?? null;
}

export async function getTagBySlugFromManifest(slug: string) {
  const manifest = await getContentManifest();
  return manifest?.tags.find((tag) => tag.slug === slug) ?? null;
}
