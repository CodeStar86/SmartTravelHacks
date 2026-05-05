import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { postApi } from '../lib/api';
import { getPublishedPostsFromManifest } from '../lib/content-manifest';
import { absoluteUrl } from '../lib/site';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

import { logger } from '../lib/logger';
const POSTS_PER_PAGE = 12;

export default function BlogPage() {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const filtered = !debouncedSearch
      ? allPosts
      : allPosts.filter((post) =>
          `${post.title || ''} ${post.excerpt || ''}`.toLowerCase().includes(debouncedSearch.toLowerCase()),
        );

    const start = (page - 1) * POSTS_PER_PAGE;
    const slice = filtered.slice(start, start + POSTS_PER_PAGE);
    setPosts(slice);
    setHasMore(start + POSTS_PER_PAGE < filtered.length);
  }, [allPosts, page, debouncedSearch]);

  async function loadPosts() {
    const manifestPosts = await getPublishedPostsFromManifest();
    if (manifestPosts.length > 0) {
      setAllPosts(manifestPosts);
      // Keep the build-time manifest as an immediate fallback, then refresh from
      // the live API so newly published posts appear without another deploy.
    }

    try {
      const data = await postApi.list({ status: 'published', limit: 1000, offset: 0 });
      setAllPosts(data || []);
    } catch (error) {
      logger.error('Failed to load posts:', error);
    }
  }

  function clearSearch() {
    setSearchQuery('');
    setDebouncedSearch('');
  }

  const schema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Destinations | Smart Travel Hacks',
    description: 'Explore destination guides, itineraries, hotel notes, and practical travel advice.',
    url: absoluteUrl('/blog'),
    mainEntity: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.published_at,
      image: post.featured_image,
    })),
  }), [posts]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Destinations | Smart Travel Hacks"
        description="Explore destination guides, itineraries, hotel notes, and practical travel advice."
        canonical={absoluteUrl('/blog')}
        schema={schema}
      />

      <PublicHeader />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Destinations</h1>

          <div className="mb-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search articles by title, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 h-12 text-lg shadow-md border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label="Clear search"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {debouncedSearch && posts.length > 0 && (
              <p className="mt-3 text-sm text-gray-600">
                Found {posts.length} result{posts.length !== 1 ? 's' : ''} for "{debouncedSearch}"
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {post.featured_image ? (
                    <div className="relative h-56 overflow-hidden bg-gray-200">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-56 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold opacity-20">TRAVEL</span>
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-blue-600 transition">{post.title}</h2>
                    {post.excerpt && <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>}
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : 'No date'}</span>
                      {post.views ? (
                        <>
                          <span>•</span>
                          <span>{post.views} views</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {debouncedSearch ? `No posts found matching "${debouncedSearch}". Try a different search term.` : 'No travel posts available yet.'}
            </div>
          )}

          {posts.length > 0 && (
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                <ChevronLeft size={20} />
                Previous
              </Button>
              <Button variant="outline" onClick={() => setPage(page + 1)} disabled={!hasMore}>
                Next
                <ChevronRight size={20} />
              </Button>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
