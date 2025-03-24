
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Heart, MessageSquare, Calendar, User } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Comment from './Comment';
import CommentForm from './CommentForm';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  
  // Fetch likes count
  const { data: likesData } = useQuery({
    queryKey: ['tattoo-likes', tattoo.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tattoo_likes')
        .select('*', { count: 'exact' })
        .eq('tattoo_id', tattoo.id);
        
      if (error) throw error;
      
      // Check if current user has liked this tattoo
      if (user) {
        const userLiked = data.some(like => like.user_id === user.id);
        setLiked(userLiked);
      }
      
      return {
        count: data.length,
        userHasLiked: user ? data.some(like => like.user_id === user.id) : false
      };
    }
  });
  
  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['tattoo-comments', tattoo.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tattoo_comments')
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .eq('tattoo_id', tattoo.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      return data.map((comment: any) => ({
        ...comment,
        username: comment.profiles?.username,
        avatar_url: comment.profiles?.avatar_url
      }));
    }
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('tattoo_comments')
        .insert({
          tattoo_id: tattoo.id,
          user_id: user.id,
          text
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tattoo-comments', tattoo.id] });
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    }
  });
  
  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('tattoo_likes')
          .delete()
          .eq('tattoo_id', tattoo.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('tattoo_likes')
          .insert({
            tattoo_id: tattoo.id,
            user_id: user.id
          });
          
        if (error) throw error;
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
  
  const handleToggleLike = () => {
    if (!user) {
      toast.error('Please sign in to like tattoos');
      return;
    }
    
    toggleLikeMutation.mutate();
  };
  
  const handleAddComment = (text: string) => {
    addCommentMutation.mutate(text);
  };

  return (
    <Card className="tattoo-card animate-fade-in">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={tattoo.avatar_url} />
            <AvatarFallback>
              {(tattoo.username || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{tattoo.username || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">{format(tattoo.dateAdded, 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="mb-3">
          <h3 className="font-semibold text-lg">{tattoo.title}</h3>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{tattoo.location}</Badge>
            <Badge variant="secondary">Artist: {tattoo.artist}</Badge>
          </div>
        </div>
        
        {tattoo.image && (
          <div className="mb-3 rounded-md overflow-hidden subtle-border">
            <AspectRatio ratio={4/3}>
              <img 
                src={tattoo.image} 
                alt={tattoo.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </AspectRatio>
          </div>
        )}
        
        {tattoo.meaning && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p>{tattoo.meaning}</p>
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
                {comments.map(comment => (
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
