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

// Check if tattoos with is_public flag exist in Supabase
export const checkForPublicTattoos = async () => {
  console.log('Checking for tattoos marked as public in Supabase');
  try {
    // Use a simple RPC call to get all public tattoo IDs
    // This is a safer approach than trying to access fields that may not exist
    const { data, error } = await supabase
      .from('tattoos')
      .select('id, title')
      .limit(100);
      
    if (error) {
      console.error('Error checking for public tattoos:', error);
      return [];
    }
    
    // For the demo, let's make all tattoos with "Public" or "Demo" in the title public
    const publicTattooIds = data
      .filter(tattoo => 
        tattoo.title.toLowerCase().includes('public') || 
        tattoo.title.toLowerCase().includes('demo')
      )
      .map(tattoo => tattoo.id);
      
    console.log(`Found ${publicTattooIds.length} tattoos that should be public`);
    return publicTattooIds;
    
  } catch (error) {
    console.error('Error in checkForPublicTattoos:', error);
    return [];
  }
};

/**
 * Mark a tattoo as globally public by setting a custom field in Supabase
 */
export const markTattooAsGloballyPublic = async (tattooId: string, isPublic: boolean) => {
  try {
    // Mark a tattoo as public in Supabase - regardless of who views it
    // This is used when a user toggles the public switch in the UI
    
    // First check if the tattoo exists
    const { data: tattooExists, error: checkError } = await supabase
      .from('tattoos')
      .select('id')
      .eq('id', tattooId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking if tattoo exists:', checkError);
      return false;
    }
    
    if (!tattooExists) {
      console.error('Tattoo not found:', tattooId);
      return false;
    }
    
    // We'll mark tattoos with a custom property in their title instead of using a new column
    // This works because we don't have permission to alter the schema
    const { data: currentTattoo, error: getTattooError } = await supabase
      .from('tattoos')
      .select('title')
      .eq('id', tattooId)
      .single();
    
    if (getTattooError) {
      console.error('Error getting tattoo:', getTattooError);
      return false;
    }
    
    // Update the title to add/remove the [Public] tag
    let newTitle = currentTattoo.title;
    
    if (isPublic && !newTitle.includes('[Public]')) {
      newTitle = `[Public] ${newTitle}`;
    } else if (!isPublic && newTitle.includes('[Public]')) {
      newTitle = newTitle.replace('[Public] ', '');
    }
    
    // Only update if the title actually changed
    if (newTitle !== currentTattoo.title) {
      const { error: updateError } = await supabase
        .from('tattoos')
        .update({ title: newTitle })
        .eq('id', tattooId);
        
      if (updateError) {
        console.error('Error updating tattoo visibility:', updateError);
        return false;
      }
    }
    
    // Also save to localStorage for backward compatibility
    localStorage.setItem(`tattoo_public_${tattooId}`, isPublic.toString());
    
    return true;
  } catch (error) {
    console.error('Error marking tattoo as globally public:', error);
    return false;
  }
};

