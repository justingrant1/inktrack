
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PublicTattooCard from './PublicTattooCard';
import EmptyGalleryState from './EmptyGalleryState';

interface TattooGridProps {
  tattoos: any[];
  isLoading: boolean;
  isInitialLoading: boolean;
  publicTattooCount: number;
  onRefresh: () => void;
}

const TattooGrid = ({ 
  tattoos, 
  isLoading, 
  isInitialLoading, 
  publicTattooCount, 
  onRefresh 
}: TattooGridProps) => {
  if (isLoading || isInitialLoading) {
    return (
      <>
        {Array(6).fill(0).map((_, index) => (
          <div key={`skeleton-${index}`} className="animate-pulse">
            <div className="tattoo-card">
              <div className="p-4 pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
              <div className="p-4 pt-2">
                <Skeleton className="h-5 w-32 mb-2" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-44 w-full mb-3" />
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-4 mt-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }
  
  if (tattoos.length === 0) {
    return <EmptyGalleryState publicTattooCount={publicTattooCount} onRefresh={onRefresh} />;
  }
  
  return (
    <>
      {tattoos.map((tattoo) => (
        <PublicTattooCard key={tattoo.id} tattoo={tattoo} />
      ))}
    </>
  );
};

export default TattooGrid;
