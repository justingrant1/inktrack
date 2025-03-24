
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Heart, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Comment from './Comment';
import CommentForm from './CommentForm';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Since we can't modify Supabase schema, let's simulate comments and likes in local storage
const getStoredComments = (tattooId: string) => {
  const stored = localStorage.getItem(`tattoo_comments_${tattooId}`);
  return stored ? JSON.parse(stored) : [];
};

const getStoredLikes = (tattooId: string) => {
  const stored = localStorage.getItem(`tattoo_likes_${tattooId}`);
  return stored ? JSON.parse(stored) : [];
};

interface PublicTattooCardProps {
  tattoo: {
    id: string;
    title: string;
    image?: string;
    dateAdded: Date;
    artist: string;
    location: string;
    meaning: string;
    user_id: string;
    username?: string;
    avatar_url?: string;
  };
}

const PublicTattooCard = ({ tattoo }: PublicTattooCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  
  // Ensure default values for required fields
  const safeTitle = tattoo.title || 'Untitled Tattoo';
  const safeArtist = tattoo.artist || 'Unknown Artist';
  const safeLocation = tattoo.location || 'Unknown Location';
  const safeMeaning = tattoo.meaning || '';
  
  // Use a default date if dateAdded is invalid
  let displayDate = new Date();
  try {
    displayDate = tattoo.dateAdded instanceof Date && !isNaN(tattoo.dateAdded.getTime()) 
      ? tattoo.dateAdded 
      : new Date();
  } catch (error) {
    console.error('Invalid date for tattoo:', tattoo.id);
  }
  
  // Simulate fetching likes using local storage
  const { data: likesData } = useQuery({
    queryKey: ['tattoo-likes', tattoo.id],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const likes = getStoredLikes(tattoo.id);
      
      // Check if current user has liked this tattoo
      if (user) {
        const userLiked = likes.some((like: any) => like.user_id === user.id);
        setLiked(userLiked);
      }
      
      return {
        count: likes.length,
        userHasLiked: user ? likes.some((like: any) => like.user_id === user.id) : false
      };
    },
    staleTime: 0 // Don't cache results
  });
  
  // Simulate fetching comments using local storage
  const { data: comments = [] } = useQuery({
    queryKey: ['tattoo-comments', tattoo.id],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return getStoredComments(tattoo.id);
    },
    staleTime: 0 // Don't cache results
  });
  
  // Add comment mutation using local storage
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newComment = {
        id: `comment_${Date.now()}`,
        tattoo_id: tattoo.id,
        user_id: user.id,
        text,
        created_at: new Date().toISOString(),
        username: user.email?.split('@')[0], // Use email prefix as username
        avatar_url: `https://ui-avatars.com/api/?name=${user.email?.charAt(0) || 'U'}&background=random`
      };
      
      // Get existing comments and add the new one
      const existingComments = getStoredComments(tattoo.id);
      const updatedComments = [...existingComments, newComment];
      
      // Save to local storage
      localStorage.setItem(`tattoo_comments_${tattoo.id}`, JSON.stringify(updatedComments));
      
      return newComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tattoo-comments', tattoo.id] });
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    }
  });
  
  // Toggle like mutation using local storage
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const likes = getStoredLikes(tattoo.id);
      
      if (liked) {
        // Unlike
        const updatedLikes = likes.filter((like: any) => like.user_id !== user.id);
        localStorage.setItem(`tattoo_likes_${tattoo.id}`, JSON.stringify(updatedLikes));
      } else {
        // Like
        const newLike = {
          id: `like_${Date.now()}`,
          tattoo_id: tattoo.id,
          user_id: user.id,
          created_at: new Date().toISOString()
        };
        localStorage.setItem(`tattoo_likes_${tattoo.id}`, JSON.stringify([...likes, newLike]));
      }
      
      return { liked: !liked };
    },
    onSuccess: (data) => {
      setLiked(data.liked);
      queryClient.invalidateQueries({ queryKey: ['tattoo-likes', tattoo.id] });
    },
    onError: () => {
      toast.error('Failed to update like');
    }
  });
  
  // Initialize likes and comments for this tattoo if they don't exist yet
  useEffect(() => {
    if (!localStorage.getItem(`tattoo_likes_${tattoo.id}`)) {
      localStorage.setItem(`tattoo_likes_${tattoo.id}`, JSON.stringify([]));
    }
    if (!localStorage.getItem(`tattoo_comments_${tattoo.id}`)) {
      localStorage.setItem(`tattoo_comments_${tattoo.id}`, JSON.stringify([]));
    }
  }, [tattoo.id]);
  
  const handleToggleLike = () => {
    if (!user) {
      toast.error('Please sign in to like tattoos');
      return;
    }
    
    toggleLikeMutation.mutate();
  };
  
  const handleAddComment = (text: string) => {
    if (!user) {
      toast.error('Please sign in to add comments');
      return;
    }
    
    addCommentMutation.mutate(text);
  };

  // Get avatar URL or fallback
  const avatarUrl = tattoo.avatar_url || `https://ui-avatars.com/api/?name=${tattoo.username?.charAt(0) || 'U'}&background=random`;
  const displayName = tattoo.username || 'Anonymous';

  return (
    <Card className="tattoo-card animate-fade-in">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground">{format(displayDate, 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="mb-3">
          <h3 className="font-semibold text-lg">{safeTitle}</h3>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{safeLocation}</Badge>
            <Badge variant="secondary">Artist: {safeArtist}</Badge>
          </div>
        </div>
        
        {tattoo.image && (
          <div className="mb-3 rounded-md overflow-hidden subtle-border">
            <AspectRatio ratio={4/3}>
              <img 
                src={tattoo.image} 
                alt={safeTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </AspectRatio>
          </div>
        )}
        
        {safeMeaning && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p>{safeMeaning}</p>
          </div>
        )}
        
        <div className="flex items-center gap-4 mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-2 ${liked ? 'text-red-500' : ''}`}
            onClick={handleToggleLike}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            {likesData?.count || 0}
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="comments" className="border-none">
            <AccordionTrigger className="py-2 text-sm">
              {comments.length > 0 ? 'View comments' : 'Add a comment'}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {comments.map((comment: any) => (
                  <Comment key={comment.id} comment={comment} />
                ))}
                
                <CommentForm 
                  tattooId={tattoo.id}
                  onSubmit={handleAddComment}
                  isLoading={addCommentMutation.isPending}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardFooter>
    </Card>
  );
};

export default PublicTattooCard;
