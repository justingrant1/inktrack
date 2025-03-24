
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
import { toast } from "sonner";

const queryClient = new QueryClient();

// Initialize local storage for comments and likes
const initializeLocalStorage = () => {
  console.log('Initializing local storage for comments and likes');
  // In a real app, this would be handled by Supabase
  // For now, we'll simulate it with localStorage
  
  // Note: In a production app, we would create these tables in Supabase
  // and add proper RLS policies for them
};

const App = () => {
  useEffect(() => {
    initializeLocalStorage();
    
    // Here we'd check if the Supabase tables exist and create them if not
    // Since we can't modify the database schema in this demo, we're using localStorage
    
    console.log('Tables for comments and likes should be created in Supabase');
    
    // In a real setup, we would ensure these tables exist:
    // - tattoo_comments (id, tattoo_id, user_id, text, created_at)
    // - tattoo_likes (id, tattoo_id, user_id, created_at)
    // - Add is_public column to the tattoos table
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
