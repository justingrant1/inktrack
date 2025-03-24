
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CommentFormProps {
  tattooId: string;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ tattooId, onSubmit, isLoading }) => {
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment);
      setComment('');
    }
  };

  if (!user) {
    return (
      <div className="p-3 bg-slate-50 rounded-md text-center text-sm text-muted-foreground">
        Sign in to leave a comment
      </div>
    );
  }

  // Get the user's initials for the avatar fallback
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'U';
  // We don't have avatar_url on the User type, so we'll use email as a key for avatar
  const avatarUrl = user.email ? `https://ui-avatars.com/api/?name=${userInitial}&background=random` : undefined;

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt="Your avatar" />
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end mt-2">
            <Button 
              type="submit" 
              disabled={!comment.trim() || isLoading}
              size="sm"
            >
              {isLoading ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;
