import { useState } from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { User, Reply, Globe, MessageSquare } from 'lucide-react';
import { CommentForm } from './CommentForm';

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  author_website?: string | null;
  content: string;
  status: string;
  created_at: string;
}

interface CommentListProps {
  postId: string;
  comments: Comment[];
  onReload?: () => void;
}

export function CommentList({ postId, comments, onReload }: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Build nested comment structure
  const commentTree = buildCommentTree(comments);

  function buildCommentTree(flatComments: Comment[]) {
    const tree: Comment[] = [];
    const childrenMap = new Map<string, Comment[]>();

    // Group comments by parent
    flatComments.forEach(comment => {
      if (comment.parent_id) {
        if (!childrenMap.has(comment.parent_id)) {
          childrenMap.set(comment.parent_id, []);
        }
        childrenMap.get(comment.parent_id)!.push(comment);
      } else {
        tree.push(comment);
      }
    });

    // Sort by date (oldest first for natural reading flow)
    tree.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    childrenMap.forEach(children => {
      children.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return { tree, childrenMap };
  }

  function handleReplySuccess() {
    setReplyingTo(null);
    onReload?.();
  }

  function renderComment(comment: Comment, depth = 0) {
    const { childrenMap } = commentTree;
    const children = childrenMap.get(comment.id) || [];
    const initials = comment.author_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? 'ml-8 md:ml-12 mt-4 border-l-2 border-gray-200 pl-4' : ''}`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
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
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-gray-600 hover:text-gray-900 h-auto py-1 px-2"
              >
                <Reply size={14} className="mr-1" />
                Reply
              </Button>
            </div>

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-4">
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  onSuccess={handleReplySuccess}
                  onCancel={() => setReplyingTo(null)}
                />
              </div>
            )}

            {/* Nested replies */}
            {children.length > 0 && (
              <div className="mt-4 space-y-4">
                {children.map(child => renderComment(child, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-semibold">No comments yet</p>
        <p className="text-sm">Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {commentTree.tree.map(comment => renderComment(comment))}
    </div>
  );
}