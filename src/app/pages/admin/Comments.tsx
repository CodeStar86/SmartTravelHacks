import { useState, useEffect } from 'react';
import { commentApi, postApi } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { logger } from '../../lib/logger';
import {
  MessageSquare, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Trash2,
  Filter,
  MoreVertical,
  Eye,
  Globe,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  author_website?: string | null;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  created_at: string;
  updated_at: string;
}

export default function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    spam: 0,
    rejected: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterComments();
  }, [comments, selectedStatus, searchQuery]);

  async function loadData() {
    setLoading(true);
    try {
      const [commentsRes, statsRes, postsRes] = await Promise.all([
        commentApi.list(),
        commentApi.getStats(),
        postApi.list({ limit: 1000 }), // Load all posts for mapping
      ]);

      setComments(commentsRes.comments || []);
      setStats(statsRes);
      // postApi.list() returns an array in this app. Keep a fallback for older API response shapes.
      setPosts(Array.isArray(postsRes) ? postsRes : (postsRes.posts || []));
    } catch (error) {
      logger.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterComments() {
    let filtered = [...comments];

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => c.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.author_name.toLowerCase().includes(query) ||
        c.author_email.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query)
      );
    }

    setFilteredComments(filtered);
  }

  function getPostTitle(postId: string): string {
    const post = posts.find(p => p.id === postId || p.slug === postId);
    return post ? post.title : 'Unknown Post';
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredComments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComments.map(c => c.id));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  async function handleBulkAction(action: 'approved' | 'rejected' | 'spam' | 'delete') {
    if (selectedIds.length === 0) return;

    const confirmMsg = action === 'delete' 
      ? `Delete ${selectedIds.length} comment(s)? This cannot be undone.`
      : `Mark ${selectedIds.length} comment(s) as ${action}?`;

    if (!confirm(confirmMsg)) return;

    setBulkLoading(true);
    try {
      await commentApi.bulkAction(action, selectedIds);
      await loadData();
      setSelectedIds([]);
    } catch (error) {
      logger.error('Bulk action failed:', error);
      alert('Failed to perform bulk action');
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleSingleAction(commentId: string, action: 'approved' | 'rejected' | 'spam' | 'delete') {
    if (action === 'delete') {
      if (!confirm('Delete this comment? This cannot be undone.')) return;
      try {
        await commentApi.delete(commentId);
        await loadData();
      } catch (error) {
        logger.error('Delete failed:', error);
        alert('Failed to delete comment');
      }
    } else {
      try {
        await commentApi.update(commentId, { status: action });
        await loadData();
      } catch (error) {
        logger.error('Update failed:', error);
        alert('Failed to update comment status');
      }
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      pending: { variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' },
      approved: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      spam: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      rejected: { variant: 'outline' as const, icon: XCircle, color: 'text-gray-600' },
    };

    const style = styles[status as keyof typeof styles] || styles.pending;
    const Icon = style.icon;

    return (
      <Badge variant={style.variant} className="flex items-center gap-1">
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3">
          <MessageSquare className="text-blue-600" size={28} />
          <span>Comments Management</span>
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Moderate and manage user comments across all blog posts
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <MessageSquare className="text-gray-400" size={24} />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedStatus('pending')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <AlertTriangle className="text-yellow-600" size={24} />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedStatus('approved')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedStatus('spam')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Spam</p>
              <p className="text-2xl font-bold text-red-600">{stats.spam}</p>
            </div>
            <XCircle className="text-red-600" size={24} />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition" onClick={() => setSelectedStatus('rejected')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-600">{stats.rejected}</p>
            </div>
            <XCircle className="text-gray-600" size={24} />
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search by author name, email, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('all')}
              className="flex items-center gap-2"
              size="sm"
            >
              <Filter size={16} />
              All
            </Button>
            <Button
              variant={selectedStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('pending')}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={selectedStatus === 'approved' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('approved')}
              size="sm"
            >
              Approved
            </Button>
            <Button
              variant={selectedStatus === 'spam' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('spam')}
              size="sm"
            >
              Spam
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-blue-900">
                {selectedIds.length} comment{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('approved')}
                  disabled={bulkLoading}
                  className="bg-white flex-1 sm:flex-none"
                >
                  <CheckCircle size={14} className="mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('rejected')}
                  disabled={bulkLoading}
                  className="bg-white flex-1 sm:flex-none"
                >
                  <XCircle size={14} className="mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('spam')}
                  disabled={bulkLoading}
                  className="bg-white flex-1 sm:flex-none"
                >
                  <AlertTriangle size={14} className="mr-1" />
                  Spam
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkLoading}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Comments List */}
      <Card className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedIds.length === filteredComments.length && filteredComments.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Author</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Comment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Post</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">No comments found</p>
                    <p className="text-sm">Try adjusting your filters or search query</p>
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => (
                  <tr key={comment.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedIds.includes(comment.id)}
                        onCheckedChange={() => toggleSelect(comment.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {comment.author_name}
                          {comment.author_website && (
                            <a
                              href={comment.author_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700"
                              title="Visit website"
                            >
                              <Globe size={14} />
                            </a>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail size={12} />
                          {comment.author_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-md">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {comment.content}
                      </p>
                      {comment.parent_id && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Reply
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {getPostTitle(comment.post_id)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(comment.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(comment.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(comment.created_at), 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {comment.status !== 'approved' && (
                            <DropdownMenuItem
                              onClick={() => handleSingleAction(comment.id, 'approved')}
                              className="text-green-600"
                            >
                              <CheckCircle size={14} className="mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {comment.status !== 'rejected' && (
                            <DropdownMenuItem
                              onClick={() => handleSingleAction(comment.id, 'rejected')}
                              className="text-gray-600"
                            >
                              <XCircle size={14} className="mr-2" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          {comment.status !== 'spam' && (
                            <DropdownMenuItem
                              onClick={() => handleSingleAction(comment.id, 'spam')}
                              className="text-yellow-600"
                            >
                              <AlertTriangle size={14} className="mr-2" />
                              Mark as Spam
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleSingleAction(comment.id, 'delete')}
                            className="text-red-600"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y">
          {filteredComments.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold">No comments found</p>
              <p className="text-sm">Try adjusting your filters or search query</p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div key={comment.id} className="p-4 space-y-3">
                {/* Header with checkbox and actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedIds.includes(comment.id)}
                      onCheckedChange={() => toggleSelect(comment.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{comment.author_name}</span>
                        {comment.author_website && (
                          <a
                            href={comment.author_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                            title="Visit website"
                          >
                            <Globe size={14} />
                          </a>
                        )}
                        {comment.parent_id && (
                          <Badge variant="outline" className="text-xs">
                            Reply
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Mail size={12} />
                        <span className="truncate">{comment.author_email}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {comment.status !== 'approved' && (
                        <DropdownMenuItem
                          onClick={() => handleSingleAction(comment.id, 'approved')}
                          className="text-green-600"
                        >
                          <CheckCircle size={14} className="mr-2" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {comment.status !== 'rejected' && (
                        <DropdownMenuItem
                          onClick={() => handleSingleAction(comment.id, 'rejected')}
                          className="text-gray-600"
                        >
                          <XCircle size={14} className="mr-2" />
                          Reject
                        </DropdownMenuItem>
                      )}
                      {comment.status !== 'spam' && (
                        <DropdownMenuItem
                          onClick={() => handleSingleAction(comment.id, 'spam')}
                          className="text-yellow-600"
                        >
                          <AlertTriangle size={14} className="mr-2" />
                          Mark as Spam
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleSingleAction(comment.id, 'delete')}
                        className="text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Comment content */}
                <p className="text-sm text-gray-700 pl-9">
                  {comment.content}
                </p>

                {/* Post title */}
                <div className="text-sm text-gray-600 pl-9">
                  <span className="font-medium">Post:</span> {getPostTitle(comment.post_id)}
                </div>

                {/* Footer with status and date */}
                <div className="flex items-center justify-between gap-2 pl-9">
                  {getStatusBadge(comment.status)}
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Results Summary */}
      <div className="text-center text-sm text-gray-600">
        Showing {filteredComments.length} of {comments.length} total comments
      </div>
    </div>
  );
}