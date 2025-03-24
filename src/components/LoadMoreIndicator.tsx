
import React from 'react';

interface LoadMoreIndicatorProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  loadMoreRef: (node?: Element | null) => void;
  allTattoosLength: number;
}

const LoadMoreIndicator = ({ 
  hasNextPage, 
  isFetchingNextPage, 
  loadMoreRef,
  allTattoosLength
}: LoadMoreIndicatorProps) => {
  if (hasNextPage) {
    return (
      <div 
        ref={loadMoreRef} 
        className="py-8 flex justify-center"
      >
        {isFetchingNextPage ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading more...</p>
          </div>
        ) : (
          <div className="h-8"></div>
        )}
      </div>
    );
  }
  
  if (allTattoosLength > 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        You've reached the end of the gallery
      </div>
    );
  }
  
  return null;
};

export default LoadMoreIndicator;
