
import { supabase } from './client';
import { toast } from "sonner";

/**
 * Initialize the Supabase storage buckets required by the application
 */
export async function initializeStorage() {
  try {
    console.log('Checking if tattoos bucket exists...');
    
    // First check if the bucket exists
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    
    if (getBucketsError) {
      console.error('Error checking storage buckets:', getBucketsError);
      return false;
    }
    
    const tattoosBucketExists = buckets.some(bucket => bucket.name === 'tattoos');
    
    if (!tattoosBucketExists) {
      console.log('Tattoos bucket does not exist, creating it...');
      
      // Create the bucket with public access
      const { error: createBucketError } = await supabase.storage.createBucket('tattoos', {
        public: true, // Make the bucket public so images can be viewed without authentication
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit per file
      });
      
      if (createBucketError) {
        console.error('Error creating tattoos bucket:', createBucketError);
        return false;
      }
      
      console.log('Tattoos bucket created successfully');
    } else {
      console.log('Tattoos bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error initializing storage:', error);
    return false;
  }
}

/**
 * Upload an image to the tattoos bucket
 */
export async function uploadTattooImage(file: File, userId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('tattoos')
      .upload(fileName, file);
      
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('tattoos')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (error) {
    console.error('Error uploading tattoo image:', error);
    return null;
  }
}
