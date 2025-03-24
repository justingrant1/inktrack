import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import Header from '@/components/Header';
import TattooCard from '@/components/TattooCard';
import TattooForm from '@/components/TattooForm';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { uploadTattooImage } from '@/integrations/supabase/storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { SubscriptionTier, hasReachedTattooLimit } from '@/utils/subscriptionTiers';

interface Tattoo {
  id: string;
  title: string;
  image?: string;
  dateAdded: Date;
  artist: string;
  location: string;
  meaning: string;
  lastRefreshed?: Date;
  imageFile?: File;
  isPublic: boolean;
}

const Index = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTattoo, setEditingTattoo] = useState<Tattoo | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [userTier, setUserTier] = useState<SubscriptionTier>('free');

  const { data: tattoos = [], isLoading } = useQuery({
    queryKey: ['tattoos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tattoos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tattoos:', error);
        toast.error('Failed to load tattoos');
        return [];
      }
      
      return data.map((tattoo: any) => ({
        id: tattoo.id,
        title: tattoo.title,
        image: tattoo.image,
        dateAdded: new Date(tattoo.date_added),
        artist: tattoo.artist || '',
        location: tattoo.location || '',
        meaning: tattoo.meaning || '',
        lastRefreshed: tattoo.last_refreshed ? new Date(tattoo.last_refreshed) : undefined,
        isPublic: localStorage.getItem(`tattoo_public_${tattoo.id}`) === 'true' || false
      }));
    },
    enabled: !!user,
  });

  useEffect(() => {
    const fetchUserTier = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }
      
      setUserTier('free');
      
      const storedTier = localStorage.getItem('subscription_tier');
      if (storedTier === 'premium') {
        setUserTier('premium');
      }
    };
    
    fetchUserTier();
  }, [user]);

  const saveTattooMutation = useMutation({
    mutationFn: async (newTattoo: Tattoo) => {
      if (!user) throw new Error('User not authenticated');
      
      let imageUrl = newTattoo.image;
      
      if (newTattoo.imageFile instanceof File) {
        try {
          const file = newTattoo.imageFile;
          
          const uploadedImageUrl = await uploadTattooImage(file, user.id);
          
          if (uploadedImageUrl) {
            imageUrl = uploadedImageUrl;
            console.log('Image uploaded successfully:', imageUrl);
          } else {
            console.log('Image upload failed, using fallback');
            const blobUrl = URL.createObjectURL(file);
            localStorage.setItem(`tattoo_image_${Date.now()}`, blobUrl);
            imageUrl = blobUrl;
            toast.warning('Image stored locally. It may not persist between sessions.');
          }
        } catch (error) {
          console.error('Error processing image:', error);
          toast.warning('Image could not be uploaded, but your tattoo details will still be saved.');
        }
      }
      
      const tattooData = {
        title: newTattoo.title,
        image: imageUrl,
        artist: newTattoo.artist,
        location: newTattoo.location,
        meaning: newTattoo.meaning,
        date_added: newTattoo.dateAdded.toISOString(),
        last_refreshed: newTattoo.lastRefreshed?.toISOString(),
        user_id: user.id,
      };
      
      let result;
      
      if (editingTattoo) {
        const { error } = await supabase
          .from('tattoos')
          .update(tattooData)
          .eq('id', newTattoo.id);
        
        if (error) {
          console.error('Error updating tattoo:', error);
          throw error;
        }
        
        localStorage.setItem(`tattoo_public_${newTattoo.id}`, newTattoo.isPublic.toString());
        
        result = { ...newTattoo, image: imageUrl };
      } else {
        const { data, error } = await supabase
          .from('tattoos')
          .insert(tattooData)
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting tattoo:', error);
          throw error;
        }
        
        if (!data) {
          throw new Error('No data returned from insert operation');
        }
        
        localStorage.setItem(`tattoo_public_${data.id}`, newTattoo.isPublic.toString());
        
        result = {
          ...newTattoo,
          id: data.id,
          dateAdded: new Date(data.date_added),
          image: imageUrl,
          isPublic: newTattoo.isPublic
        };
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tattoos', user?.id] });
      setEditingTattoo(null);
      setIsFormOpen(false);
      toast.success(editingTattoo ? "Tattoo updated successfully!" : "New tattoo added!");
    },
    onError: (error) => {
      console.error('Error saving tattoo:', error);
      toast.error('Failed to save tattoo. Please try again.');
    },
  });

  const handleAddNew = () => {
    if (hasReachedTattooLimit(userTier, tattoos.length) && !editingTattoo) {
      toast.error('You have reached your tattoo limit. Upgrade to premium for unlimited tattoos.');
      return;
    }
    
    setEditingTattoo(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    const tattoo = tattoos.find(t => t.id === id);
    if (tattoo) {
      setEditingTattoo(tattoo);
      setIsFormOpen(true);
    }
  };

  const handleSaveTattoo = (newTattoo: Tattoo) => {
    if (!editingTattoo && hasReachedTattooLimit(userTier, tattoos.length)) {
      toast.error('You have reached your tattoo limit. Upgrade to premium for unlimited tattoos.');
      return;
    }
    
    saveTattooMutation.mutate(newTattoo);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onAddNew={handleAddNew} />
      
      <main className="container py-6 animate-fade-in">
        <SubscriptionBanner 
          tattooCount={tattoos.length} 
          userTier={userTier} 
        />
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : tattoos.length === 0 ? (
          <EmptyState onAddNew={handleAddNew} />
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Your Tattoo Collection</h2>
              {userTier === 'premium' && (
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Premium Member
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tattoos.map((tattoo) => (
                <TattooCard 
                  key={tattoo.id} 
                  tattoo={tattoo} 
                  onEdit={handleEdit} 
                />
              ))}
            </div>
          </>
        )}
      </main>
      
      <TattooForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSave={handleSaveTattoo}
        editingTattoo={editingTattoo}
      />
    </div>
  );
};

export default Index;
