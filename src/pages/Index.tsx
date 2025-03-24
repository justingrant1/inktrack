
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import Header from '@/components/Header';
import TattooCard from '@/components/TattooCard';
import TattooForm from '@/components/TattooForm';
import EmptyState from '@/components/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Tattoo {
  id: string;
  title: string;
  image?: string;
  dateAdded: Date;
  artist: string;
  location: string;
  meaning: string;
  lastRefreshed?: Date;
}

const Index = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTattoo, setEditingTattoo] = useState<Tattoo | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tattoos from Supabase
  const { data: tattoos = [], isLoading } = useQuery({
    queryKey: ['tattoos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tattoos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tattoos:', error);
        toast.error('Failed to load tattoos');
        return [];
      }
      
      // Transform the data to match our Tattoo interface
      return data.map((tattoo: any) => ({
        id: tattoo.id,
        title: tattoo.title,
        image: tattoo.image,
        dateAdded: new Date(tattoo.date_added),
        artist: tattoo.artist || '',
        location: tattoo.location || '',
        meaning: tattoo.meaning || '',
        lastRefreshed: tattoo.last_refreshed ? new Date(tattoo.last_refreshed) : undefined
      }));
    },
    enabled: !!user,
  });

  // Add/update tattoo mutation
  const saveTattooMutation = useMutation({
    mutationFn: async (newTattoo: Tattoo) => {
      if (!user) throw new Error('User not authenticated');
      
      const tattooData = {
        title: newTattoo.title,
        image: newTattoo.image,
        artist: newTattoo.artist,
        location: newTattoo.location,
        meaning: newTattoo.meaning,
        user_id: user.id,
      };
      
      if (editingTattoo) {
        // Update existing tattoo
        const { error } = await supabase
          .from('tattoos')
          .update(tattooData)
          .eq('id', newTattoo.id);
        
        if (error) throw error;
        return newTattoo;
      } else {
        // Insert new tattoo
        const { data, error } = await supabase
          .from('tattoos')
          .insert(tattooData)
          .select('*')
          .single();
        
        if (error) throw error;
        return {
          ...newTattoo,
          id: data.id,
          dateAdded: new Date(data.date_added),
        };
      }
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
    saveTattooMutation.mutate(newTattoo);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onAddNew={handleAddNew} />
      
      <main className="container py-6 animate-fade-in">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : tattoos.length === 0 ? (
          <EmptyState onAddNew={handleAddNew} />
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-6">Your Tattoo Collection</h2>
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
