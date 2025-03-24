
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const fetchProfiles = async () => {
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

export const fetchPublicTattoos = async (page: number, pageSize: number) => {
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

export const checkLocalStorageForPublicTattoos = (
  setPublicTattooCount: React.Dispatch<React.SetStateAction<number>>,
  refetch: () => void,
  setDebugInfo: React.Dispatch<React.SetStateAction<{ message: string; type: 'info' | 'error' | 'success' }>>,
  showToast = false
) => {
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
