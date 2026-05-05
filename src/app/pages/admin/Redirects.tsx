import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Plus, Trash2, ExternalLink, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { redirectApi } from '../../lib/api';

import { logger } from '../../lib/logger';
interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  type: '301' | '302';
  created_at: string;
  hit_count?: number;
}

export default function Redirects() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    from_path: '',
    to_path: '',
    type: '301' as '301' | '302',
  });

  useEffect(() => {
    loadRedirects();
  }, []);

  async function loadRedirects() {
    try {
      setLoading(true);
      const data = await redirectApi.list();
      setRedirects(data || []);
    } catch (error: any) {
      logger.error('Failed to load redirects:', error);
      toast.error('Failed to load redirects');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate paths
    if (!formData.from_path.startsWith('/')) {
      toast.error('From path must start with /');
      return;
    }
    if (!formData.to_path.startsWith('/') && !formData.to_path.startsWith('http')) {
      toast.error('To path must start with / or be a full URL');
      return;
    }

    try {
      await redirectApi.create(formData);
      toast.success('Redirect created successfully');
      setShowForm(false);
      setFormData({ from_path: '', to_path: '', type: '301' });
      loadRedirects(); // Reload the list
    } catch (error) {
      logger.error('Failed to create redirect:', error);
      toast.error('Failed to create redirect');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this redirect?')) {
      return;
    }

    try {
      await redirectApi.delete(id);
      toast.success('Redirect deleted');
      loadRedirects(); // Reload the list
    } catch (error) {
      logger.error('Failed to delete redirect:', error);
      toast.error('Failed to delete redirect');
    }
  }

  function exportRedirects() {
    if (redirects.length === 0) {
      toast.error('No redirects to export');
      return;
    }

    // Export as JSON
    const jsonData = JSON.stringify(redirects, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redirects.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Redirects exported');
  }

  function exportAsVercelConfig() {
    if (redirects.length === 0) {
      toast.error('No redirects to export');
      return;
    }

    // Export as Vercel vercel.json format
    const vercelConfig = {
      redirects: redirects.map(r => ({
        source: r.from_path,
        destination: r.to_path,
        permanent: r.type === '301'
      }))
    };

    const jsonData = JSON.stringify(vercelConfig, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vercel.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Vercel config exported');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading redirects...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">301 Redirects</h1>
          <p className="text-muted-foreground mt-1">
            Manage URL redirects to preserve SEO value
          </p>
        </div>
        <div className="flex gap-2">
          {redirects.length > 0 && (
            <>
              <Button variant="outline" onClick={exportRedirects}>
                Export JSON
              </Button>
              <Button variant="outline" onClick={exportAsVercelConfig}>
                Export Vercel
              </Button>
            </>
          )}
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-2" />
            Add Redirect
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-900">About 301 Redirects</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>301 (Permanent):</strong> Use when content moved permanently. Passes ~90-99% of SEO value.</li>
          <li><strong>302 (Temporary):</strong> Use for temporary changes. Does not pass full SEO value.</li>
          <li>Always redirect old URLs when consolidating or updating posts</li>
          <li>Use specific redirects (not wildcards) for best SEO results</li>
        </ul>
      </Card>

      {/* Create Form */}
      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Redirect</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                From Path <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="/old-post-slug"
                value={formData.from_path}
                onChange={(e) => setFormData({ ...formData, from_path: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The old URL path (must start with /)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                To Path <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="/new-post-slug or https://example.com"
                value={formData.to_path}
                onChange={(e) => setFormData({ ...formData, to_path: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The new URL (can be relative path or full URL)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Redirect Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as '301' | '302' })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="301">301 - Permanent (recommended)</option>
                <option value="302">302 - Temporary</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create Redirect</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Redirects List */}
      <Card>
        {redirects.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No redirects configured yet. Add your first redirect to preserve SEO value when moving or consolidating content.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Hits</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((redirect) => (
                  <tr key={redirect.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {redirect.from_path}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <ArrowRight size={16} className="text-muted-foreground" />
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {redirect.to_path}
                        </code>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        redirect.type === '301' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {redirect.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{redirect.hit_count || 0}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(redirect.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <a href={redirect.to_path} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" title="Test Redirect">
                            <ExternalLink size={14} />
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(redirect.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Implementation Note */}
      <Card className="p-4 bg-green-50 border-green-200">
        <h3 className="font-semibold mb-2 text-green-900">✅ Redirects Are Active</h3>
        <p className="text-sm text-green-800">
          Your redirects are stored in the database and will automatically work when users navigate to old URLs. The system checks for redirects and automatically forwards users to the new location.
        </p>
        <ul className="text-sm text-green-800 mt-2 space-y-1 list-disc list-inside ml-2">
          <li>301 redirects pass SEO value to the new URL</li>
          <li>Hit counts are tracked automatically</li>
          <li>You can export redirects for use with hosting providers if needed</li>
        </ul>
      </Card>
    </div>
  );
}