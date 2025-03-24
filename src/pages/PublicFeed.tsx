import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/Header';
import TattooGrid from '@/components/TattooGrid';
import LoadingIndicator from '@/components/LoadingIndicator';
import DebugInfo from '@/components/DebugInfo';
import LoadMoreIndicator from '@/components/LoadMoreIndicator';
import { fetchPublicTattoos } from '@/utils/publicTattooUtils';

const PublicFeed = () => {
  const [searchParams] = useSearchParams();
  const [publicTattooCount, setPublicTattooCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const pageSize = 9; // Show more items per page
  
  const { ref: loadMoreRef, inView } = useInView();
  
  const [debugInfo, setDebugInfo] = useState<{ message: string; type: 'info' | 'error' | 'success' }>({
    message: 'Initializing...',
    type: 'info'
  });
  
  // Direct state management for tattoos
  const [allTattoos, setAllTattoos] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Function to fetch public tattoos
  const fetchTattooData = async (pageNumber: number = 1) => {
    if (isQueryLoading) return { tattoos: [], totalCount: 0, totalPages: 0 };
    
    setIsQueryLoading(true);
    try {
      console.log(`Fetching public tattoos for page ${pageNumber}`);
      const result = await fetchPublicTattoos(pageNumber, pageSize);
      
      if (pageNumber === 1) {
        // First page, replace all data
        setAllTattoos(result.tattoos);
      } else {
        // Subsequent pages, append data
        setAllTattoos(prev => [...prev, ...result.tattoos]);
      }
      
      // Update counts
      setTotalCount(result.totalCount);
      setPublicTattooCount(result.totalCount);
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
  
  // Refetch first page
  const refetch = async () => {
    return await fetchTattooData(1);
  };
  
  // Fetch next page
  const fetchNextPage = async () => {
    if (hasMore && !isQueryLoading) {
      const currentPage = Math.ceil(allTattoos.length / pageSize) + 1;
      await fetchTattooData(currentPage);
    }
  };

  // One-time initialization
  useEffect(() => {
    if (isInitialized) return;
    
    // Initialize with a single load
    setIsInitialized(true);
    setIsLoading(true);
    
    // Start the loading bar animation
    const loadingTimer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(loadingTimer);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    // Fetch data just once on mount
    fetchTattooData(1).then(result => {
      // Update tattoo count
      setPublicTattooCount(result.totalCount);
      
      // Complete loading after a brief delay
      setTimeout(() => {
        setIsLoading(false);
        setDebugInfo({
          message: result.totalCount > 0 
            ? `Found ${result.totalCount} public tattoos` 
            : 'No public tattoos found. Try making some tattoos public!',
          type: result.totalCount > 0 ? 'success' : 'info'
        });
        
        clearInterval(loadingTimer);
        setLoadingProgress(100);
      }, 1000);
    });
    
    return () => {
      clearInterval(loadingTimer);
    };
  }, [isInitialized]);
  
  // Infinite scrolling
  useEffect(() => {
    if (inView && hasMore && !isQueryLoading && !isLoading) {
      fetchNextPage();
    }
  }, [inView, hasMore, isQueryLoading, isLoading]);
  
  // Handle gallery refresh
  const handleRefreshGallery = async () => {
    setDebugInfo({ message: "Refreshing gallery...", type: 'info' });
    setIsLoading(true);
    
    const result = await refetch();
    
    setIsLoading(false);
    setDebugInfo({
      message: result.totalCount > 0
        ? `Found ${result.totalCount} public tattoos`
        : 'No public tattoos found. Try making some tattoos public!',
      type: result.totalCount > 0 ? 'success' : 'info'
    });
    
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
                onClick={handleRefreshGallery}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                disabled={isLoading || isQueryLoading}
              >
                Refresh Gallery
              </button>
            </div>
          </div>
          
          <DebugInfo message={debugInfo.message} type={debugInfo.type} />
          
          {(isLoading) && (
            <LoadingIndicator 
              progress={loadingProgress} 
              message="Loading public tattoos..." 
            />
          )}
          
          {!isLoading && (
            <ScrollArea className="h-[calc(100vh-200px)] rounded-lg pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <TattooGrid 
                  tattoos={allTattoos}
                  isLoading={false}
                  isInitialLoading={false}
                  publicTattooCount={publicTattooCount}
                  onRefresh={handleRefreshGallery}
                />
              </div>
              
              {isQueryLoading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
              
              <LoadMoreIndicator 
                hasNextPage={hasMore}
                isFetchingNextPage={isQueryLoading}
                loadMoreRef={loadMoreRef}
                allTattoosLength={allTattoos.length}
              />
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicFeed;
