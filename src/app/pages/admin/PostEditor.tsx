import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, Sparkles, X, Wand2, LayoutList, FileText, Search, Settings, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { postApi, categoryApi, tagApi, aiApi } from '../../lib/api';
import { BlockEditor } from '../../components/admin/BlockEditor';
import { SEOPanel } from '../../components/admin/SEOPanel';
import { PostPreview } from '../../components/admin/PostPreview';
import { ContentBlock, SEOMetadata, Post } from '../../types';
import { filterLegacyAICategories } from '../../lib/category-utils';


import { logger } from '../../lib/logger';
function normalizeAiBlocks(blocks: any[]): ContentBlock[] {
  if (!Array.isArray(blocks)) return [];

  return blocks.flatMap((block: any, index: number) => {
    if (!block || typeof block !== 'object') return [];

    const normalizedBlock: ContentBlock = {
      id: block.id || `ai-block-${index}`,
      type: block.type || 'paragraph',
      content: block.content || {},
      order: typeof block.order === 'number' ? block.order : index,
    };

    if (normalizedBlock.type === 'paragraph') {
      const text = normalizedBlock.content?.text;
      if (typeof text === 'string' && /<\/?[a-z][\s\S]*>/i.test(text)) {
        normalizedBlock.content = {
          ...normalizedBlock.content,
          html: text,
          text: text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
        };
      }
    }

    if (normalizedBlock.type === 'image') {
      const url = normalizedBlock.content?.url;
      const isValid = typeof url === 'string' && /^(https?:\/\/|data:image\/|blob:|\/)/.test(url.trim());
      if (!isValid) {
        return normalizedBlock.content?.caption ? [{
          id: normalizedBlock.id,
          type: 'callout',
          content: {
            text: normalizedBlock.content.caption,
            type: 'info',
          },
          order: normalizedBlock.order,
        } as ContentBlock] : [];
      }
    }

    return [normalizedBlock];
  });
}

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [generatingPost, setGeneratingPost] = useState(false);
  const [editorMode, setEditorMode] = useState<'text' | 'blocks'>('text');
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    wordCount: 1500,
    tone: 'professional',
    keywords: '',
    focusKeyword: '',
    brief: '',
    targetAudience: '',
    keyPoints: '',
    mode: 'format', // 'format' or 'generate'
    rawContent: '',
  });
  const [post, setPost] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    status: 'draft',
    categories: [] as string[],
    tags: [] as string[],
    featured_image: '',
    seo: { robots_index: true, robots_follow: true } as SEOMetadata,
    published_at: '',
    scheduled_for: '',
    visibility: 'public',
    is_featured: false,
    show_updated_date: true,
    show_toc: true,
    show_reading_time: true,
    show_progress_bar: false,
    show_related_posts: true,
    comments_enabled: true,
    author_name: 'Admin',
    show_author_bio: true,
    layout: 'default',
    hide_header: false,
    hide_footer: false,
    custom_css: '',
    custom_js: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (id && id !== 'new') {
      loadPost(id);
    }
  }, [id]);

  async function loadData() {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        categoryApi.list(),
        tagApi.list(),
      ]);
      setCategories(filterLegacyAICategories(categoriesData || []));
      setTags(tagsData || []);
    } catch (error: any) {
      logger.error('Failed to load data:', error);
    }
  }

  async function loadPost(postId: string) {
    try {
      setLoading(true);
      const data = await postApi.getByIdAuth(postId);
      if (data) {
        setPost({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          status: data.status || 'draft',
          categories: data.categories || [],
          tags: data.tags || [],
          featured_image: data.featured_image || '',
          seo: { robots_index: true, robots_follow: true, ...(data.seo || {}) } as SEOMetadata,
          published_at: data.published_at || '',
          scheduled_for: data.scheduled_for || '',
          visibility: data.visibility || 'public',
          is_featured: Boolean(data.is_featured),
          show_updated_date: data.show_updated_date ?? true,
          show_toc: data.show_toc ?? true,
          show_reading_time: data.show_reading_time ?? true,
          show_progress_bar: data.show_progress_bar ?? false,
          show_related_posts: data.show_related_posts ?? true,
          comments_enabled: data.comments_enabled ?? true,
          author_name: data.author_name || 'Admin',
          show_author_bio: data.show_author_bio ?? true,
          layout: data.layout || 'default',
          hide_header: data.hide_header ?? false,
          hide_footer: data.hide_footer ?? false,
          custom_css: data.custom_css || '',
          custom_js: data.custom_js || '',
        });
      }
    } catch (error: any) {
      logger.error('Failed to load post:', error);
      toast.error('Failed to load post');
      navigate('/admin/posts');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: any) {
    setPost(prev => {
      const newPost = { ...prev, [field]: value };
      
      // Auto-generate slug from title
      if (field === 'title' && (!id || id === 'new')) {
        newPost.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
      
      return newPost;
    });
  }

  async function handleSave(status?: string) {
    if (!post.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const finalStatus = status || post.status;
    if (finalStatus === 'scheduled' && !post.scheduled_for) {
      toast.error('Choose a scheduled publish date');
      setActiveTab('settings');
      return;
    }

    setSaving(true);

    try {
      const postData = { ...post };
      if (status) {
        postData.status = status;
      }
      postData.slug = slugifyValue(postData.slug || postData.title);
      if (postData.status !== 'scheduled') postData.scheduled_for = '';
      if (postData.status === 'published' && !postData.published_at) postData.published_at = new Date().toISOString();


      if (id && id !== 'new') {
        const result = await postApi.update(id, postData);
        toast.success('Post updated successfully');
      } else {
        const newPost = await postApi.create(postData);
        toast.success('Post created successfully');
        navigate(`/admin/posts/edit/${newPost.id}`);
      }
    } catch (error: any) {
      logger.error('[PostEditor] Failed to save post:', error);
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(categoryId: string) {
    setPost(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  }

  function toggleTag(tagId: string) {
    setPost(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  }

  function slugifyValue(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Enter a category name');
      return;
    }

    const slug = slugifyValue(name);
    const existing = categories.find((category) => category?.slug === slug || category?.name?.toLowerCase() === name.toLowerCase());
    if (existing) {
      setPost((prev) => ({
        ...prev,
        categories: prev.categories.includes(existing.id) ? prev.categories : [...prev.categories, existing.id],
      }));
      setNewCategoryName('');
      toast.success('Category selected');
      return;
    }

    try {
      setCreatingCategory(true);
      const created = await categoryApi.create({
        name,
        slug,
        description: '',
      });
      setCategories((prev) => [...prev, created]);
      setPost((prev) => ({
        ...prev,
        categories: [...prev.categories, created.id],
      }));
      setNewCategoryName('');
      toast.success('Category created');
    } catch (error: any) {
      logger.error('Failed to create category:', error);
      toast.error('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) {
      toast.error('Enter a tag name');
      return;
    }

    const slug = slugifyValue(name);
    const existing = tags.find((tag) => tag?.slug === slug || tag?.name?.toLowerCase() === name.toLowerCase());
    if (existing) {
      setPost((prev) => ({
        ...prev,
        tags: prev.tags.includes(existing.id) ? prev.tags : [...prev.tags, existing.id],
      }));
      setNewTagName('');
      toast.success('Tag selected');
      return;
    }

    try {
      setCreatingTag(true);
      const created = await tagApi.create({
        name,
        slug,
      });
      setTags((prev) => [...prev, created]);
      setPost((prev) => ({
        ...prev,
        tags: [...prev.tags, created.id],
      }));
      setNewTagName('');
      toast.success('Tag created');
    } catch (error: any) {
      logger.error('Failed to create tag:', error);
      toast.error('Failed to create tag');
    } finally {
      setCreatingTag(false);
    }
  }

  async function generateAiPost() {
    if (!post.title.trim()) {
      toast.error('Please enter a title first');
      return;
    }

    setGeneratingPost(true);

    try {
      const keywords = aiSettings.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const response = await aiApi.generatePost({
        title: post.title,
        mode: aiSettings.mode,
        rawContent: aiSettings.rawContent.trim() || undefined,
        wordCount: aiSettings.wordCount,
        tone: aiSettings.tone,
        keywords: keywords.length > 0 ? keywords : undefined,
        focusKeyword: aiSettings.focusKeyword.trim() || undefined,
        brief: aiSettings.brief.trim() || undefined,
        targetAudience: aiSettings.targetAudience.trim() || undefined,
        keyPoints: aiSettings.keyPoints.trim() || undefined,
      });


      // AI now returns blocks, not plain text content
      const normalizedBlocks = response.blocks ? normalizeAiBlocks(response.blocks) : null;

      setPost(prev => ({
        ...prev,
        content: normalizedBlocks ? JSON.stringify(normalizedBlocks) : response.content,
        excerpt: response.excerpt,
      }));

      if (normalizedBlocks) {
        setEditorMode('blocks');
      }

      setShowAiModal(false);
      toast.success(`Blog post generated! (~${response.wordCount} words)`);
    } catch (error: any) {
      logger.error('Failed to generate blog post:', error);
      
      if (error.message?.includes('OpenAI API key not configured')) {
        toast.error('Please configure your OpenAI API key in environment settings');
      } else {
        toast.error(`Failed to generate blog post: ${error.message}`);
      }
    } finally {
      setGeneratingPost(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/posts')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {id && id !== 'new' ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          className="gap-2"
        >
          <Eye size={16} />
          Preview
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'seo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search size={16} className="inline mr-2" />
              SEO
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium border-b-2 transition ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings size={16} className="inline mr-2" />
              Settings
            </button>
          </div>

          {/* Content Tab */}
          {activeTab === 'content' && (
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={post.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Post title"
                    className="text-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Slug *</label>
                  <Input
                    value={post.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="post-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Excerpt</label>
                  <Textarea
                    value={post.excerpt}
                    onChange={(e) => handleChange('excerpt', e.target.value)}
                    placeholder="Brief description of the post"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium">Content</label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setEditorMode('text')}
                          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition ${
                            editorMode === 'text'
                              ? 'bg-white shadow-sm font-medium'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <FileText size={14} />
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorMode('blocks');
                            // Convert text to blocks if needed
                            if (typeof post.content === 'string' && post.content) {
                              try {
                                // First, try to parse as JSON (it might already be blocks)
                                const parsed = JSON.parse(post.content);
                                if (Array.isArray(parsed)) {
                                  // Already blocks, no need to convert
                                  return;
                                }
                              } catch {
                                // Not JSON, it's plain text - convert to a paragraph block
                                const textBlock: ContentBlock = {
                                  id: `block-${Date.now()}`,
                                  type: 'paragraph',
                                  content: { text: post.content },
                                  order: 0,
                                };
                                setPost(prev => ({ ...prev, content: JSON.stringify([textBlock]) }));
                              }
                            } else if (!post.content) {
                              // Empty content, initialize with empty array
                              setPost(prev => ({ ...prev, content: JSON.stringify([]) }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition ${
                            editorMode === 'blocks'
                              ? 'bg-white shadow-sm font-medium'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <LayoutList size={14} />
                          Blocks
                        </button>
                      </div>
                      {editorMode === 'text' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAiModal(true)}
                          disabled={!post.title}
                        >
                          <Wand2 size={14} className="mr-2" />
                          AI Writer
                        </Button>
                      )}
                    </div>
                  </div>

                  {editorMode === 'text' ? (
                    <Textarea
                      value={typeof post.content === 'string' ? post.content : ''}
                      onChange={(e) => handleChange('content', e.target.value)}
                      placeholder="Write your post content here...&#10;&#10;Supports HTML: <strong>, <em>, <a href=''>, <img src='' alt=''>, etc.&#10;&#10;Or switch to Blocks mode for professional layouts with images, callouts, and more!"
                      rows={15}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <BlockEditor
                        blocks={(() => {
                          try {
                            const content = typeof post.content === 'string' ? post.content : '';
                            return content ? JSON.parse(content) : [];
                          } catch {
                            return [];
                          }
                        })()}
                        onChange={(blocks) => setPost(prev => ({ ...prev, content: JSON.stringify(blocks) }))}
                      />
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                        <strong>💡 Block Editor Tips:</strong>
                        <ul className="mt-2 space-y-1 text-xs">
                          <li>• Click <strong>"+ Image"</strong> to add professional images with captions</li>
                          <li>• Use <strong>Callouts</strong> for important notes or tips</li>
                          <li>• Add <strong>Buttons/CTAs</strong> for affiliate links or actions</li>
                          <li>• Drag blocks to reorder them</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <Card className="p-6">
              <SEOPanel
                post={{
                  ...post,
                  status: post.status as 'draft' | 'published' | 'scheduled',
                  visibility: post.visibility as 'public' | 'private' | 'unlisted',
                  layout: post.layout as 'default' | 'wide' | 'minimal',
                  content: (() => {
                    try {
                      const content = typeof post.content === 'string' ? post.content : '';
                      return content ? JSON.parse(content) : [];
                    } catch {
                      return post.content;
                    }
                  })(),
                } as Partial<Post>}
                seo={post.seo}
                onChange={(seo) => setPost(prev => ({ ...prev, seo }))}
              />
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-lg">Post Settings</h3>
                    <p className="text-sm text-gray-500 mt-1">Control how your post is published, displayed, and indexed.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Status</label>
                      <select value={post.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full border rounded-md px-3 py-2">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Publish date</label>
                      <Input
                        type="datetime-local"
                        value={(post.status === 'scheduled' ? post.scheduled_for : post.published_at || '').slice(0, 16)}
                        onChange={(e) => {
                          const value = e.target.value ? new Date(e.target.value).toISOString() : '';
                          setPost(prev => ({ ...prev, [prev.status === 'scheduled' ? 'scheduled_for' : 'published_at']: value }));
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Used as the scheduled time when status is Scheduled.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">URL slug</label>
                      <Input value={post.slug} onChange={(e) => handleChange('slug', slugifyValue(e.target.value))} placeholder="learn-more-about-hanoi" />
                      <p className="text-xs text-muted-foreground mt-1">Final URL: /blog/{post.slug || 'post-slug'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Visibility</label>
                      <select value={post.visibility} onChange={(e) => handleChange('visibility', e.target.value)} className="w-full border rounded-md px-3 py-2">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="unlisted">Unlisted</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Canonical URL override</label>
                    <Input
                      value={post.seo?.canonical_url || ''}
                      onChange={(e) => setPost(prev => ({ ...prev, seo: { ...prev.seo, canonical_url: e.target.value } }))}
                      placeholder="https://www.smarttravelhacks.com/blog/custom-canonical"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to use the post URL automatically.</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Display & Reader Experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    ['is_featured', 'Mark as featured'],
                    ['show_updated_date', 'Show last updated date'],
                    ['show_toc', 'Auto-generate table of contents'],
                    ['show_reading_time', 'Show reading time'],
                    ['show_progress_bar', 'Enable reading progress bar'],
                    ['show_related_posts', 'Show related posts'],
                    ['comments_enabled', 'Enable comments'],
                    ['show_author_bio', 'Show author bio'],
                  ].map(([field, label]) => (
                    <label key={field} className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50">
                      <span className="text-sm font-medium">{label}</span>
                      <input type="checkbox" checked={Boolean((post as any)[field])} onChange={(e) => setPost(prev => ({ ...prev, [field]: e.target.checked }))} className="h-4 w-4 rounded" />
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Post layout</label>
                    <select value={post.layout} onChange={(e) => handleChange('layout', e.target.value)} className="w-full border rounded-md px-3 py-2">
                      <option value="default">Default</option>
                      <option value="wide">Wide</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Author override</label>
                    <Input value={post.author_name} onChange={(e) => handleChange('author_name', e.target.value)} placeholder="Admin" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium">Hide site header on this post</span>
                    <input type="checkbox" checked={post.hide_header} onChange={(e) => setPost(prev => ({ ...prev, hide_header: e.target.checked }))} className="h-4 w-4 rounded" />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium">Hide site footer on this post</span>
                    <input type="checkbox" checked={post.hide_footer} onChange={(e) => setPost(prev => ({ ...prev, hide_footer: e.target.checked }))} className="h-4 w-4 rounded" />
                  </label>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Indexing & Advanced</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium">Allow search engines to index this post</span>
                    <input type="checkbox" checked={post.seo?.robots_index !== false} onChange={(e) => setPost(prev => ({ ...prev, seo: { ...prev.seo, robots_index: e.target.checked } }))} className="h-4 w-4 rounded" />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50">
                    <span className="text-sm font-medium">Allow link following</span>
                    <input type="checkbox" checked={post.seo?.robots_follow !== false} onChange={(e) => setPost(prev => ({ ...prev, seo: { ...prev.seo, robots_follow: e.target.checked } }))} className="h-4 w-4 rounded" />
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom CSS</label>
                    <Textarea value={post.custom_css} onChange={(e) => handleChange('custom_css', e.target.value)} placeholder="/* Optional per-post CSS */" rows={5} className="font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom JavaScript</label>
                    <Textarea value={post.custom_js} onChange={(e) => handleChange('custom_js', e.target.value)} placeholder="// Optional per-post JS" rows={5} className="font-mono text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">Use only trusted scripts. This is saved with the post for your renderer to apply.</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Publish</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={post.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleSave()}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleSave('published')}
                  disabled={saving}
                >
                  Publish
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Featured Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Image URL
                </label>
                <Input
                  value={post.featured_image}
                  onChange={(e) => setPost(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste a direct image URL or use Unsplash
                </p>
              </div>
              {post.featured_image && (
                <div className="relative">
                  <img
                    src={post.featured_image}
                    alt="Cover Preview"
                    className="w-full h-40 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                    }}
                  />
                  <button
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                    onClick={() => setPost(prev => ({ ...prev, featured_image: '' }))}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="font-semibold">Categories</h3>
              <span className="text-xs text-muted-foreground">Create here or in Admin → Categories</span>
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Add a category"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleCreateCategory} disabled={creatingCategory}>
                <Plus size={16} className="mr-2" />
                {creatingCategory ? 'Adding...' : 'Add'}
              </Button>
            </div>

            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories yet. Create one above.</p>
              ) : (
                categories.filter(category => category && category.id).map(category => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={post.categories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="font-semibold">Tags</h3>
              <span className="text-xs text-muted-foreground">Create here or in Admin → Tags</span>
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleCreateTag} disabled={creatingTag}>
                <Plus size={16} className="mr-2" />
                {creatingTag ? 'Adding...' : 'Add'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags yet. Create one above.</p>
              ) : (
                tags.filter(tag => tag && tag.id).map(tag => (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      post.tags.includes(tag.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* AI Writer Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wand2 size={20} className="text-blue-500" />
                <h3 className="text-xl font-semibold">Travel Blog Writer</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Paste your content below and AI will intelligently format it into professional blocks with proper structure.
            </p>

            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-full">
                <button
                  type="button"
                  onClick={() => setAiSettings(prev => ({ ...prev, mode: 'format' }))}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    aiSettings.mode === 'format'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📝 Format My Content
                </button>
                <button
                  type="button"
                  onClick={() => setAiSettings(prev => ({ ...prev, mode: 'generate' }))}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    aiSettings.mode === 'generate'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✨ Generate New Content
                </button>
              </div>

              {/* Format Mode - Main Content Input */}
              {aiSettings.mode === 'format' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Your Content *
                    </label>
                    <Textarea
                      value={aiSettings.rawContent}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        rawContent: e.target.value
                      }))}
                      placeholder="Paste your blog post content here...

The AI will intelligently:
• Break it into sections with headings
• Format lists and paragraphs
• Add callouts for important points
• Suggest image placements
• Create a professional layout"
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paste your written content - AI will structure it into blocks
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Focus Keyword (Optional)
                    </label>
                    <Input
                      value={aiSettings.focusKeyword}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        focusKeyword: e.target.value
                      }))}
                      placeholder="e.g., weekend in Rome"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      AI will optimize structure around this keyword
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-green-900">
                      <strong>✨ AI Will Add:</strong>
                      <ul className="mt-2 ml-4 space-y-1 text-xs">
                        <li>• <strong>Headings</strong> - H2/H3 sections automatically</li>
                        <li>• <strong>Lists</strong> - Bullet and numbered lists</li>
                        <li>• <strong>Callouts</strong> - Highlight key insights</li>
                        <li>• <strong>Images</strong> - Suggest placement with alt text</li>
                        <li>• <strong>Buttons</strong> - Add CTAs where appropriate</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Generate Mode - Existing fields */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target Word Count
                    </label>
                    <Input
                      type="number"
                      value={aiSettings.wordCount}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        wordCount: parseInt(e.target.value) || 800
                      }))}
                      min={300}
                      max={3000}
                      step={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      300-3000 words recommended
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Writing Tone
                    </label>
                    <select
                      value={aiSettings.tone}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        tone: e.target.value
                      }))}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="authoritative">Authoritative</option>
                      <option value="conversational">Conversational</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target Keywords (Optional)
                    </label>
                    <Input
                      value={aiSettings.keywords}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        keywords: e.target.value
                      }))}
                      placeholder="e.g., Rome, Italy, 3-day itinerary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Comma-separated keywords to include naturally
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Focus Keyword (Optional)
                    </label>
                    <Input
                      value={aiSettings.focusKeyword}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        focusKeyword: e.target.value
                      }))}
                      placeholder="e.g., Rome travel guide"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The main keyword to focus on
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Brief (Optional)
                    </label>
                    <Textarea
                      value={aiSettings.brief}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        brief: e.target.value
                      }))}
                      placeholder="e.g., A 3-day Rome itinerary with food, hotels, and must-see spots"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      A short summary or introduction to the topic
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target Audience (Optional)
                    </label>
                    <Input
                      value={aiSettings.targetAudience}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        targetAudience: e.target.value
                      }))}
                      placeholder="e.g., Business owners, tech enthusiasts"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The intended readers of the post
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Key Points (Optional)
                    </label>
                    <Textarea
                      value={aiSettings.keyPoints}
                      onChange={(e) => setAiSettings(prev => ({
                        ...prev,
                        keyPoints: e.target.value
                      }))}
                      placeholder="e.g., 1. Introduction to AI\n2. Benefits of AI in business\n3. Popular AI tools"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Main points or sections to cover in the post
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles size={16} className="text-blue-500 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <strong>Post Title:</strong> {post.title || 'None'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-yellow-900">
                      <strong>💡 Pro Tip for 100/100 SEO:</strong>
                      <ol className="mt-2 ml-4 space-y-1 list-decimal">
                        <li>Make sure your title contains your focus keyword (e.g., "Rome Travel Guide" should have "Rome" in the title)</li>
                        <li>Fill in the Focus Keyword field below</li>
                        <li>The AI will automatically include it in the first paragraph, add internal/external links, and generate 1500+ words</li>
                      </ol>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={generateAiPost}
                  disabled={generatingPost || !post.title}
                >
                  {generatingPost ? (
                    <>
                      <Wand2 size={16} className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} className="mr-2" />
                      Generate Post
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAiModal(false)}
                  disabled={generatingPost}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PostPreview
          post={post}
          categories={categories}
          tags={tags}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
