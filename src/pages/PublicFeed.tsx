
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import PublicTattooCard from '@/components/PublicTattooCard';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useSearchParams } from 'react-router-dom';

// Function to get tattoos from the database
// Since we don't have is_public in the schema, we'll get all tattoos
// In a real app, this would filter by is_public
const fetchPublicTattoos = async (page: number, pageSize: number) => {
  // Calculate range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // Get all tattoos
  const { data, error, count } = await supabase
    .from('tattoos')
    .select(`
      *,
      profiles(username, avatar_url)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
    
  if (error) throw error;
  
  // Format the data
  return {
    tattoos: data.map((tattoo: any) => ({
      ...tattoo,
      dateAdded: new Date(tattoo.date_added),
      username: tattoo.profiles?.username,
      avatar_url: tattoo.profiles?.avatar_url
    })),
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
};

const PublicFeed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 6;
  
  // Fetch public tattoos with pagination
  const { data, isLoading } = useQuery({
    queryKey: ['public-tattoos', page, pageSize],
    queryFn: () => fetchPublicTattoos(page, pageSize)
  });
  
  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    if (!data || data.totalPages <= 1) return null;
    
    const items = [];
    const totalPages = data.totalPages;
    
    // Always show first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink 
          onClick={() => handlePageChange(1)} 
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
      
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink 
            onClick={() => handlePageChange(i)} 
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)} 
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container py-6 animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Public Tattoo Gallery</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : data?.tattoos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No public tattoos yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {data?.tattoos.map((tattoo) => (
                <PublicTattooCard key={tattoo.id} tattoo={tattoo} />
              ))}
            </div>
            
            {data && data.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      aria-disabled={page === 1}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(data.totalPages, page + 1))}
                      aria-disabled={page === data.totalPages}
                      className={page === data.totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PublicFeed;
