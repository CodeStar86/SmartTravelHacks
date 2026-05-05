import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { FileText, Folder, Tag, Image, Plus, TrendingUp, Mail, MessageSquare, MessageCircle } from 'lucide-react';
import { postApi, categoryApi, tagApi, mediaApi, affiliateApi, analyticsApi, commentApi } from '../../lib/api';
import { toast } from 'sonner';
import { API_BASE } from '../../lib/env';
import { getAccessToken } from '../../lib/supabase';
import { SystemStatus } from '../../components/admin/SystemStatus';
import { filterLegacyAICategories } from '../../lib/category-utils';

import { logger } from '../../lib/logger';
export default function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    categories: 0,
    tags: 0,
    media: 0,
    affiliates: 0,
    totalClicks: 0,
    subscribers: 0,
    messages: 0,
    comments: 0,
    pendingComments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      
      const [
        postsCount, 
        categories, 
        tags, 
        media, 
        affiliateData, 
        analyticsData,
        subscribersData, 
        messagesData,
        commentStats
      ] = await Promise.all([
        postApi.count().catch(() => ({ count: 0 })),
        categoryApi.list().catch(() => []),
        tagApi.list().catch(() => []),
        mediaApi.list().catch(() => []),
        affiliateApi.list().catch(() => ({ affiliates: [] })),
        analyticsApi.getDashboardStats().catch(() => ({ stats: {} })),
        fetch(`${API_BASE}/subscribers`, {
          headers: { 'Authorization': `Bearer ${await getAccessToken() || ''}` }
        }).then(r => r.json()).catch(() => ({ total: 0 })),
        fetch(`${API_BASE}/messages`, {
          headers: { 'Authorization': `Bearer ${await getAccessToken() || ''}` }
        }).then(r => r.json()).catch(() => []),
        commentApi.getStats().catch(() => ({ total: 0, pending: 0 })),
      ]);

      const affiliates = affiliateData?.affiliates || [];
      const visibleCategories = filterLegacyAICategories(categories || []);
      const totalClicks = analyticsData?.stats?.total_affiliate_clicks ?? affiliates.reduce((sum: number, aff: any) => sum + (aff.clicks || 0), 0);
      const messages = Array.isArray(messagesData) ? messagesData : [];

      setStats({
        posts: postsCount?.count || 0,
        categories: visibleCategories.length || 0,
        tags: tags?.length || 0,
        media: media?.length || 0,
        affiliates: affiliates.length,
        totalClicks,
        subscribers: subscribersData?.total || 0,
        messages: messages.length,
        comments: commentStats?.total || 0,
        pendingComments: commentStats?.pending || 0,
      });
    } catch (error: any) {
      logger.error('Failed to load stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Posts', value: stats.posts, icon: FileText, color: 'bg-blue-500', link: '/admin/posts' },
    { label: 'Categories', value: stats.categories, icon: Folder, color: 'bg-green-500', link: '/admin/categories' },
    { label: 'Tags', value: stats.tags, icon: Tag, color: 'bg-purple-500', link: '/admin/tags' },
    { label: 'Comments', value: stats.comments, icon: MessageCircle, color: 'bg-cyan-500', link: '/admin/comments', badge: stats.pendingComments > 0 ? `${stats.pendingComments} pending` : null },
    { label: 'Subscribers', value: stats.subscribers, icon: Mail, color: 'bg-teal-500', link: '/admin/subscribers' },
    { label: 'Messages', value: stats.messages, icon: MessageSquare, color: 'bg-yellow-500', link: '/admin/messages' },
    { label: 'Media Files', value: stats.media, icon: Image, color: 'bg-orange-500', link: '/admin/media' },
    { label: 'Affiliate Links', value: stats.affiliates, icon: TrendingUp, color: 'bg-pink-500', link: '/admin/affiliates' },
    { label: 'Total Clicks', value: stats.totalClicks, icon: TrendingUp, color: 'bg-indigo-500', link: '/admin/affiliates' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to Smart Travel Hacks admin panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="p-6 hover:shadow-lg transition cursor-pointer relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">
                    {loading ? '...' : stat.value}
                  </p>
                  {stat.badge && (
                    <p className="text-xs text-red-600 font-semibold mt-1">
                      {stat.badge}
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/posts/new">
            <Button>
              <Plus size={16} className="mr-2" />
              New Post
            </Button>
          </Link>
          <Link to="/admin/content-audit">
            <Button variant="outline">
              <TrendingUp size={16} className="mr-2" />
              Content Audit
            </Button>
          </Link>
          <Link to="/admin/affiliates">
            <Button variant="outline">
              <Plus size={16} className="mr-2" />
              New Affiliate Link
            </Button>
          </Link>
          <Link to="/admin/categories">
            <Button variant="outline">
              <Plus size={16} className="mr-2" />
              New Category
            </Button>
          </Link>
          <Link to="/admin/tags">
            <Button variant="outline">
              <Plus size={16} className="mr-2" />
              New Tag
            </Button>
          </Link>
          <Link to="/admin/media">
            <Button variant="outline">
              <Plus size={16} className="mr-2" />
              Upload Media
            </Button>
          </Link>
        </div>
      </Card>

      {/* Getting Started */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium">Create Categories</p>
              <p className="text-muted-foreground">Organize your blog posts by topic</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium">Add Tags</p>
              <p className="text-muted-foreground">Help readers discover related content</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium">Upload Media</p>
              <p className="text-muted-foreground">Add images for your blog posts</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
              4
            </div>
            <div>
              <p className="font-medium">Write Your First Post</p>
              <p className="text-muted-foreground">Create engaging travel-focused content</p>
            </div>
          </div>
        </div>
      </Card>

      {/* System Status */}
      <SystemStatus />
    </div>
  );
}