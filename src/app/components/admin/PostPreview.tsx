import { useEffect } from 'react';
import { X, Calendar, Clock, User, Folder, Tag, Facebook, Twitter, Linkedin, Mail } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ContentRenderer } from '../content/ContentRenderer';
import { format } from 'date-fns';

interface PostPreviewProps {
  post: {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featured_image: string;
    categories?: string[];
    tags?: string[];
  };
  categories: any[];
  tags: any[];
  onClose: () => void;
}

export function PostPreview({ post, categories, tags, onClose }: PostPreviewProps) {
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Parse content if it's a JSON string
  let parsedContent: string | any[] = post.content;
  if (typeof post.content === 'string') {
    try {
      const parsed = JSON.parse(post.content);
      if (Array.isArray(parsed)) {
        parsedContent = parsed;
      }
    } catch {
      // Keep as string
    }
  }

  // Calculate reading time
  function calculateReadingTime(content: string | any[]): number {
    let wordCount = 0;
    
    if (typeof content === 'string') {
      wordCount = content.split(/\s+/).length;
    } else if (Array.isArray(content)) {
      content.forEach(block => {
        if (block.content?.text) {
          wordCount += block.content.text.split(/\s+/).length;
        }
      });
    }
    
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  const readingTime = calculateReadingTime(parsedContent || '');

  // Get selected categories and tags
  const postCategories = categories.filter(c => post.categories?.includes(c.id));
  const postTags = tags.filter(t => post.tags?.includes(t.id));

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="p-0 bg-white shadow-2xl">
          {/* Preview Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div>
              <h2 className="text-2xl font-bold">Preview Mode</h2>
              <p className="text-sm text-blue-100 mt-1">This is how your post will appear to readers</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
              title="Close preview"
            >
              <X size={24} />
            </button>
          </div>

          {/* Preview Content */}
          <div className="bg-gray-50">
            {/* Hero Section with Cover Image */}
            {post.featured_image && (
              <div className="relative w-full h-[400px] bg-gray-900">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover opacity-90"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
                  <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                    {post.title || (
                      <span className="text-gray-300 italic">Untitled Post (Add a title to see it here)</span>
                    )}
                  </h1>
                  {post.excerpt && (
                    <p className="text-lg md:text-xl text-gray-100 max-w-3xl drop-shadow">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto px-8 py-8">
              {/* Article Header (if no cover image) */}
              {!post.featured_image && (
                <header className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    {post.title || (
                      <span className="text-gray-400 italic">Untitled Post (Add a title to see it here)</span>
                    )}
                  </h1>
                  {post.excerpt && (
                    <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
                  )}
                </header>
              )}

              {/* Meta Information */}
              <Card className="p-6 mb-8 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-500 text-white">
                        <User size={20} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Smart Travel Hacks Team</div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{format(new Date(), 'MMMM d, yyyy')}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{readingTime} min read</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Share Buttons */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                      <Facebook size={20} />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-sky-500 hover:bg-sky-50 rounded transition">
                      <Twitter size={20} />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded transition">
                      <Linkedin size={20} />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition">
                      <Mail size={20} />
                    </button>
                  </div>
                </div>

                {/* Categories and Tags */}
                {(postCategories.length > 0 || postTags.length > 0) && (
                  <>
                    <div className="my-4 border-t" />
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {postCategories.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Folder size={16} className="text-gray-500" />
                          {postCategories.map(category => (
                            <Badge key={category.id} variant="secondary">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {postTags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag size={16} className="text-gray-500" />
                          {postTags.map(tag => (
                            <Badge key={tag.id} variant="outline">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>

              {/* Content */}
              <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                {parsedContent ? (
                  <ContentRenderer blocks={parsedContent} showAds={false} />
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <p>No content yet. Start writing to see it here!</p>
                  </div>
                )}
              </div>

              {/* Author Box */}
              <Card className="p-6 mb-8">
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                      AS
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg mb-2">About the Author</h3>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Smart Travel Hacks Team</p>
                    <p className="text-gray-600">
                      Travel-focused editorial team sharing destination ideas, planning notes, and practical tips to help readers travel with more confidence.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
