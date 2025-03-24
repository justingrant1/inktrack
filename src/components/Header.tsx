
import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAddNew: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddNew }) => {
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
          <Button onClick={onAddNew} className="hover-scale">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
