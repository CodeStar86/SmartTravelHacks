import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Tag as TagIcon } from 'lucide-react';
import { postApi, tagApi } from '../lib/api';
import { getPublishedPostsFromManifest, getTagBySlugFromManifest, postMatchesTag } from '../lib/content-manifest';
import { absoluteUrl } from '../lib/site';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

import { logger } from '../lib/logger';
const POSTS_PER_PAGE = 12;

export default function TagPage() {
  const { slug } = useParams<{ slug: string }>();
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [tag, setTag] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setPage(1);
    loadTagAndPosts();
  }, [slug]);

  useEffect(() => {
    if (!tag) return;
    const filtered = allPosts.filter((post) => postMatchesTag(post, tag, slug));
    const start = (page - 1) * POSTS_PER_PAGE;
    setPosts(filtered.slice(start, start + POSTS_PER_PAGE));
    setHasMore(start + POSTS_PER_PAGE < filtered.length);
  }, [allPosts, page, tag, slug]);

  async function loadTagAndPosts() {
    const manifestTag = slug ? await getTagBySlugFromManifest(slug) : null;
    const manifestPosts = await getPublishedPostsFromManifest();

    if (manifestTag) {
      setTag(manifestTag);
      const manifestMatches = manifestPosts.filter((post: any) => postMatchesTag(post, manifestTag, slug));
      if (manifestMatches.length > 0) setAllPosts(manifestPosts);
      // Do not return here. The manifest is generated at build time, so continue
      // to the live API to pick up posts published after the last deploy.
    }

    try {
      const tagData = await tagApi.getBySlug(slug!);
      setTag(tagData);

      // Prefer server-side tag filtering so the public page still works when older
      // posts saved tags as IDs, slugs, names, or full tag objects. Fall back to
      // fetching all published posts if the deployed API is an older version.
      let data = await postApi.list({ status: 'published', tag: slug, limit: 1000, offset: 0 });
      if (!Array.isArray(data) || data.length === 0) {
        data = await postApi.list({ status: 'published', limit: 1000, offset: 0 });
      }
      setAllPosts(data || []);
    } catch (error) {
      logger.error('Failed to load tag page:', error);
    }
  }

  const schema = useMemo(() => tag ? ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `#${tag.name} - Smart Travel Hacks`,
    description: tag.description || `Browse posts tagged with ${tag.name}`,
    url: absoluteUrl(`/tag/${slug}`),
  }) : null, [tag, slug]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={tag ? `${tag.name} - Smart Travel Hacks` : 'Tag - Smart Travel Hacks'}
        description={tag?.description || `Browse posts tagged with ${tag?.name || 'this tag'}`}
        canonical={absoluteUrl(`/tag/${slug || ''}`)}
        schema={schema as any}
      />

      <PublicHeader />

      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TagIcon className="text-purple-600" size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-bold">#{tag?.name || 'Tag'}</h1>
                {tag?.description && <p className="text-gray-600 mt-2 text-lg">{tag.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link to="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-blue-600">Blog</Link>
              <span>/</span>
              <span className="text-gray-900">#{tag?.name || 'Tag'}</span>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-6">{tag ? 'No posts found for this tag yet.' : 'Loading tag...'}</p>
              <Link to="/blog">
                <Button variant="outline">Browse All Posts</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-gray-600">Showing {posts.length} post{posts.length !== 1 ? 's' : ''}{page > 1 && ` (Page ${page})`}</div>

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
                        <div className="h-56 bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <span className="text-white text-3xl font-bold opacity-20">TAG</span>
                        </div>
                      )}
                      <div className="p-6">
                        <h2 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-purple-600 transition">{post.title}</h2>
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

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                  <ChevronLeft size={20} />
                  Previous
                </Button>
                <div className="flex items-center px-4 text-sm text-gray-600">Page {page}</div>
                <Button variant="outline" onClick={() => setPage(page + 1)} disabled={!hasMore}>
                  Next
                  <ChevronRight size={20} />
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
