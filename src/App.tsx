
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Subscription from "./pages/Subscription";
import PublicFeed from "./pages/PublicFeed";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { supabase } from "./integrations/supabase/client";

const queryClient = new QueryClient();

// Initialize storage bucket for tattoo images if it doesn't exist
const initializeStorage = async () => {
  try {
    // Check if the bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'tattoos');
    
    if (!bucketExists) {
      // Create the bucket
      const { error } = await supabase.storage.createBucket('tattoos', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
      } else {
        console.log('Created tattoos storage bucket');
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// Initialize database tables for comments and likes
const initializeTables = async () => {
  // This will be handled through Supabase migrations in a real app
  // For now, we'll just log that the initialization is needed
  console.log('Tables for comments and likes should be created in Supabase');
};

const App = () => {
  useEffect(() => {
    initializeStorage();
    initializeTables();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/feed" element={<PublicFeed />} />
              <Route 
                path="/app" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subscription" 
                element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
