
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="glass-morphism p-8 rounded-xl text-center max-w-md animate-scale-in">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          The page you're looking for has vanished like ink on water.
        </p>
        <Button asChild className="hover-scale">
          <a href="/" className="inline-flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Return to Ink Collection
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
