
import React from 'react';
import { toast } from 'sonner';

interface EmptyGalleryStateProps {
  publicTattooCount: number;
  onRefresh: () => void;
}

const EmptyGalleryState = ({ publicTattooCount, onRefresh }: EmptyGalleryStateProps) => {
  return (
    <div className="col-span-full">
      <div className="text-center py-12 px-4">
        <h3 className="text-xl font-semibold mb-2">No public tattoos yet</h3>
        <p className="text-muted-foreground">
          {publicTattooCount > 0 
            ? `Found ${publicTattooCount} public tattoos in localStorage, but none could be displayed. Please check the console for more information.`
            : 'Be the first to share your tattoo with the community!'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            onClick={onRefresh}
          >
            Refresh Gallery
          </button>
          <button 
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            onClick={() => {
              toast.info('Checking for public tattoos...');
              onRefresh();
            }}
          >
            Debug Public Tattoos
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyGalleryState;
