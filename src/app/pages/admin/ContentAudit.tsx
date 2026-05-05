import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { logger } from '../../lib/logger';
import {
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Edit2, 
  Eye,
  ArrowUpDown,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { postApi } from '../../lib/api';
import { format, differenceInDays } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  views?: number;
  needs_update?: boolean;
  last_content_update?: string;
}

type SortField = 'age' | 'views' | 'updated' | 'title';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'needs-update' | 'old' | 'low-traffic' | 'high-performer';

export default function ContentAudit() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('age');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await postApi.list({ status: 'published' });
      setPosts(data || []);
    } catch (error: any) {
      logger.error('Failed to load posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  function getPostAge(post: Post): number {
    const date = new Date(post.published_at || post.created_at);
    return differenceInDays(new Date(), date);
  }

  function getPostStatus(post: Post): {
    label: string;
    color: string;
    icon: any;
  } {
    const age = getPostAge(post);
    const views = post.views || 0;

    if (post.needs_update) {
      return { label: 'Needs Update', color: 'text-orange-600', icon: AlertTriangle };
    }
    if (age > 365 && views < 100) {
      return { label: 'Old & Low Traffic', color: 'text-red-600', icon: AlertTriangle };
    }
    if (age > 365) {
      return { label: 'Outdated', color: 'text-yellow-600', icon: Calendar };
    }
    if (views > 1000) {
      return { label: 'High Performer', color: 'text-green-600', icon: TrendingUp };
    }
    return { label: 'Good', color: 'text-blue-600', icon: CheckCircle };
  }

  function filterPosts(posts: Post[]): Post[] {
    let filtered = posts;

    // Apply filter
    switch (filter) {
      case 'needs-update':
        filtered = filtered.filter(p => p.needs_update);
        break;
      case 'old':
        filtered = filtered.filter(p => getPostAge(p) > 365);
        break;
      case 'low-traffic':
        filtered = filtered.filter(p => (p.views || 0) < 100);
        break;
      case 'high-performer':
        filtered = filtered.filter(p => (p.views || 0) > 1000);
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.slug.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let compareA: any, compareB: any;

      switch (sortField) {
        case 'age':
          compareA = getPostAge(a);
          compareB = getPostAge(b);
          break;
        case 'views':
          compareA = a.views || 0;
          compareB = b.views || 0;
          break;
        case 'updated':
          compareA = new Date(a.updated_at).getTime();
          compareB = new Date(b.updated_at).getTime();
          break;
        case 'title':
          compareA = a.title.toLowerCase();
          compareB = b.title.toLowerCase();
          break;
      }

      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });

    return filtered;
  }

  async function toggleNeedsUpdate(postId: string, currentValue: boolean) {
    try {
      await postApi.update(postId, { needs_update: !currentValue });
      toast.success(!currentValue ? 'Marked as needs update' : 'Marked as up to date');
      loadPosts();
    } catch (error) {
      toast.error('Failed to update post');
    }
  }

  async function bulkMarkNeedsUpdate() {
    if (selectedPosts.size === 0) {
      toast.error('No posts selected');
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedPosts).map(id => 
          postApi.update(id, { needs_update: true })
        )
      );
      toast.success(`Marked ${selectedPosts.size} posts as needs update`);
      setSelectedPosts(new Set());
      loadPosts();
    } catch (error) {
      toast.error('Failed to update posts');
    }
  }

  async function bulkMarkUpdated() {
    if (selectedPosts.size === 0) {
      toast.error('No posts selected');
      return;
    }

    try {
      const now = new Date().toISOString();
      await Promise.all(
        Array.from(selectedPosts).map(id => 
          postApi.update(id, { 
            needs_update: false,
            last_content_update: now,
            updated_at: now
          })
        )
      );
      toast.success(`Marked ${selectedPosts.size} posts as updated`);
      setSelectedPosts(new Set());
      loadPosts();
    } catch (error) {
      toast.error('Failed to update posts');
    }
  }

  function togglePostSelection(postId: string) {
    const newSelection = new Set(selectedPosts);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    setSelectedPosts(newSelection);
  }

  function toggleAllPosts() {
    if (selectedPosts.size === filteredPosts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
    }
  }

  const filteredPosts = filterPosts(posts);
  const stats = {
    total: posts.length,
    needsUpdate: posts.filter(p => p.needs_update).length,
    old: posts.filter(p => getPostAge(p) > 365).length,
    lowTraffic: posts.filter(p => (p.views || 0) < 100).length,
    highPerformers: posts.filter(p => (p.views || 0) > 1000).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading content audit...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Content Audit</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Analyze and optimize your content library
          </p>
        </div>
        <Link to="/admin/redirects">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ExternalLink size={16} className="mr-2" />
            Manage Redirects
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Posts</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setFilter('needs-update')}>
          <div className="text-sm text-orange-600 flex items-center gap-1">
            <AlertTriangle size={14} />
            Needs Update
          </div>
          <div className="text-2xl font-bold mt-1">{stats.needsUpdate}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setFilter('old')}>
          <div className="text-sm text-yellow-600 flex items-center gap-1">
            <Calendar size={14} />
            Over 1 Year Old
          </div>
          <div className="text-2xl font-bold mt-1">{stats.old}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setFilter('low-traffic')}>
          <div className="text-sm text-red-600 flex items-center gap-1">
            <TrendingUp size={14} />
            Low Traffic
          </div>
          <div className="text-2xl font-bold mt-1">{stats.lowTraffic}</div>
        </Card>
        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setFilter('high-performer')}>
          <div className="text-sm text-green-600 flex items-center gap-1">
            <TrendingUp size={14} />
            High Performers
          </div>
          <div className="text-2xl font-bold mt-1">{stats.highPerformers}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Posts</option>
            <option value="needs-update">Needs Update</option>
            <option value="old">Over 1 Year Old</option>
            <option value="low-traffic">Low Traffic (&lt;100 views)</option>
            <option value="high-performer">High Performers (&gt;1000 views)</option>
          </select>

          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field as SortField);
              setSortOrder(order as SortOrder);
            }}
            className="px-3 py-2 border rounded-md"
          >
            <option value="age-desc">Oldest First</option>
            <option value="age-asc">Newest First</option>
            <option value="views-desc">Most Views</option>
            <option value="views-asc">Least Views</option>
            <option value="updated-desc">Recently Updated</option>
            <option value="updated-asc">Needs Update</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm font-medium">
              {selectedPosts.size} post{selectedPosts.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={bulkMarkNeedsUpdate} className="flex-1 sm:flex-none">
                <AlertTriangle size={14} className="mr-1" />
                <span className="hidden sm:inline">Mark Needs Update</span>
                <span className="sm:hidden">Needs Update</span>
              </Button>
              <Button size="sm" onClick={bulkMarkUpdated} className="flex-1 sm:flex-none">
                <CheckCircle size={14} className="mr-1" />
                <span className="hidden sm:inline">Mark as Updated</span>
                <span className="sm:hidden">Updated</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedPosts(new Set())} className="flex-1 sm:flex-none">
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Posts List */}
      <Card className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                    onChange={toggleAllPosts}
                    className="w-4 h-4"
                  />
                </th>
                <th className="p-4">Post</th>
                <th className="p-4">Status</th>
                <th className="p-4">Age</th>
                <th className="p-4">Views</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => {
                const status = getPostStatus(post);
                const age = getPostAge(post);
                const StatusIcon = status.icon;

                return (
                  <tr key={post.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{post.title}</div>
                      <div className="text-sm text-muted-foreground">/blog/{post.slug}</div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 ${status.color}`}>
                        <StatusIcon size={16} />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {age} days
                        {age > 365 && (
                          <div className="text-xs text-muted-foreground">
                            ({Math.floor(age / 365)} year{Math.floor(age / 365) !== 1 ? 's' : ''})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{post.views || 0}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {format(new Date(post.updated_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link to={`/admin/posts/edit/${post.id}`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Edit2 size={14} />
                          </Button>
                        </Link>
                        <Link to={`/blog/${post.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" title="View">
                            <Eye size={14} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNeedsUpdate(post.id, post.needs_update || false)}
                          title={post.needs_update ? 'Mark as updated' : 'Mark needs update'}
                        >
                          <RefreshCw size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No posts found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const status = getPostStatus(post);
              const age = getPostAge(post);
              const StatusIcon = status.icon;

              return (
                <div key={post.id} className="p-4 space-y-3">
                  {/* Header with checkbox and title */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="w-4 h-4 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{post.title}</div>
                      <div className="text-sm text-muted-foreground truncate">/blog/{post.slug}</div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="pl-7">
                    <div className={`inline-flex items-center gap-2 ${status.color} bg-gray-50 px-3 py-1 rounded-full text-sm font-medium`}>
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 pl-7">
                    <div>
                      <div className="text-xs text-muted-foreground">Age</div>
                      <div className="text-sm font-medium">
                        {age > 365 ? `${Math.floor(age / 365)}y` : `${age}d`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Views</div>
                      <div className="text-sm font-medium">{post.views || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Updated</div>
                      <div className="text-sm font-medium">
                        {format(new Date(post.updated_at), 'MMM d')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pl-7">
                    <Link to={`/admin/posts/edit/${post.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit2 size={14} className="mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link to={`/blog/${post.slug}`} target="_blank" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleNeedsUpdate(post.id, post.needs_update || false)}
                      title={post.needs_update ? 'Mark as updated' : 'Mark needs update'}
                    >
                      <RefreshCw size={14} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground hidden lg:block">
            No posts found matching your filters
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Status Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-600" />
            <span><strong>Good:</strong> Recent content, decent traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-600" />
            <span><strong>High Performer:</strong> 1000+ views</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-yellow-600" />
            <span><strong>Outdated:</strong> Over 1 year old</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-600" />
            <span><strong>Needs Update:</strong> Manually flagged</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span><strong>Old & Low Traffic:</strong> Needs attention</span>
          </div>
        </div>
      </Card>
    </div>
  );
}