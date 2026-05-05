// Core types for the blogging platform

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: ContentBlock[];
  featured_image?: string;
  author_id: string;
  author_name?: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at?: string;
  scheduled_for?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  is_featured?: boolean;
  show_updated_date?: boolean;
  show_toc?: boolean;
  show_reading_time?: boolean;
  show_progress_bar?: boolean;
  show_related_posts?: boolean;
  comments_enabled?: boolean;
  show_author_bio?: boolean;
  layout?: 'default' | 'wide' | 'minimal';
  hide_header?: boolean;
  hide_footer?: boolean;
  custom_css?: string;
  custom_js?: string;
  updated_at: string;
  created_at: string;
  categories: string[];
  tags: string[];
  seo: SEOMetadata;
  views?: number;
  faqs?: FAQ[];
}

export interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'list' | 'table' | 'callout' | 'button' | 'html';
  content: any;
  order: number;
}

export interface SEOMetadata {
  focus_keyword?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  robots_index: boolean;
  robots_follow: boolean;
  schema?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  seo?: Partial<SEOMetadata>;
  post_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  alt_text?: string;
  width?: number;
  height?: number;
  size: number;
  uploaded_at: string;
}

export interface AffiliateLink {
  id: string;
  name: string;
  slug: string;
  destination_url: string;
  category?: string;
  notes?: string;
  redirect_type: '301' | '302';
  clicks: number;
  created_at: string;
}

export interface AffiliateClick {
  id: string;
  link_id: string;
  referrer_page?: string;
  clicked_at: string;
  user_agent?: string;
}

export interface SiteSettings {
  site_name: string;
  site_description: string;
  site_url: string;
  adsense_enabled: boolean;
  adsense_placements: {
    after_first_paragraph: boolean;
    mid_article: boolean;
    end_article: boolean;
    sidebar: boolean;
  };
  gsc_verification?: string;
  affiliate_disclosure_enabled: boolean;
  affiliate_disclosure_text: string;
  newsletter_enabled: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface SEOScore {
  score: number;
  checks: {
    keyword_in_title: boolean;
    keyword_in_first_100: boolean;
    has_headings: boolean;
    has_internal_links: boolean;
    has_external_links: boolean;
    has_images_with_alt: boolean;
    meets_length_target: boolean;
  };
}
