import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { MessageSquare, Loader2 } from 'lucide-react';

import { logger } from '../../lib/logger';
interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Legacy key used by older builds. Remove it so shared devices do not prefill
// someone else's name/email into the public comment form.
const LEGACY_COMMENTER_STORAGE_KEY = 'ai_summit_commenter_details';

export function CommentForm({ postId, parentId, onSuccess, onCancel }: CommentFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Never reuse locally saved commenter credentials. This keeps each visitor
    // responsible for entering their own details, especially on shared devices.
    try {
      localStorage.removeItem(LEGACY_COMMENTER_STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to clear legacy commenter details:', error);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedWebsite = website.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || !trimmedEmail || !trimmedContent) {
      setError('Please enter your own name, email, and comment.');
      setLoading(false);
      return;
    }

    try {
      const { commentApi } = await import('../../lib/api');
      await commentApi.create({
        post_id: postId,
        parent_id: parentId,
        author_name: trimmedName,
        author_email: trimmedEmail,
        author_website: trimmedWebsite || undefined,
        content: trimmedContent,
      });

      setSuccess(true);
      setName('');
      setEmail('');
      setWebsite('');
      setContent('');

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit comment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare size={20} />
        {parentId ? 'Reply to Comment' : 'Leave a Comment'}
      </h3>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded mb-4">
          <p className="font-semibold">Thank you for your comment!</p>
          <p className="text-sm">Your comment has been submitted for moderation and will appear after approval.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="commenter-name">Name *</Label>
            <Input
              id="commenter-name"
              name="commenter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="commenter-email">Email *</Label>
            <Input
              id="commenter-email"
              name="commenter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              disabled={loading}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">Your email will not be published or saved on this device</p>
          </div>
        </div>

        <div>
          <Label htmlFor="commenter-website">Website (optional)</Label>
          <Input
            id="commenter-website"
            name="commenter-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourwebsite.com"
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="comment-content">Comment *</Label>
          <Textarea
            id="comment-content"
            name="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder={parentId ? 'Write your reply...' : 'Share your thoughts...'}
            rows={parentId ? 4 : 5}
            disabled={loading}
            className="resize-none"
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              parentId ? 'Post Reply' : 'Submit Comment'
            )}
          </Button>

          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
