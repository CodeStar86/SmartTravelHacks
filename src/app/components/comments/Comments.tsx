import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { MessageSquare } from 'lucide-react';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';

import { logger } from '../../lib/logger';
interface CommentsProps {
  postId: string;
}

export function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    setError('');
    try {
      const { commentApi } = await import('../../lib/api');
      const response = await commentApi.getForPost(postId);
      setComments(response.comments || []);
    } catch (err: any) {
      logger.error('Failed to load comments:', err);
      setError(err.message || 'Failed to load comments');
    }
  }

  return (
    <div className="space-y-8">
      {/* Comments Header */}
      <div className="border-t pt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare size={28} />
            Comments
            {!error && comments.length > 0 && (
              <span className="text-xl text-gray-500">({comments.length})</span>
            )}
          </h2>
        </div>
      </div>

      {/* Comment Form */}
      <CommentForm postId={postId} onSuccess={loadComments} />

      {/* Existing Comments */}
      <div>
        <Separator className="mb-8" />
        <h3 className="text-2xl font-bold mb-6">
          {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'No Comments Yet'}
        </h3>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <CommentList postId={postId} comments={comments} onReload={loadComments} />
        )}
      </div>
    </div>
  );
}