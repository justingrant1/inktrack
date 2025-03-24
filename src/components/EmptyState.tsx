
import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddNew: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddNew }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="glass-morphism rounded-xl p-8 max-w-md w-full text-center">
        <h3 className="text-xl font-medium mb-2">No tattoos yet</h3>
        <p className="text-muted-foreground mb-6">
          Start tracking your tattoo collection by adding your first tattoo.
        </p>
        <Button onClick={onAddNew} className="hover-scale">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Your First Tattoo
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
