import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, Plane, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { categoryApi, postApi } from '../lib/api';
import { getContentManifest, getPublishedPostsFromManifest } from '../lib/content-manifest';
import { absoluteUrl } from '../lib/site';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useSettings } from '../context/SettingsContext';
import { API_BASE, SUPABASE_ANON_KEY } from '../lib/env';

import { logger } from '../lib/logger';
const heroImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80';

const categoryImageMap: Record<string, string> = {
  destinations: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=80',
  destination: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1200&q=80',

  europe: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80',
  asia: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
  'southeast-asia': 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80',
  'central-east-and-south-asia': 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
  'north-america': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'south-america': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
  'central-america': 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1200&q=80',
  oceania: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
  africa: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80',

  itinerary: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  itineraries: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  planning: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  'travel-insurance': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
  'the-best-gear': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80',
  'hostel-life-101': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
  'book-a-hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  'find-cheap-flights': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  'budget-backpacking': 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=1200&q=80',
  'travel-tips': 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
  'best-travel-jobs': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',

  tips: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  reviews: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
  inspiration: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80',
  resources: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
};

const fallbackCategoryImages = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
];

function imageForCategory(category: any, index = 0) {
  const slug = String(category?.slug || '').trim().toLowerCase();
  return category?.image_url || category?.featured_image || category?.image || categoryImageMap[slug] || fallbackCategoryImages[index % fallbackCategoryImages.length];
}

