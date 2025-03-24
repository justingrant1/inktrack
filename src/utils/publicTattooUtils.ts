import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Add Vite environment type declaration
declare global {
  interface ImportMeta {
    env: {
      DEV: boolean;
      PROD: boolean;
      MODE: string;
    };
  }
}

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

// Ensure all existing tattoos have a public/private status in localStorage
export const initializePublicStatusInLocalStorage = async () => {
  console.log('Initializing public status for all tattoos in localStorage');
  
  try {
    // Fetch all tattoos from Supabase
    const { data, error } = await supabase
      .from('tattoos')
      .select('*');
      
    if (error) {
      console.error('Error fetching tattoos for public status initialization:', error);
      return false;
    }
    
    // Ensure each tattoo has a public/private status in localStorage
    data.forEach(tattoo => {
      const publicStatusKey = `tattoo_public_${tattoo.id}`;
      if (localStorage.getItem(publicStatusKey) === null) {
        // Default to private (false) if not set
        localStorage.setItem(publicStatusKey, 'false');
      }
    });
    
    console.log(`Initialized public status for ${data.length} tattoos`);
    return true;
  } catch (error) {
    console.error('Error initializing public status:', error);
    return false;
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
    
    // If there are no public tattoos, create a demo one for testing if we're in development
    if (publicTattooIds.length === 0 && import.meta.env.DEV) {
      console.log('No public tattoos found. Creating a demo public tattoo for testing...');
      await createDemoPublicTattoo();
      // Re-check public tattoo IDs after creating the demo tattoo
      const updatedKeys = Object.keys(localStorage);
      const updatedPublicTattooIds = updatedKeys
        .filter(key => key.startsWith('tattoo_public_') && localStorage.getItem(key) === 'true')
        .map(key => key.replace('tattoo_public_', ''));
      
      console.log(`After creating demo tattoo, found ${updatedPublicTattooIds.length} public tattoo IDs`);
      
      if (updatedPublicTattooIds.length === 0) {
        return {
          tattoos: [],
          totalCount: 0,
          totalPages: 0
        };
      }
      
      // Use the updated IDs list if we created a demo tattoo
      publicTattooIds.push(...updatedPublicTattooIds);
    } else if (publicTattooIds.length === 0) {
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

// Create a demo public tattoo for testing
const createDemoPublicTattoo = async () => {
  try {
    // Check if we already have demo tattoos
    const { data: existingData, error: checkError } = await supabase
      .from('tattoos')
      .select('id')
      .eq('title', 'Demo Public Tattoo')
      .limit(1);
      
    if (checkError) {
      console.error('Error checking for existing demo tattoos:', checkError);
      return null;
    }
    
    // If demo tattoo already exists, just make it public
    if (existingData && existingData.length > 0) {
      console.log('Demo tattoo already exists, ensuring it is marked as public');
      localStorage.setItem(`tattoo_public_${existingData[0].id}`, 'true');
      return existingData[0].id;
    }
    
    // Create a new demo tattoo
    const demoTattoo = {
      title: 'Demo Public Tattoo',
      artist: 'Demo Artist',
      location: 'Demo Location',
      meaning: 'This is a demo public tattoo for testing the public gallery.',
      date_added: new Date().toISOString(),
      user_id: 'demo-user-id', // This should ideally be a real user ID
      image: 'https://source.unsplash.com/random/300x200/?tattoo'
    };
    
    const { data, error } = await supabase
      .from('tattoos')
      .insert(demoTattoo)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating demo tattoo:', error);
      return null;
    }
    
    // Mark the new tattoo as public
    localStorage.setItem(`tattoo_public_${data.id}`, 'true');
    console.log('Created a new demo public tattoo with ID:', data.id);
    
    return data.id;
  } catch (error) {
    console.error('Error in createDemoPublicTattoo:', error);
    return null;
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
  
  // If no public tattoos found, initialize them
  if (publicTattooIds.length === 0) {
    // Initialize public status for all existing tattoos
    initializePublicStatusInLocalStorage().then(() => {
      // Recheck after initialization
      const updatedKeys = Object.keys(localStorage);
      const updatedPublicTattooKeys = updatedKeys.filter(
        key => key.startsWith('tattoo_public_') && localStorage.getItem(key) === 'true'
      );
      
      console.log('After initialization, found public tattoo keys:', updatedPublicTattooKeys);
      setPublicTattooCount(updatedPublicTattooKeys.length);
      
      if (updatedPublicTattooKeys.length === 0 && import.meta.env.DEV) {
        setDebugInfo({ 
          message: 'No public tattoos found. Creating a demo public tattoo...', 
          type: 'info' 
        });
        createDemoPublicTattoo().then(() => refetch());
      }
    });
  }
  
  if (showToast) {
    const message = `Found ${publicTattooIds.length} public tattoos in localStorage`;
    setDebugInfo({ message, type: 'info' });
    toast.info(message);
  }
  
  refetch();
};