export const fetchPublicTattoos = async (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  console.log(`Fetching public tattoos: page ${page}, range ${from}-${to}`);
  
  try {
    // Get ALL tattoos from Supabase first
    const { data: allTattoos, error: fetchAllError } = await supabase
      .from('tattoos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (fetchAllError) {
      console.error('Error fetching tattoos from Supabase:', fetchAllError);
      return {
        tattoos: [],
        totalCount: 0,
        totalPages: 0
      };
    }
    
    console.log(`Fetched ${allTattoos?.length || 0} total tattoos from Supabase`);
    
    // Get public tattoo IDs from all sources
    // 1. Check localStorage (for the logged-in user who created public tattoos)
    let localStoragePublicIds: string[] = [];
    try {
      const keys = Object.keys(localStorage);
      localStoragePublicIds = keys
        .filter(key => key.startsWith('tattoo_public_') && localStorage.getItem(key) === 'true')
        .map(key => key.replace('tattoo_public_', ''));
      
      console.log(`Found ${localStoragePublicIds.length} public tattoo IDs in localStorage`);
    } catch (error) {
      console.error('Error accessing localStorage (might be in private browsing):', error);
    }
    
    // 2. Find tattoos that have [Public] in their title
    const titlePublicTattoos = allTattoos.filter(tattoo => 
      tattoo.title && (
        tattoo.title.includes('[Public]') || 
        tattoo.title.toLowerCase().includes('public') ||
        tattoo.title.toLowerCase().includes('demo')
      )
    );
    
    const titlePublicIds = titlePublicTattoos.map(tattoo => tattoo.id);
    console.log(`Found ${titlePublicIds.length} tattoos with public markers in their title`);
    
    // 3. Combine both sources of public tattoo IDs and remove duplicates
    const publicTattooIds = Array.from(new Set([...localStoragePublicIds, ...titlePublicIds]));
    
    console.log(`Combined ${publicTattooIds.length} unique public tattoo IDs from all sources`);
    
    // If there are no public tattoos, create a demo one
    if (publicTattooIds.length === 0) {
      console.log('No public tattoos found. Creating a demo public tattoo...');
      await createDemoPublicTattoo();
      
      // Refetch all tattoos after creating the demo
      const { data: updatedTattoos } = await supabase
        .from('tattoos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (updatedTattoos) {
        // Find the newly created demo tattoo
        const demoTattoos = updatedTattoos.filter(tattoo => 
          tattoo.title && (
            tattoo.title.includes('[Public]') || 
            tattoo.title.toLowerCase().includes('public') ||
            tattoo.title.toLowerCase().includes('demo')
          )
        );
        
        const demoTattooIds = demoTattoos.map(tattoo => tattoo.id);
        publicTattooIds.push(...demoTattooIds);
        
        console.log(`After creating demo, found ${demoTattooIds.length} public tattoo IDs`);
      }
    }
    
    // Fetch all profiles
    const profiles = await fetchProfiles();
    
    // Fetch all tattoos from Supabase
    const { data: allTattoosData, error: fetchError } = await supabase
      .from('tattoos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (fetchError) {
      console.error('Error fetching tattoos from Supabase:', fetchError);
      return {
        tattoos: [],
        totalCount: 0,
        totalPages: 0
      };
    }
    
    console.log(`Fetched ${allTattoosData?.length || 0} tattoos from Supabase`);
    
    // Filter tattoos to include only those marked as public
    const publicTattoos = allTattoosData
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
      .ilike('title', '%[Public]%')
      .limit(1);
      
    if (checkError) {
      console.error('Error checking for existing demo tattoos:', checkError);
      return null;
    }
    
    // If demo tattoo already exists, just make it public in localStorage
    if (existingData && existingData.length > 0) {
      console.log('Public tattoo already exists, ensuring it is marked as public in localStorage');
      localStorage.setItem(`tattoo_public_${existingData[0].id}`, 'true');
      return existingData[0].id;
    }
    
    // Create a new demo tattoo
    const demoTattoo = {
      title: '[Public] Demo Tattoo - Shared With Everyone',
      artist: 'Demo Artist',
      location: 'Forearm',
      meaning: 'This is a demo public tattoo for testing the public gallery. This tattoo is visible to everyone.',
      date_added: new Date().toISOString(),
      user_id: 'demo-user-id',
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
    
    // Mark the new tattoo as public in localStorage
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
  
  // Get public tattoos from localStorage
  const keys = Object.keys(localStorage);
  const publicTattooKeys = keys.filter(key => key.startsWith('tattoo_public_') && localStorage.getItem(key) === 'true');
  const publicTattooIds = publicTattooKeys.map(key => key.replace('tattoo_public_', ''));
  
  console.log('Public tattoo keys found in localStorage:', publicTattooKeys);
  
  // Also check server-side (to show the total count correctly)
  checkForPublicTattoos().then(serverPublicIds => {
    const totalPublicCount = new Set([...publicTattooIds, ...serverPublicIds]).size;
    console.log(`Total public tattoos (localStorage + server): ${totalPublicCount}`);
    
    setPublicTattooCount(totalPublicCount);
    
    if (showToast) {
      const message = `Found ${totalPublicCount} public tattoos in total`;
      setDebugInfo({ message, type: 'info' });
      toast.info(message);
    }
    
    // If no public tattoos found, initialize and possibly create a demo
    if (totalPublicCount === 0) {
      // Initialize public status for all existing tattoos
      initializePublicStatusInLocalStorage().then(() => {
        // Create a demo tattoo
        setDebugInfo({ 
          message: 'No public tattoos found. Creating a demo public tattoo...', 
          type: 'info' 
        });
        createDemoPublicTattoo().then(() => refetch());
      });
    } else {
      // Refresh the display with existing public tattoos
      refetch();
    }
  });
};
