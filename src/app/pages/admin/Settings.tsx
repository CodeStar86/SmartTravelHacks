import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { settingsApi } from '../../lib/api';
import { Check, AlertCircle } from 'lucide-react';

import { logger } from '../../lib/logger';
export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSettings, setInitialSettings] = useState({
    site_title: '',
    site_description: '',
    site_url: 'https://wwwa-i-s-u-m-m-i-t.com',
    social_tiktok: '',
    social_instagram: '',
    social_facebook: '',
    social_youtube: '',
  });
  const [settings, setSettings] = useState({
    site_title: '',
    site_description: '',
    site_url: 'https://wwwa-i-s-u-m-m-i-t.com',
    social_tiktok: '',
    social_instagram: '',
    social_facebook: '',
    social_youtube: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Check if settings have changed
    const changed = JSON.stringify(settings) !== JSON.stringify(initialSettings);
    setHasChanges(changed);
  }, [settings, initialSettings]);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await settingsApi.getAdmin();
      if (data) {
        const safeSettings = {
          site_title: data.site_title || '',
          site_description: data.site_description || '',
          site_url: data.site_url || 'https://wwwa-i-s-u-m-m-i-t.com',
          social_tiktok: data.social_tiktok || '',
          social_instagram: data.social_instagram || '',
          social_facebook: data.social_facebook || '',
          social_youtube: data.social_youtube || '',
        };
        setSettings(safeSettings);
        setInitialSettings(safeSettings);
      }
    } catch (error: any) {
      logger.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    setSaving(true);

    try {
      await settingsApi.update(settings);
      setInitialSettings(settings);
      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      logger.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: string, value: string) {
    setSettings(prev => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure your blog settings
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
            <AlertCircle size={16} />
            <span className="font-medium">Unsaved changes</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">General</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Site Title</label>
                <span className="text-xs text-muted-foreground">
                  {(settings.site_title || '').length} characters
                </span>
              </div>
              <Input
                value={settings.site_title || ''}
                onChange={(e) => handleChange('site_title', e.target.value)}
                placeholder="Smart Travel Hacks"
                className="transition-all duration-200"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Site Description</label>
                <span className="text-xs text-muted-foreground">
                  {(settings.site_description || '').length} characters
                </span>
              </div>
              <Textarea
                value={settings.site_description || ''}
                onChange={(e) => handleChange('site_description', e.target.value)}
                placeholder="Your blog about travel guides, itineraries, and tips"
                rows={3}
                className="transition-all duration-200"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 150-160 characters for SEO
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Site URL</label>
              <div className="relative">
                <Input
                  value={settings.site_url || ''}
                  onChange={(e) => handleChange('site_url', e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                  className="transition-all duration-200"
                />
                {settings.site_url && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your production website URL (used for affiliate links, SEO, and social sharing)
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Social Media</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                TikTok
              </label>
              <div className="relative">
                <Input
                  value={settings.social_tiktok || ''}
                  onChange={(e) => handleChange('social_tiktok', e.target.value)}
                  placeholder="https://www.tiktok.com/@yourusername"
                  type="url"
                  className="transition-all duration-200"
                />
                {settings.social_tiktok && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your TikTok profile URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Instagram
              </label>
              <div className="relative">
                <Input
                  value={settings.social_instagram || ''}
                  onChange={(e) => handleChange('social_instagram', e.target.value)}
                  placeholder="https://www.instagram.com/yourusername"
                  type="url"
                  className="transition-all duration-200"
                />
                {settings.social_instagram && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your Instagram profile URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Facebook
              </label>
              <div className="relative">
                <Input
                  value={settings.social_facebook || ''}
                  onChange={(e) => handleChange('social_facebook', e.target.value)}
                  placeholder="https://www.facebook.com/yourusername"
                  type="url"
                  className="transition-all duration-200"
                />
                {settings.social_facebook && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your Facebook profile URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                YouTube
              </label>
              <div className="relative">
                <Input
                  value={settings.social_youtube || ''}
                  onChange={(e) => handleChange('social_youtube', e.target.value)}
                  placeholder="https://www.youtube.com/yourusername"
                  type="url"
                  className="transition-all duration-200"
                />
                {settings.social_youtube && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check size={16} className="text-green-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your YouTube profile URL
              </p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <div>
            {!hasChanges && !saving && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check size={16} />
                <span>All changes saved</span>
              </div>
            )}
          </div>
          <Button type="submit" disabled={saving || !hasChanges}>
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </form>
    </div>
  );
}