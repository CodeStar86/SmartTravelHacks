import { logger } from './logger';
/**
 * Data Migration System
 * 
 * Handles backward compatibility and data structure changes
 * to ensure the app doesn't break when software updates.
 */

// Current schema version
const CURRENT_VERSION = '1.0.0';

// Helper to safely access nested properties
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const value = path.split('.').reduce((current, prop) => current?.[prop], obj);
    return value !== undefined && value !== null ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Normalize post data structure
export function normalizePost(post: any) {
  if (!post) return null;

  return {
    id: safeGet(post, 'id', ''),
    title: safeGet(post, 'title', 'Untitled'),
    slug: safeGet(post, 'slug', ''),
    content: safeGet(post, 'content', ''),
    excerpt: safeGet(post, 'excerpt', ''),
    featured_image: safeGet(post, 'featured_image', ''),
    status: safeGet(post, 'status', 'draft'),
    author_id: safeGet(post, 'author_id', ''),
    author_name: safeGet(post, 'author_name', 'Admin'),
    categories: safeGet(post, 'categories', []),
    tags: safeGet(post, 'tags', []),
    views: safeGet(post, 'views', 0),
    created_at: safeGet(post, 'created_at', new Date().toISOString()),
    updated_at: safeGet(post, 'updated_at', new Date().toISOString()),
    published_at: safeGet(post, 'published_at', null),
    
    // SEO fields
    meta_title: safeGet(post, 'meta_title', ''),
    meta_description: safeGet(post, 'meta_description', ''),
    canonical_url: safeGet(post, 'canonical_url', ''),
    
    // Content blocks (new structure)
    blocks: Array.isArray(post.blocks) ? post.blocks : [],
  };
}

// Normalize category data structure
export function normalizeCategory(category: any) {
  if (!category) return null;

  return {
    id: safeGet(category, 'id', ''),
    name: safeGet(category, 'name', 'Uncategorized'),
    slug: safeGet(category, 'slug', ''),
    description: safeGet(category, 'description', ''),
    created_at: safeGet(category, 'created_at', new Date().toISOString()),
    updated_at: safeGet(category, 'updated_at', new Date().toISOString()),
  };
}

// Normalize tag data structure
export function normalizeTag(tag: any) {
  if (!tag) return null;

  return {
    id: safeGet(tag, 'id', ''),
    name: safeGet(tag, 'name', 'Tag'),
    slug: safeGet(tag, 'slug', ''),
    created_at: safeGet(tag, 'created_at', new Date().toISOString()),
    updated_at: safeGet(tag, 'updated_at', new Date().toISOString()),
  };
}

// Normalize settings data structure
export function normalizeSettings(settings: any) {
  if (!settings) return getDefaultSettings();

  const defaults = getDefaultSettings();

  return {
    site_title: safeGet(settings, 'site_title', defaults.site_title),
    site_description: safeGet(settings, 'site_description', defaults.site_description),
    site_url: safeGet(settings, 'site_url', defaults.site_url),
    logo_url: safeGet(settings, 'logo_url', ''),
    logo_width: safeGet(settings, 'logo_width', 180),
    logo_height: safeGet(settings, 'logo_height', 40),
    adsense_enabled: safeGet(settings, 'adsense_enabled', false),
    affiliate_disclosure_enabled: safeGet(settings, 'affiliate_disclosure_enabled', true),
    affiliate_disclosure_text: safeGet(settings, 'affiliate_disclosure_text', 'This post may contain affiliate links.'),
    
    // Social media (with backward compatibility)
    social_tiktok: safeGet(settings, 'social_tiktok', ''),
    social_instagram: safeGet(settings, 'social_instagram', ''),
    social_facebook: safeGet(settings, 'social_facebook', ''),
    social_youtube: safeGet(settings, 'social_youtube', ''),
  };
}

