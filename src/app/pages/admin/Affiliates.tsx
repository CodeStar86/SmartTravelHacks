import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Plus, Edit2, Trash2, Copy, ExternalLink, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { affiliateApi, settingsApi } from '../../lib/api';

import { logger } from '../../lib/logger';
interface AffiliateLink {
  id: string;
  name: string;
  slug: string;
  destination_url: string;
  category?: string;
  notes?: string;
  clicks: number;
  created_at: string;
}

export default function Affiliates() {
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    destination_url: '',
    category: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

useEffect(() => {
  function refreshOnFocus() {
    loadAffiliates();
  }

  function refreshOnVisible() {
    if (document.visibilityState === 'visible') {
      loadAffiliates();
    }
  }

  window.addEventListener('focus', refreshOnFocus);
  document.addEventListener('visibilitychange', refreshOnVisible);

  return () => {
    window.removeEventListener('focus', refreshOnFocus);
    document.removeEventListener('visibilitychange', refreshOnVisible);
  };
}, []);

  async function loadData() {
    try {
      setLoading(true);
      const [affiliateData, settingsData] = await Promise.all([
        affiliateApi.list(),
        settingsApi.get(),
      ]);
      
      setAffiliates(affiliateData.affiliates || []);
      setSiteUrl(settingsData?.site_url || window.location.origin);
    } catch (error: any) {
      logger.error('Failed to load data:', error);
      toast.error('Failed to load affiliate links');
      setSiteUrl(window.location.origin);
    } finally {
      setLoading(false);
    }
  }

  async function loadAffiliates() {
    try {
      const data = await affiliateApi.list();
      setAffiliates(data.affiliates || []);
    } catch (error: any) {
      logger.error('Failed to load affiliates:', error);
      toast.error('Failed to load affiliate links');
    }
  }

  function handleNew() {
    setFormData({ name: '', slug: '', destination_url: '', category: '', notes: '' });
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(affiliate: AffiliateLink) {
    setFormData({
      name: affiliate.name,
      slug: affiliate.slug,
      destination_url: affiliate.destination_url,
      category: affiliate.category || '',
      notes: affiliate.notes || '',
    });
    setEditingId(affiliate.id);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', destination_url: '', category: '', notes: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.destination_url) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingId) {
        await affiliateApi.update(editingId, formData);
        toast.success('Affiliate link updated');
      } else {
        await affiliateApi.create(formData);
        toast.success('Affiliate link created');
      }
      handleCancel();
      loadAffiliates();
    } catch (error: any) {
      logger.error('Failed to save affiliate:', error);
      toast.error('Failed to save affiliate link');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;

    try {
      await affiliateApi.delete(id);
      toast.success('Affiliate link deleted');
      loadAffiliates();
    } catch (error: any) {
      logger.error('Failed to delete affiliate:', error);
      toast.error('Failed to delete affiliate link');
    }
  }

  function copyAffiliateUrl(slug: string) {
    const url = `${siteUrl}/go/${slug}`;
    
    // Fallback method that works even when Clipboard API is blocked
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          () => toast.success('Affiliate URL copied to clipboard!'),
          () => fallbackCopy(url)
        );
      } else {
        fallbackCopy(url);
      }
    } catch (error) {
      fallbackCopy(url);
    }
    
    function fallbackCopy(text: string) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Affiliate URL copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy URL');
      }
      document.body.removeChild(textArea);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading affiliate links...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Affiliate Links</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your affiliate links and track clicks
          </p>
        </div>
        <Button onClick={handleNew} className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" />
          New Link
        </Button>
      </div>

      {/* Site URL Warning */}
      {!siteUrl || siteUrl === window.location.origin ? (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 mt-0.5">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Site URL not configured</p>
              <p className="text-xs text-yellow-700 mt-1">
                Configure your site URL in{' '}
                <a href="/admin/settings" className="underline font-medium">Settings</a>
                {' '}to generate proper affiliate links for your production website.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit' : 'Create'} Affiliate Link
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Link Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: !editingId ? generateSlug(name) : formData.slug,
                  });
                }}
                placeholder="e.g., ChatGPT Plus"
                required
                className="transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Slug * (URL: /go/your-slug)
              </label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: generateSlug(e.target.value) })
                }
                placeholder="chatgpt-plus"
                required
                className="transition-all duration-200"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Your link: <span className="font-mono text-blue-600">{siteUrl}/go/{formData.slug || 'your-slug'}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Category
              </label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Flights, Hotels, Transfers, Insurance"
                className="transition-all duration-200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional grouping used on the Travel Resources page
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes / Description
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Short description shown on the Travel Resources page"
                rows={4}
                className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Destination URL *
              </label>
              <Input
                value={formData.destination_url}
                onChange={(e) =>
                  setFormData({ ...formData, destination_url: e.target.value })
                }
                placeholder="https://example.com/your-affiliate-link"
                type="url"
                required
                className="transition-all duration-200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The URL where users will be redirected
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="min-w-[120px]">
                {editingId ? 'Update' : 'Create'} Link
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Affiliate Links List */}
      {affiliates.length === 0 ? (
        <Card className="p-12 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            No affiliate links yet. Create your first link to start tracking clicks.
          </p>
          <Button onClick={handleNew}>
            <Plus size={16} className="mr-2" />
            Create First Link
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {affiliates.map((affiliate) => (
            <Card key={affiliate.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{affiliate.name}</h3>
                    <span className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-700">
                      {affiliate.clicks || 0} clicks
                    </span>
                  </div>
                  <div className="space-y-1">
                    {affiliate.category ? (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Category:</span> {affiliate.category}
                      </p>
                    ) : null}
                    {affiliate.notes ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {affiliate.notes}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium">Your Link:</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        /go/{affiliate.slug}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => copyAffiliateUrl(affiliate.slug)}
                      >
                        <Copy size={12} />
                      </Button>
                    </p>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                      <span className="font-medium">Destination:</span>
                      <a
                        href={affiliate.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {affiliate.destination_url}
                      </a>
                      <ExternalLink size={12} />
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(affiliate)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(affiliate.id, affiliate.name)}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          How to Use Affiliate Links
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 mb-4">
          <li>• Create affiliate links with memorable slugs (e.g., /go/trip-com)</li>
          <li>• Add an optional category like Flights, Hotels, Transfers, or Insurance</li>
          <li>• Add notes to control the short description shown on the Travel Resources page</li>
          <li>• Every saved link with a destination URL now appears on the Travel Resources page automatically</li>
          <li>• You can still use /go/your-slug links anywhere else for click tracking</li>
        </ul>
        
        <div className="mt-4 pt-4 border-t border-blue-300">
          <p className="font-semibold mb-2 text-sm">Using Links in Blog Posts:</p>
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
            {'<a href="/go/your-slug" rel="sponsored">Your Link Text</a>'}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Or use the full URL: <code className="bg-white px-1 py-0.5 rounded">{siteUrl}/go/your-slug</code>
          </p>
        </div>
      </Card>
    </div>
  );
}