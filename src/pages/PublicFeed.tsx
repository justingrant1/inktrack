
import React, { useRef, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import PublicTattooCard from '@/components/PublicTattooCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { toast } from 'sonner';

const fetchPublicTattoos = async (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  console.log(`Fetching public tattoos: page ${page}, range ${from}-${to}`);
  
  try {
    // Find all public tattoo keys in localStorage to determine which tattoos are public
    const keys = Object.keys(localStorage);
    const publicTattooIds = keys
      .filter(key => key.startsWith('tattoo_public_') && localStorage.getItem(key) === 'true')
      .map(key => key.replace('tattoo_public_', ''));
    
    console.log(`Found ${publicTattooIds.length} public tattoo IDs in localStorage:`, publicTattooIds);

    // Early return if no public tattoos exist
    if (publicTattooIds.length === 0) {
      return {
        tattoos: [],
        totalCount: 0,
        totalPages: 0
      };
    }
    
    // Fetch all tattoos from Supabase
    const { data, error } = await supabase
      .from('tattoos')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching tattoos from Supabase:', error);
      return {
        tattoos: [],
        totalCount: 0,
        totalPages: 0
      };
    }
    
    console.log(`Fetched ${data?.length || 0} tattoos from Supabase`);
    
    // Filter tattoos to only include those marked as public in localStorage
    const publicTattoos = data
      .filter(tattoo => publicTattooIds.includes(tattoo.id))
      .map(tattoo => ({
        ...tattoo,
        isPublic: true,
        username: tattoo.profiles?.username || 'Anonymous',
        avatar_url: tattoo.profiles?.avatar_url || null,
        dateAdded: new Date(tattoo.created_at || tattoo.date_added)
      }));
    
    console.log(`Found ${publicTattoos.length} public tattoos after filtering`);
    
    // Sort by date (newest first)
    const sortedTattoos = publicTattoos.sort((a, b) => 
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
    
    // Paginate the results
    const paginatedTattoos = sortedTattoos.slice(from, to + 1);
    
    console.log(`Final display: ${paginatedTattoos.length} real public tattoos`);
    
    return {
      tattoos: paginatedTattoos,
      totalCount: sortedTattoos.length,
      totalPages: Math.ceil(sortedTattoos.length / pageSize)
    };
  } catch (error) {
    console.error('Error in fetchPublicTattoos:', error);
    return {
      tattoos: [],
      totalCount: 0,
      totalPages: 0
    };
  }
};

const PublicFeed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [publicTattooCount, setPublicTattooCount] = useState(0);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 9; // Show more items per page
  
  const { ref: loadMoreRef, inView } = useInView();
  const loadedPagesRef = useRef<Set<number>>(new Set([1]));
  
  // Add debugging state
  const [debugInfo, setDebugInfo] = useState<{ message: string; type: 'info' | 'error' | 'success' }>({
    message: 'Initializing...',
    type: 'info'
  });
  
  // Fetch information about public tattoos in localStorage
  useEffect(() => {
    checkLocalStorageForPublicTattoos(false);
  }, []);
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch 
  } = useInfiniteQuery({
    queryKey: ['public-tattoos-infinite'],
    queryFn: ({ pageParam }) => fetchPublicTattoos(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
  });
  
  // Trigger refetch when component mounts
  useEffect(() => {
    console.log('PublicFeed mounted, triggering refetch');
    refetch();
  }, [refetch]);
  
  // Load more tattoos when user scrolls to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  const allTattoos = data?.pages.flatMap(page => page.tattoos) || [];
  console.log('All tattoos to display:', allTattoos.length, allTattoos);

  const checkLocalStorageForPublicTattoos = (showToast = true) => {
    console.log('Checking localStorage for public tattoos');
    const keys = Object.keys(localStorage);
    const publicTattooKeys = keys.filter(key => key.startsWith('tattoo_public_') && localStorage.getItem(key) === 'true');
    const publicTattooIds = publicTattooKeys.map(key => key.replace('tattoo_public_', ''));
    
    console.log('Public tattoo keys found:', publicTattooKeys);
    console.log('Public tattoo IDs:', publicTattooIds);
    
    setPublicTattooCount(publicTattooIds.length);
    
    if (showToast) {
      const message = `Found ${publicTattooIds.length} public tattoos in localStorage`;
      setDebugInfo({ message, type: 'info' });
      toast.info(message);
    }
    
    refetch();
  };
  
  const renderTattooCards = () => {
    if (isLoading) {
      return Array(6).fill(0).map((_, index) => (
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
      ));
    }
    
    if (allTattoos.length === 0) {
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
                onClick={() => {
                  checkLocalStorageForPublicTattoos();
                }}
              >
                Refresh Gallery
              </button>
              <button 
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                onClick={() => {
                  // Display debug information
                  toast.info('Checking for public tattoos...');
                  checkLocalStorageForPublicTattoos();
                }}
              >
                Debug Public Tattoos
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return allTattoos.map((tattoo) => (
      <PublicTattooCard key={tattoo.id} tattoo={tattoo} />
    ));
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
                  checkLocalStorageForPublicTattoos();
                  setDebugInfo({ message: "Gallery refreshed", type: 'success' });
                  toast.success("Gallery refreshed");
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Gallery
              </button>
            </div>
          </div>
          
          {/* Debug info */}
          {debugInfo.message && (
            <div className={`mb-4 p-3 rounded-md ${
              debugInfo.type === 'error' ? 'bg-destructive/10 text-destructive' :
              debugInfo.type === 'success' ? 'bg-green-500/10 text-green-600' :
              'bg-primary/10 text-primary'
            }`}>
              {debugInfo.message}
            </div>
          )}
          
          <ScrollArea className="h-[calc(100vh-200px)] rounded-lg pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {renderTattooCards()}
            </div>
            
            {hasNextPage && (
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
            )}
            
            {!hasNextPage && allTattoos.length > 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                You've reached the end of the gallery
              </div>
            )}
          </ScrollArea>
        </div>
      </main>
    </div>
  );
};

export default PublicFeed;
