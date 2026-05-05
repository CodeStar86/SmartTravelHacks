import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { format } from 'date-fns';
import { Calendar, ChevronUp, Clock, Facebook, Folder, Linkedin, Mail, Share2, Tag, Twitter, User, ArrowRight } from 'lucide-react';
import { categoryApi, postApi, tagApi } from '../lib/api';
import { filterMatchingTaxonomies, getContentManifest, getPostBySlugFromManifest, postMatchesTag } from '../lib/content-manifest';
import { absoluteUrl, getSiteUrl } from '../lib/site';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { ContentRenderer } from '../components/content/ContentRenderer';
import { Comments } from '../components/comments/Comments';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { generateArticleSchema, generateBreadcrumbSchema, generateMetaTags, generateTableOfContents } from '../lib/seo-utils';

import { logger } from '../lib/logger';
function normalizePost(post: any) {
  if (!post) return post;
  const nextPost = { ...post };
  if (nextPost.content && typeof nextPost.content === 'string') {
    try {
      const parsed = JSON.parse(nextPost.content);
      if (Array.isArray(parsed)) nextPost.content = parsed;
    } catch {
      // plain string content is fine
    }
  }
  if (!nextPost.content) nextPost.content = '';
  return nextPost;
}

export default function ArticlePage() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [postCategories, setPostCategories] = useState<any[]>([]);
  const [postTags, setPostTags] = useState<any[]>([]);
  const [tocOpen, setTocOpen] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (slug) loadPost();
  }, [slug]);

  useEffect(() => {
    if (!post?.show_progress_bar) return;
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setReadingProgress(height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [post?.show_progress_bar]);

  async function loadPost() {
    const manifestPost = slug ? normalizePost(await getPostBySlugFromManifest(slug)) : null;
    const manifest = await getContentManifest();

    if (manifestPost) {
      setPost(manifestPost);
      setPostCategories(filterMatchingTaxonomies(manifestPost.categories, manifest?.categories || []));
      setPostTags(filterMatchingTaxonomies(manifestPost.tags, manifest?.tags || []));
      setRelatedPosts((manifest?.posts || [])
        .filter((p: any) => p.id !== manifestPost.id && (manifestPost.tags || []).some((tagValue: any) => postMatchesTag(p, { id: tagValue, slug: tagValue, name: tagValue })))
        .slice(0, 3));
      // Do not return here. The manifest is generated at build time, so continue
      // to the live API to pick up article edits made after the last deploy.
    }

    try {
      const postData = normalizePost(await postApi.getBySlug(slug!));
      setPost(postData);
      postApi.incrementViews(postData.id).catch(() => undefined);

      if (postData.categories?.length) {
        const allCategories = await categoryApi.list();
        setPostCategories(filterMatchingTaxonomies(postData.categories, allCategories));
      }
      if (postData.tags?.length) {
        const allTags = await tagApi.list();
        setPostTags(filterMatchingTaxonomies(postData.tags, allTags));
        const related = await postApi.list({ tag: postData.tags[0], limit: 3 });
        setRelatedPosts((related || []).filter((p: any) => p.id !== postData.id));
      }
    } catch (error) {
      logger.error('Failed to load post:', error);
    }
  }

  function calculateReadingTime(content: string | any[]): number {
    let wordCount = 0;
    if (typeof content === 'string') wordCount = content.split(/\s+/).length;
    else if (Array.isArray(content)) {
      content.forEach((block) => {
        if (block.content?.text) wordCount += block.content.text.split(/\s+/).length;
      });
    }
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  function shareOnSocial(platform: string) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || '');
    const shareUrl = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      email: `mailto:?subject=${title}&body=${url}`,
    }[platform];

    if (!shareUrl) return;
    if (platform === 'email') window.location.href = shareUrl;
    else window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  const siteUrl = getSiteUrl();
  const metaTags = post ? generateMetaTags(post, siteUrl) : null;
  const articleSchema = post ? generateArticleSchema(post, siteUrl, 'Smart Travel Hacks Team') : null;
  const breadcrumbSchema = post
    ? generateBreadcrumbSchema(
        [
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${slug}` },
        ],
        siteUrl,
      )
    : null;
  const toc = useMemo(() => (post && post.show_toc !== false && Array.isArray(post.content) ? generateTableOfContents(post.content) : []), [post]);
  const readingTime = post ? calculateReadingTime(post.content || '') : 0;
  const authorName = post?.author_name || 'Smart Travel Hacks Team';
  const articleWidthClass = post?.layout === 'wide' ? 'max-w-6xl' : post?.layout === 'minimal' ? 'max-w-3xl' : 'max-w-4xl';

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Loading Article...</h1>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title={metaTags?.title}
        description={metaTags?.description}
        canonical={metaTags?.canonical}
        ogTitle={metaTags?.og.title}
        ogDescription={metaTags?.og.description}
        ogImage={metaTags?.og.image}
        ogUrl={metaTags?.og.url}
        ogType={metaTags?.og.type}
        twitterCard={metaTags?.twitter.card}
        twitterTitle={metaTags?.twitter.title}
        twitterDescription={metaTags?.twitter.description}
        twitterImage={metaTags?.twitter.image}
        robotsIndex={metaTags?.robots.index}
        robotsFollow={metaTags?.robots.follow}
        schema={[articleSchema, breadcrumbSchema].filter(Boolean) as any[]}
      />

      {post.hide_header ? null : <PublicHeader />}

      <main className="flex-1">
        {post.featured_image && (
          <div className="relative w-full h-[400px] md:h-[500px] bg-gray-900">
            <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover opacity-90" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">{post.title}</h1>
                {post.excerpt && <p className="text-lg md:text-xl text-gray-100 max-w-3xl drop-shadow">{post.excerpt}</p>}
              </div>
            </div>
          </div>
        )}

        <article className={`container mx-auto px-4 py-8 ${articleWidthClass}`}>
          {post.show_progress_bar ? <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent" aria-hidden="true"><div className="h-full bg-blue-600 transition-all" style={{ width: `${readingProgress}%` }} /></div> : null}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/blog">Blog</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{post.title}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {!post.featured_image && (
            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
              {post.excerpt && <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>}
            </header>
          )}

          <Card className="p-6 mb-8 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-500 text-white"><User size={20} /></AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">{authorName}</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1"><Calendar size={14} /><span>{post.published_at ? format(new Date(post.published_at), 'MMMM d, yyyy') : 'No date'}</span></div>
                    <span className="text-gray-400">•</span>
                    {post.show_reading_time !== false ? <div className="flex items-center gap-1"><Clock size={14} /><span>{readingTime} min read</span></div> : null}
                    {post.views ? <><span className="text-gray-400">•</span><span>{post.views} views</span></> : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => shareOnSocial('facebook')} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Share on Facebook"><Facebook size={20} /></button>
                <button onClick={() => shareOnSocial('twitter')} className="p-2 text-gray-600 hover:text-sky-500 hover:bg-sky-50 rounded transition" title="Share on Twitter"><Twitter size={20} /></button>
                <button onClick={() => shareOnSocial('linkedin')} className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded transition" title="Share on LinkedIn"><Linkedin size={20} /></button>
                <button onClick={() => shareOnSocial('email')} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition" title="Share via Email"><Mail size={20} /></button>
              </div>
            </div>

            {(postCategories.length > 0 || postTags.length > 0) && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {postCategories.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Folder size={16} className="text-gray-500" />
                      {postCategories.map((category: any) => (
                        <Link key={category.id} to={`/category/${category.slug}`}>
                          <Badge variant="secondary" className="hover:bg-blue-100">{category.name}</Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                  {postTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag size={16} className="text-gray-500" />
                      {postTags.map((tag: any) => (
                        <Link key={tag.id} to={`/tag/${tag.slug}`}>
                          <Badge variant="outline" className="hover:bg-gray-100">#{tag.name}</Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>

          {toc.length > 0 && (
            <Card className="mb-8 overflow-hidden rounded-[28px] border border-blue-200 bg-blue-50/70 shadow-none">
              <button
                type="button"
                onClick={() => setTocOpen((open) => !open)}
                className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left md:px-10 md:py-7"
                aria-expanded={tocOpen}
                aria-controls="table-of-contents-panel"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-sm">
                    <Share2 size={22} strokeWidth={2.2} />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-black md:text-3xl">Table of Contents</h2>
                </div>
                <ChevronUp
                  size={28}
                  className={`shrink-0 text-black transition-transform ${tocOpen ? '' : 'rotate-180'}`}
                />
              </button>

              {tocOpen && (
                <div id="table-of-contents-panel" className="px-7 pb-7 md:px-10 md:pb-10">
                  <nav aria-label="Table of Contents">
                    <ul className="space-y-5">
                      {toc.map((item) => (
                        <li key={item.id} className={item.level > 2 ? 'ml-8' : ''}>
                          <a
                            href={`#${item.id}`}
                            className="text-[1.95rem] font-medium leading-[1.25] text-blue-600 transition hover:text-blue-700 hover:underline md:text-[2.15rem]"
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}
            </Card>
          )}

          <Card className="p-6 md:p-10 mb-8 bg-white">
            <ContentRenderer blocks={post.content} />
          </Card>

          <Card className="mb-8 rounded-[28px] border border-gray-200 bg-white p-8 md:p-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-black">
                <Share2 size={22} strokeWidth={2.2} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-black md:text-3xl">Share this article</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => shareOnSocial('facebook')} className="inline-flex items-center gap-3 rounded-xl bg-[#2563eb] px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95"><Facebook size={24} /> Facebook</button>
              <button onClick={() => shareOnSocial('twitter')} className="inline-flex items-center gap-3 rounded-xl bg-[#0ea5e9] px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95"><Twitter size={24} /> Twitter</button>
              <button onClick={() => shareOnSocial('linkedin')} className="inline-flex items-center gap-3 rounded-xl bg-[#1d4ed8] px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95"><Linkedin size={24} /> LinkedIn</button>
              <button onClick={() => shareOnSocial('email')} className="inline-flex items-center gap-3 rounded-xl bg-[#475569] px-6 py-4 text-lg font-semibold text-white transition hover:opacity-95"><Mail size={24} /> Email</button>
            </div>
          </Card>

          <Card className="mb-8 rounded-[28px] border border-gray-200 bg-white p-8 md:p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-4xl font-semibold text-white">
                ST
              </div>
              <div className="min-w-0">
                <h2 className="mb-3 text-2xl font-bold tracking-tight text-black md:text-3xl">About the Author</h2>
                <div className="mb-4 text-xl font-semibold text-slate-700">{authorName}</div>
                <p className="max-w-4xl text-xl leading-9 text-slate-600">Travel-focused editorial team sharing destination ideas, planning notes, and practical tips to help readers travel with more confidence.</p>
              </div>
            </div>
          </Card>

          {post.show_related_posts !== false && relatedPosts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Related stories</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost: any) => (
                  <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`} className="block bg-white rounded-lg border p-4 hover:shadow-md transition">
                    <h3 className="font-semibold mb-2">{relatedPost.title}</h3>
                    {relatedPost.excerpt ? <p className="text-sm text-gray-600 line-clamp-3">{relatedPost.excerpt}</p> : null}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {post.comments_enabled !== false ? <Comments postId={post.id} /> : null}
        </article>
      </main>

      {post.hide_footer ? null : <PublicFooter />}
    </div>
  );
}
