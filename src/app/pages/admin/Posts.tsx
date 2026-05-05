import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Plus, Edit2, Trash2, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { postApi } from '../../lib/api';

import { logger } from '../../lib/logger';
interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const location = useLocation();
  const postsPerPage = 20;

  // Reload posts whenever the location changes or search/page changes
  useEffect(() => {
    loadPosts();
  }, [page, searchQuery]);

  async function loadPosts() {
    try {
      setLoading(true);
      const response = await postApi.list({
        limit: postsPerPage,
        offset: (page - 1) * postsPerPage,
        search: searchQuery || undefined,
      });
      
      // Handle both old and new response formats
      const data = Array.isArray(response) ? response : response.posts || [];
      const totalCount = Array.isArray(response) ? data.length : response.total || 0;
      const hasMorePosts = Array.isArray(response) ? data.length === postsPerPage : response.hasMore || false;
      
      setPosts(data);
      setTotal(totalCount);
      setHasMore(hasMorePosts);
    } catch (error: any) {
      logger.error('Failed to load posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await postApi.delete(id);
      toast.success('Post deleted successfully');
      loadPosts();
    } catch (error: any) {
      logger.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      scheduled: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your blog posts {total > 0 && `(${total} total)`}
          </p>
        </div>
        <Link to="/admin/posts/new">
          <Button>
            <Plus size={16} className="mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, excerpt, or slug..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset to page 1 when searching
            }}
            className="flex-1"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {posts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? `No posts found matching "${searchQuery}"`
              : 'No posts yet. Create your first blog post to get started.'}
          </p>
          {!searchQuery && (
            <Link to="/admin/posts/new">
              <Button>
                <Plus size={16} className="mr-2" />
                Create First Post
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{post.title}</h3>
                      {getStatusBadge(post.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      /blog/{post.slug}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created {new Date(post.created_at).toLocaleDateString()}</span>
                      <span>Updated {new Date(post.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {post.status === 'published' && (
                      <Link to={`/blog/${post.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" title="View Post">
                          <Eye size={16} />
                        </Button>
                      </Link>
                    )}
                    <Link to={`/admin/posts/edit/${post.id}`}>
                      <Button variant="ghost" size="sm" title="Edit Post">
                        <Edit2 size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(post.id, post.title)}
                      title="Delete Post"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {(page > 1 || hasMore) && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * postsPerPage) + 1} - {Math.min(page * postsPerPage, total)} of {total} posts
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center px-4 text-sm">
                    Page {page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasMore}
                  >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
