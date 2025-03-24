
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface CommentProps {
  comment: {
    id: string;
    text: string;
    user_id: string;
    created_at: string;
    username?: string;
    avatar_url?: string;
  };
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const { user } = useAuth();
  const isCurrentUser = user?.id === comment.user_id;

  return (
    <Card className={`mb-3 ${isCurrentUser ? 'border-blue-200' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.avatar_url} alt={comment.username || 'User'} />
            <AvatarFallback>
              {(comment.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-medium text-sm">
                {comment.username || 'Anonymous User'}
                {isCurrentUser && <span className="text-xs ml-2 text-muted-foreground">(You)</span>}
              </p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm mt-1">{comment.text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Comment;
