
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
import { Progress } from '@/components/ui/progress';

const fetchProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} profiles from Supabase`);
    return data || [];
  } catch (error) {
    console.error('Error in fetchProfiles:', error);
    return [];
  }
};

const fetchPublicTattoos = async (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  console.log(`Fetching public tattoos: page ${page}, range ${from}-${to}`);
  
  try {
    // Get all public tattoo IDs from localStorage
    const keys = Object.keys(localStorage);
    const publicTattooIds = keys
      .filter(key => key.startsWith('tattoo_public_') && localStorage.getItem(key) === 'true')
      .map(key => key.replace('tattoo_public_', ''));
    
    console.log(`Found ${publicTattooIds.length} public tattoo IDs in localStorage:`, publicTattooIds);
    
    if (publicTattooIds.length === 0) {
      return {
        tattoos: [],
        totalCount: 0,
        totalPages: 0
      };
    }
    
    // Fetch all profiles
    const profiles = await fetchProfiles();
    
    // Fetch all tattoos from Supabase
    const { data, error } = await supabase
      .from('tattoos')
      .select('*')
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
    
    // Filter tattoos to include only those marked as public
    const publicTattoos = data
      .filter(tattoo => publicTattooIds.includes(tattoo.id))
      .map(tattoo => {
        const profile = profiles.find(p => p.id === tattoo.user_id);
        
        return {
          ...tattoo,
          isPublic: true,
          username: profile?.username || 'Anonymous',
          avatar_url: profile?.avatar_url || null,
          dateAdded: new Date(tattoo.created_at || tattoo.date_added)
        };
      });
    
    console.log(`Found ${publicTattoos.length} public tattoos after filtering`);
    
    // Sort by date (newest first)
    const sortedTattoos = publicTattoos.sort((a, b) => 
      new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    );
    
    // Apply pagination
    const paginatedTattoos = sortedTattoos.slice(from, to + 1);
    
    console.log(`Final display: ${paginatedTattoos.length} public tattoos to render`);
    
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 9; // Show more items per page
  
  const { ref: loadMoreRef, inView } = useInView();
  
  const [debugInfo, setDebugInfo] = useState<{ message: string; type: 'info' | 'error' | 'success' }>({
    message: 'Initializing...',
    type: 'info'
  });
  
  useEffect(() => {
    checkLocalStorageForPublicTattoos(false);
    
    // Simulate loading progress
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
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch,
    isInitialLoading
  } = useInfiniteQuery({
    queryKey: ['public-tattoos-infinite'],
    queryFn: ({ pageParam }) => fetchPublicTattoos(pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    staleTime: 0, // Don't cache results
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false // Prevent refetch on window focus
  });
  
  useEffect(() => {
    console.log('PublicFeed mounted, triggering refetch');
    // Force clear the query cache and refetch
    refetch();
    checkLocalStorageForPublicTattoos(false);
    
    // Set loading state
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, [refetch]);
  
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
    if (isLoading || isInitialLoading) {
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
          
          {debugInfo.message && (
            <div className={`mb-4 p-3 rounded-md ${
              debugInfo.type === 'error' ? 'bg-destructive/10 text-destructive' :
              debugInfo.type === 'success' ? 'bg-green-500/10 text-green-600' :
              'bg-primary/10 text-primary'
            }`}>
              {debugInfo.message}
            </div>
          )}
          
          {isLoading && (
            <div className="mb-8">
              <p className="text-center text-sm text-muted-foreground mb-2">Loading public tattoos...</p>
              <Progress value={loadingProgress} className="h-2" />
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
