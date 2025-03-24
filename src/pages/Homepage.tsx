
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Clock, Images, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Homepage = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-40 glass-morphism animate-fade-in">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Inked Chronicles
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/feed">Explore Gallery</Link>
            </Button>
            
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/app">My Collection</Link>
                </Button>
                <Button variant="outline" onClick={signOut} className="hover-scale">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="hover-scale">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 md:py-32 flex flex-col items-center justify-center text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl">
          Keep track of your tattoo journey in one place
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-10">
          Document your tattoos, their meanings, and keep track of when they need to be refreshed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild className="hover-scale">
            <Link to="/app" className="flex items-center gap-2">
              Start your collection <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="hover-scale">
            <Link to="/feed" className="flex items-center gap-2">
              <Images className="h-4 w-4" /> Explore Gallery
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 animate-fade-in">
        <h2 className="text-3xl font-semibold text-center mb-16">Why track your ink?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="glass-morphism p-6 rounded-xl">
            <div className="mb-4 flex justify-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2 text-center">Preserve Meanings</h3>
            <p className="text-muted-foreground text-center">
              Document the stories and meanings behind each tattoo before memories fade.
            </p>
          </div>
          
          <div className="glass-morphism p-6 rounded-xl">
            <div className="mb-4 flex justify-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Clock className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2 text-center">Maintenance Reminders</h3>
            <p className="text-muted-foreground text-center">
              Keep track of when your tattoos need touch-ups to keep them looking fresh.
            </p>
          </div>
          
          <div className="glass-morphism p-6 rounded-xl">
            <div className="mb-4 flex justify-center">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2 text-center">Artist Information</h3>
            <p className="text-muted-foreground text-center">
              Never forget the talented artists behind your body art collection.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 flex flex-col items-center animate-fade-in">
        <div className="glass-morphism p-10 rounded-2xl max-w-3xl w-full text-center">
          <h2 className="text-3xl font-semibold mb-4">Ready to chronicle your ink?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of tattoo enthusiasts who use Inked Chronicles to document their tattoo journey.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {user ? (
              <Button size="lg" asChild className="hover-scale">
                <Link to="/app">
                  Go to My Collection
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="hover-scale">
                <Link to="/auth">
                  Get Started Now
                </Link>
              </Button>
            )}
            <Button size="lg" variant="outline" asChild className="hover-scale">
              <Link to="/feed" className="flex items-center gap-2">
                <Images className="h-4 w-4" /> Browse Public Gallery
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-10 border-t border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Inked Chronicles. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