// Default settings
// Note: These defaults are used for SEO (HTML title, meta tags)
// The header/footer will still show nothing until actual settings load (they check for truthy values)
export function getDefaultSettings() {
  return {
    site_title: 'Smart Travel Hacks - Travel Guides, Tips & Itineraries',
    site_description: 'Discover destination guides, travel tips, hotel recommendations, and practical itineraries for better trips.',
    site_url: 'https://www.smarttravelhacks.com',
    logo_url: '',
    logo_width: 180,
    logo_height: 40,
    adsense_enabled: false,
    affiliate_disclosure_enabled: true,
    affiliate_disclosure_text: 'This post may contain affiliate links.',
    social_tiktok: '',
    social_instagram: '',
    social_facebook: '',
    social_youtube: '',
  };
}

// Normalize comment data structure
export function normalizeComment(comment: any) {
  if (!comment) return null;

  return {
    id: safeGet(comment, 'id', ''),
    post_id: safeGet(comment, 'post_id', ''),
    parent_id: safeGet(comment, 'parent_id', null),
    author_name: safeGet(comment, 'author_name', 'Anonymous'),
    author_email: safeGet(comment, 'author_email', ''),
    author_website: safeGet(comment, 'author_website', null),
    content: safeGet(comment, 'content', ''),
    status: safeGet(comment, 'status', 'pending'),
    created_at: safeGet(comment, 'created_at', new Date().toISOString()),
    updated_at: safeGet(comment, 'updated_at', new Date().toISOString()),
  };
}

// Normalize affiliate link data structure
export function normalizeAffiliateLink(link: any) {
  if (!link) return null;

  return {
    id: safeGet(link, 'id', ''),
    name: safeGet(link, 'name', 'Affiliate Link'),
    slug: safeGet(link, 'slug', ''),
    destination_url: safeGet(link, 'destination_url', ''),
    clicks: safeGet(link, 'clicks', 0),
    created_at: safeGet(link, 'created_at', new Date().toISOString()),
  };
}

// Migrate data from old version to new version
export function migrateData(data: any, fromVersion: string, toVersion: string) {
  
  // Add migration logic here as needed
  // Example:
  // if (fromVersion === '0.9.0' && toVersion === '1.0.0') {
  //   // Perform migration steps
  // }
  
  return data;
}

// Check if data needs migration
export function needsMigration(dataVersion?: string): boolean {
  if (!dataVersion) return false;
  return dataVersion !== CURRENT_VERSION;
}

// Get current version
export function getCurrentVersion(): string {
  return CURRENT_VERSION;
}

// Validate and fix common data issues
export function validateAndFix<T>(
  data: any,
  normalizeFunction: (data: any) => T | null
): T | null {
  try {
    return normalizeFunction(data);
  } catch (error) {
    logger.error('Error validating data:', error);
    return null;
  }
}

// Safe array normalization
export function normalizeArray<T>(
  data: any,
  normalizeFunction: (item: any) => T | null
): T[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(item => validateAndFix(item, normalizeFunction))
    .filter((item): item is T => item !== null);
}

// Local storage with version checking
export const storage = {
  set: (key: string, value: any) => {
    try {
      const dataWithVersion = {
        version: CURRENT_VERSION,
        timestamp: new Date().toISOString(),
        data: value,
      };
      localStorage.setItem(key, JSON.stringify(dataWithVersion));
    } catch (error) {
      logger.error('Failed to save to localStorage:', error);
    }
  },

  get: <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const parsed = JSON.parse(stored);
      
      // Check version and migrate if needed
      if (needsMigration(parsed.version)) {
        const migrated = migrateData(parsed.data, parsed.version, CURRENT_VERSION);
        storage.set(key, migrated); // Save migrated data
        return migrated;
      }

      return parsed.data ?? defaultValue;
    } catch (error) {
      logger.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Failed to remove from localStorage:', error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('Failed to clear localStorage:', error);
    }
  },
};