const fallbackPostImages = [
  'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
];

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function descriptionFromSlug(slug: string) {
  const normalized = slug.toLowerCase();
  if (normalized.includes('destination') || normalized.includes('europe') || normalized.includes('asia')) {
    return 'Browse published destination guides and place-based articles in this category.';
  }
  if (normalized.includes('itinerary') || normalized.includes('planning')) {
    return 'See published trip plans, route ideas, and practical planning posts in this category.';
  }
  if (normalized.includes('tip')) {
    return 'Read published travel tips, packing advice, and smarter booking ideas in this category.';
  }
  if (normalized.includes('review') || normalized.includes('resource')) {
    return 'Explore published reviews, travel resources, and useful tools in this category.';
  }
  return 'Explore published articles in this category.';
}

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    const manifest = await getContentManifest();
    const manifestPosts = await getPublishedPostsFromManifest();

    if (manifestPosts.length > 0) {
      setFeaturedPosts(manifestPosts.slice(0, 6));
      setCategories(manifest?.categories ?? []);
      // Keep the build-time manifest as an immediate fallback, then refresh from
      // the live API so the homepage reflects newly published posts.
    }

    try {
      const [posts, categoryData] = await Promise.all([
        postApi.list({ status: 'published', limit: 6 }),
        categoryApi.list().catch(() => []),
      ]);
      setFeaturedPosts(posts || []);
      setCategories(Array.isArray(categoryData) ? categoryData : categoryData?.categories || []);
    } catch (error) {
      logger.warn('Posts not available from backend:', error);
      setFeaturedPosts([]);
      setCategories([]);
    }
  }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch(`${API_BASE}/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Thanks for subscribing to Smart Travel Hacks ✈️');
        setEmail('');
      } else if (response.status === 409) {
        toast.error('This email is already subscribed');
      } else {
        toast.error(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  }

  const liveCategoryCards = useMemo(() => {
    const counts = new Map<string, number>();
    featuredPosts.forEach((post) => {
      if (!Array.isArray(post.categories)) return;
      post.categories.forEach((categoryId: string) => {
        counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
      });
    });

    const matched = categories
      .filter((category) => counts.has(category.id))
      .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0))
      .slice(0, 3)
      .map((category, index) => ({
        title: category.name,
        text: category.description || descriptionFromSlug(category.slug || category.name || ''),
        image: imageForCategory(category, index),
        href: `/category/${category.slug}`,
      }));

    if (matched.length > 0) return matched;

    const synthetic = new Map<string, { slug: string; title: string; count: number }>();
    featuredPosts.forEach((post) => {
      if (!Array.isArray(post.categories)) return;
      post.categories.forEach((categoryId: string) => {
        const slug = String(categoryId || '').trim().toLowerCase();
        if (!slug) return;
        const current = synthetic.get(slug);
        synthetic.set(slug, {
          slug,
          title: titleFromSlug(slug),
          count: (current?.count || 0) + 1,
        });
      });
    });

    return Array.from(synthetic.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((category, index) => ({
        title: category.title,
        text: descriptionFromSlug(category.slug),
        image: imageForCategory(category, index),
        href: `/category/${category.slug}`,
      }));
  }, [categories, featuredPosts]);

  const schemaData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${absoluteUrl('/')}/#website`,
        url: absoluteUrl('/'),
        name: 'Smart Travel Hacks',
        description: 'Travel guides, destination inspiration, hotel tips, itineraries, and practical advice for better trips.',
        publisher: { '@id': `${absoluteUrl('/')}/#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${absoluteUrl('/')}/#organization`,
        name: 'Smart Travel Hacks',
        url: absoluteUrl('/'),
        logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
      },
      {
        '@type': 'ItemList',
        itemListElement: featuredPosts.slice(0, 6).map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Article',
            '@id': absoluteUrl(`/blog/${post.slug}`),
            url: absoluteUrl(`/blog/${post.slug}`),
            headline: post.title,
            description: post.excerpt,
            image: post.featured_image,
            datePublished: post.published_at,
            author: { '@type': 'Organization', name: 'Smart Travel Hacks' },
          },
        })),
      },
    ],
  }), [featuredPosts]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOHead
        title="Smart Travel Hacks | Travel Guides, Itineraries & Tips"
        description="Discover destination guides, weekend itineraries, hotel tips, food finds, and practical travel advice for planning memorable trips."
        keywords="travel blog, destination guides, itineraries, travel tips, city breaks, hotel tips, weekend trips, travel resources"
        canonical={absoluteUrl('/')}
        ogType="website"
        ogImage={absoluteUrl('/og-image.png')}
        ogUrl={absoluteUrl('/')}
        twitterCard="summary_large_image"
        schema={schemaData}
      />

      <PublicHeader />

      <main className="flex-1">
        <section
          className="relative isolate overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,.94) 0%, rgba(255,255,255,.82) 30%, rgba(5,22,38,.22) 60%, rgba(5,22,38,.36) 100%), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="container mx-auto px-4 py-18 md:py-24 lg:py-28">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
                <Sparkles size={16} />
                Smart routes, better stays, more memorable trips
              </div>
              <h1 className="max-w-2xl text-5xl font-bold leading-tight text-slate-900 md:text-6xl lg:text-7xl">
                Explore Better, <br className="hidden md:block" />Travel Smarter
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-2xl md:leading-10">
                Practical tips, destination guides, and smart travel hacks to help you spend less, see more, and make every trip feel unforgettable.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/blog">
                  <Button size="lg" className="h-12 rounded-full bg-sky-600 px-7 text-white hover:bg-sky-700">
                    Explore Destinations
                    <ArrowRight className="ml-1" size={18} />
                  </Button>
                </Link>
                <Link to="/travel-resources">
                  <Button size="lg" variant="outline" className="h-12 rounded-full border-sky-300 bg-white/80 px-7 text-slate-900 backdrop-blur hover:bg-white">
                    Travel Resources
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
        </section>

        {liveCategoryCards.length > 0 && (
          <section className="relative -mt-8 z-10 pb-8">
            <div className="container mx-auto px-4">
              <div className="grid gap-6 md:grid-cols-3">
                {liveCategoryCards.map((item) => (
                  <Link key={item.title} to={item.href}>
                    <Card className="group overflow-hidden rounded-[28px] border-0 bg-white shadow-xl shadow-slate-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
                      <div className="relative h-72 overflow-hidden">
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/25 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                          <h2 className="mb-2 text-2xl font-bold">{item.title}</h2>
                          <p className="text-sm leading-6 text-white/85">{item.text}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {featuredPosts.length > 0 && (
          <section className="bg-slate-50 py-16 md:py-20">
            <div className="container mx-auto px-4">
              <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">Latest articles</p>
                  <h2 className="text-3xl font-bold text-slate-900 md:text-5xl">Fresh tips and travel inspiration</h2>
                </div>
                <Link to="/blog">
                  <Button variant="outline" className="rounded-full border-slate-300 bg-white px-6">View all posts</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {featuredPosts.map((post, index) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="group h-full overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                      <div className="relative h-64 overflow-hidden bg-slate-200">
                        <img
                          src={post.featured_image || fallbackPostImages[index % fallbackPostImages.length]}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="mb-3 text-2xl font-bold leading-tight text-slate-900 line-clamp-2 group-hover:text-sky-700 transition">
                          {post.title}
                        </h3>
                        {post.excerpt ? (
                          <p className="mb-5 line-clamp-3 text-base leading-7 text-slate-600">{post.excerpt}</p>
                        ) : null}
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays size={16} />
                          {post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : 'New guide'}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="overflow-hidden rounded-[32px] bg-slate-900 text-white shadow-2xl">
              <div className="grid items-center gap-10 px-6 py-10 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-14 lg:py-14">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-sky-100">
                    <Plane size={16} />
                    Travel smarter, straight to your inbox
                  </div>
                  <h2 className="text-3xl font-bold leading-tight md:text-5xl">Get fresh travel ideas before everyone else</h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                    Get destination inspiration, planning tips, and practical hacks your readers will actually save for later.
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="rounded-[28px] bg-white p-4 text-slate-900 shadow-xl sm:p-5">
                  <label htmlFor="email" className="mb-3 block text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Weekly travel notes
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="h-12 flex-1 rounded-full border border-slate-200 px-5 py-3 text-base outline-none transition focus:border-sky-400"
                    />
                    <Button type="submit" disabled={subscribing} className="h-12 rounded-full bg-orange-500 px-7 text-white hover:bg-orange-600">
                      {subscribing ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
