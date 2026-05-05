import { SEOMetadata, Post, SEOScore } from '../../types';
import { calculateSEOScore } from '../../lib/seo-utils';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SEOPanelProps {
  post: Partial<Post>;
  seo: SEOMetadata;
  onChange: (seo: SEOMetadata) => void;
}

export function SEOPanel({ post, seo, onChange }: SEOPanelProps) {
  const score = calculateSEOScore(post);

  return (
    <div className="space-y-6">
      {/* SEO Score */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">SEO Score</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl font-bold">
            {score.score}
            <span className="text-lg text-gray-500">/100</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(score.score)}`}>
            {score.score >= 80 ? 'Excellent' : score.score >= 60 ? 'Good' : score.score >= 40 ? 'Fair' : 'Needs Work'}
          </div>
        </div>

        <div className="space-y-2">
          <SEOCheckItem
            label="Keyword in title"
            passed={score.checks.keyword_in_title}
          />
          <SEOCheckItem
            label="Keyword in first 100 words"
            passed={score.checks.keyword_in_first_100}
          />
          <SEOCheckItem
            label="Uses H2/H3 headings"
            passed={score.checks.has_headings}
          />
          <SEOCheckItem
            label="Includes internal links"
            passed={score.checks.has_internal_links}
          />
          <SEOCheckItem
            label="Includes external link"
            passed={score.checks.has_external_links}
          />
          <SEOCheckItem
            label="Images have alt text"
            passed={score.checks.has_images_with_alt}
          />
          <SEOCheckItem
            label="Meets length target (1500+ words)"
            passed={score.checks.meets_length_target}
          />
        </div>
      </Card>

      {/* Focus Keyword */}
      <div>
        <Label htmlFor="focus_keyword">Focus Keyword</Label>
        <Input
          id="focus_keyword"
          value={seo.focus_keyword || ''}
          onChange={(e) => onChange({ ...seo, focus_keyword: e.target.value })}
          placeholder="e.g., Rome travel guide"
        />
        <p className="text-sm text-gray-500 mt-1">
          Main keyword you want to rank for
        </p>
      </div>

      {/* Meta Title */}
      <div>
        <Label htmlFor="meta_title">Meta Title</Label>
        <Input
          id="meta_title"
          value={seo.meta_title || ''}
          onChange={(e) => onChange({ ...seo, meta_title: e.target.value })}
          placeholder={post.title || 'Leave blank to use post title'}
          maxLength={60}
        />
        <p className="text-sm text-gray-500 mt-1">
          {(seo.meta_title || post.title || '').length}/60 characters
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <Label htmlFor="meta_description">Meta Description</Label>
        <Textarea
          id="meta_description"
          value={seo.meta_description || ''}
          onChange={(e) => onChange({ ...seo, meta_description: e.target.value })}
          placeholder="Brief description for search results..."
          maxLength={160}
          rows={3}
        />
        <p className="text-sm text-gray-500 mt-1">
          {(seo.meta_description || '').length}/160 characters
        </p>
      </div>

      {/* Google Search Preview */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold mb-3">Google Search Preview</h4>
        <div className="space-y-1">
          <div className="text-blue-600 text-lg">
            {seo.meta_title || post.title || 'Your Post Title'}
          </div>
          <div className="text-green-700 text-sm">
            yoursite.com/blog/{post.slug || 'post-slug'}
          </div>
          <div className="text-sm text-gray-600">
            {seo.meta_description || post.excerpt || 'Your post description will appear here...'}
          </div>
        </div>
      </Card>

      {/* Open Graph */}
      <div className="space-y-4">
        <h4 className="font-semibold">Open Graph (Social Media)</h4>
        
        <div>
          <Label htmlFor="og_title">OG Title</Label>
          <Input
            id="og_title"
            value={seo.og_title || ''}
            onChange={(e) => onChange({ ...seo, og_title: e.target.value })}
            placeholder="Leave blank to use meta title"
          />
        </div>

        <div>
          <Label htmlFor="og_description">OG Description</Label>
          <Textarea
            id="og_description"
            value={seo.og_description || ''}
            onChange={(e) => onChange({ ...seo, og_description: e.target.value })}
            placeholder="Leave blank to use meta description"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="og_image">OG Image URL</Label>
          <Input
            id="og_image"
            value={seo.og_image || ''}
            onChange={(e) => onChange({ ...seo, og_image: e.target.value })}
            placeholder="Leave blank to use featured image"
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h4 className="font-semibold">Advanced Settings</h4>

        <div className="flex items-center justify-between">
          <Label htmlFor="robots_index">Allow search engines to index</Label>
          <Switch
            id="robots_index"
            checked={seo.robots_index !== false}
            onCheckedChange={(checked) => onChange({ ...seo, robots_index: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="robots_follow">Allow search engines to follow links</Label>
          <Switch
            id="robots_follow"
            checked={seo.robots_follow !== false}
            onCheckedChange={(checked) => onChange({ ...seo, robots_follow: checked })}
          />
        </div>

        <div>
          <Label htmlFor="canonical_url">Canonical URL (optional)</Label>
          <Input
            id="canonical_url"
            value={seo.canonical_url || ''}
            onChange={(e) => onChange({ ...seo, canonical_url: e.target.value })}
            placeholder="https://example.com/original-article"
          />
          <p className="text-sm text-gray-500 mt-1">
            Only set if this is a republished article
          </p>
        </div>
      </div>
    </div>
  );
}

function SEOCheckItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle size={16} className="text-green-600" />
      ) : (
        <XCircle size={16} className="text-red-500" />
      )}
      <span className={passed ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-blue-100 text-blue-800';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}
