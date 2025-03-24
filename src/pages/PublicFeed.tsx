import React, { useRef, useEffect } from 'react';
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
  
  const { data, error, count } = await supabase
    .from('tattoos')
    .select(`
      *,
      profiles(username, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
    
  if (error) {
    console.error('Error fetching tattoos:', error);
    throw error;
  }
  
  console.log(`Fetched ${data?.length || 0} tattoos, total count: ${count || 0}`);
  
  const tattoos = data.map((tattoo: any) => {
    const isPublic = localStorage.getItem(`tattoo_public_${tattoo.id}`) === 'true';
    console.log(`Tattoo ${tattoo.id}: ${tattoo.title} - isPublic: ${isPublic}`);
    
    return {
      ...tattoo,
      dateAdded: new Date(tattoo.date_added),
      username: tattoo.profiles?.username,
      avatar_url: tattoo.profiles?.avatar_url,
      isPublic: isPublic
    };
  })
  .filter((tattoo: any) => {
    return tattoo.isPublic;
  });
  
  console.log(`After filtering: ${tattoos.length} public tattoos`);
  
  return {
    tattoos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

const PublicFeed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 9; // Show more items per page
  
  const { ref: loadMoreRef, inView } = useInView();
  const loadedPagesRef = useRef<Set<number>>(new Set([1]));
  
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
  
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  const allTattoos = data?.pages.flatMap(page => page.tattoos) || [];
  
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
              Be the first to share your tattoo with the community!
            </p>
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
          </div>
          
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
