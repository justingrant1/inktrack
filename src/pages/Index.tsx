
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import Header from '@/components/Header';
import TattooCard from '@/components/TattooCard';
import TattooForm from '@/components/TattooForm';
import EmptyState from '@/components/EmptyState';

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

// Sample tattoo data for demonstration
const sampleTattoos: Tattoo[] = [
  {
    id: '1',
    title: 'Phoenix Rising',
    image: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=2500&auto=format&fit=crop',
    dateAdded: new Date('2022-04-15'),
    artist: 'Jane Smith',
    location: 'Left Shoulder',
    meaning: 'Represents personal transformation and rebirth after a difficult period.',
    lastRefreshed: new Date('2023-05-20')
  },
  {
    id: '2',
    title: 'Geometric Wolf',
    image: 'https://images.unsplash.com/photo-1527155781227-075e7d42cea0?q=80&w=2500&auto=format&fit=crop',
    dateAdded: new Date('2021-10-08'),
    artist: 'Mike Rodriguez',
    location: 'Right Forearm',
    meaning: 'Symbolizes the balance between human civilization and wild nature.',
  }
];

const Index = () => {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTattoo, setEditingTattoo] = useState<Tattoo | null>(null);

  // Load tattoos from localStorage on initial render
  useEffect(() => {
    const savedTattoos = localStorage.getItem('tattoos');
    if (savedTattoos) {
      try {
        const parsedTattoos = JSON.parse(savedTattoos);
        // Convert string dates back to Date objects
        const formattedTattoos = parsedTattoos.map((tattoo: any) => ({
          ...tattoo,
          dateAdded: new Date(tattoo.dateAdded),
          lastRefreshed: tattoo.lastRefreshed ? new Date(tattoo.lastRefreshed) : undefined
        }));
        setTattoos(formattedTattoos);
      } catch (error) {
        console.error('Error parsing tattoos from localStorage:', error);
        // If there's an error parsing, use sample data
        setTattoos(sampleTattoos);
      }
    } else {
      // If no saved tattoos, use sample data
      setTattoos(sampleTattoos);
    }
  }, []);

  // Save tattoos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tattoos', JSON.stringify(tattoos));
  }, [tattoos]);

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
    if (editingTattoo) {
      // Updating existing tattoo
      setTattoos(tattoos.map(t => t.id === newTattoo.id ? newTattoo : t));
      toast.success("Tattoo updated successfully!");
    } else {
      // Adding new tattoo
      setTattoos([newTattoo, ...tattoos]);
      toast.success("New tattoo added!");
    }
    setEditingTattoo(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header onAddNew={handleAddNew} />
      
      <main className="container py-6 animate-fade-in">
        {tattoos.length === 0 ? (
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
