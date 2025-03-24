
import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Home, LogOut, LogIn, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onAddNew?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddNew }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 glass-morphism animate-fade-in">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Inked Chronicles
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link to="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link to="/feed">
              <Images className="h-4 w-4" />
            </Link>
          </Button>
          
          {user ? (
            <>
              {onAddNew && (
                <Button onClick={onAddNew} className="hover-scale mr-2">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New
                </Button>
              )}
              <Button variant="outline" onClick={signOut} className="hover-scale">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button asChild className="hover-scale">
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
