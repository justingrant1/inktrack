
import React, { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/Header';
import TattooGrid from '@/components/TattooGrid';
import LoadingIndicator from '@/components/LoadingIndicator';
import DebugInfo from '@/components/DebugInfo';
import LoadMoreIndicator from '@/components/LoadMoreIndicator';
import { checkLocalStorageForPublicTattoos, fetchPublicTattoos } from '@/utils/publicTattooUtils';

const PublicFeed = () => {
  const [searchParams] = useSearchParams();
  const [publicTattooCount, setPublicTattooCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 9; // Show more items per page
  
  const { ref: loadMoreRef, inView } = useInView();
  
  const [debugInfo, setDebugInfo] = useState<{ message: string; type: 'info' | 'error' | 'success' }>({
    message: 'Initializing...',
    type: 'info'
  });
  
  // Use state instead of React Query to avoid authentication issues
  const [allTattoos, setAllTattoos] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isQueryLoading, setIsQueryLoading] = useState(true);
  
  // Function to fetch public tattoos
  const fetchTattooData = async (pageNumber: number = 1) => {
    setIsQueryLoading(true);
    try {
      console.log(`Manually fetching public tattoos for page ${pageNumber}`);
      const result = await fetchPublicTattoos(pageNumber, pageSize);
      
      if (pageNumber === 1) {
        // First page, replace all data
        setAllTattoos(result.tattoos);
      } else {
        // Subsequent pages, append data
        setAllTattoos(prev => [...prev, ...result.tattoos]);
      }
      
      setTotalCount(result.totalCount);
      setHasMore(pageNumber < result.totalPages);
      setPageCount(result.totalPages);
      return result;
    } catch (error) {
      console.error("Error fetching public tattoos:", error);
      return { tattoos: [], totalCount: 0, totalPages: 0 };
    } finally {
      setIsQueryLoading(false);
    }
  };
  
  // Replacement for refetch function
  const refetch = async () => {
    await fetchTattooData(1);
  };
  
  // Replacement for fetchNextPage
  const fetchNextPage = async () => {
    if (hasMore) {
      const currentPage = Math.ceil(allTattoos.length / pageSize) + 1;
      await fetchTattooData(currentPage);
    }
  };
  
  // Initial setup - once the query is ready
  useEffect(() => {
    // Initialize public status for all tattoos and check for public ones
    if (refetch) {
      checkLocalStorageForPublicTattoos(setPublicTattooCount, refetch, setDebugInfo, false);
      console.log('PublicFeed component mounted, triggering initial load');
    }
  }, [refetch]);
  
  // Simulate loading progress
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    return () => clearInterval(timer);
  }, []);
  
  // Set loading state when we start and load the data
  useEffect(() => {
    setIsLoading(true);
    
    // Initialize and check for public tattoos
    checkLocalStorageForPublicTattoos(setPublicTattooCount, refetch, setDebugInfo, false);
    
    // Initial data load
    fetchTattooData(1).then(() => {
      setTimeout(() => {
        setIsLoading(false);
        setDebugInfo({
          message: publicTattooCount > 0 
            ? `Found ${publicTattooCount} public tattoos` 
            : 'No public tattoos found. Try making some tattoos public!',
          type: publicTattooCount > 0 ? 'success' : 'info'
        });
      }, 1500);
    });
    
    return () => {};
  }, []);
  
  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !isQueryLoading) {
      fetchNextPage();
    }
  }, [inView, hasMore, isQueryLoading]);
  
  console.log('All tattoos to display:', allTattoos.length, allTattoos);

  const handleRefreshGallery = async () => {
    setDebugInfo({ message: "Refreshing gallery...", type: 'info' });
    await checkLocalStorageForPublicTattoos(setPublicTattooCount, refetch, setDebugInfo, true);
    toast.success("Gallery refreshed");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container py-6 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gradient-primary">Public Tattoo Gallery</h1>
              <p className="text-muted-foreground mb-4 md:mb-0">
                Discover amazing tattoos shared by our community
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <button
                onClick={() => {
                  handleRefreshGallery();
                  setDebugInfo({ message: "Gallery refreshed", type: 'success' });
                  toast.success("Gallery refreshed");
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Gallery
              </button>
            </div>
          </div>
          
          <DebugInfo message={debugInfo.message} type={debugInfo.type} />
          
          {(isLoading || isQueryLoading) && (
            <LoadingIndicator 
              progress={loadingProgress} 
              message="Loading public tattoos..." 
            />
          )}
          
          <ScrollArea className="h-[calc(100vh-200px)] rounded-lg pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <TattooGrid 
                tattoos={allTattoos}
                isLoading={isLoading || isQueryLoading}
                isInitialLoading={isLoading}
                publicTattooCount={publicTattooCount}
                onRefresh={handleRefreshGallery}
              />
            </div>
            
            <LoadMoreIndicator 
              hasNextPage={hasMore}
              isFetchingNextPage={isQueryLoading && allTattoos.length > 0}
              loadMoreRef={loadMoreRef}
              allTattoosLength={allTattoos.length}
            />
          </ScrollArea>
        </div>
      </main>
    </div>
  );
};

export default PublicFeed;
