
import React from 'react';
import { format } from 'date-fns';
import { Pencil, Calendar, User, Globe, Lock, MapPin } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TattooCardProps {
  tattoo: {
    id: string;
    title: string;
    image?: string;
    dateAdded: Date;
    artist: string;
    location: string;
    meaning: string;
    lastRefreshed?: Date;
    isPublic: boolean;
  };
  onEdit: (id: string) => void;
}

const TattooCard = ({ tattoo, onEdit }: TattooCardProps) => {
  return (
    <Card className="tattoo-card animate-fade-in overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex gap-2 mb-2">
              <Badge variant="outline" className="mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {tattoo.location}
              </Badge>
              {tattoo.isPublic ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 mb-2">
                  <Globe className="mr-1 h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-100 text-slate-800 mb-2">
                  <Lock className="mr-1 h-3 w-3" />
                  Private
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-xl mb-1">{tattoo.title}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onEdit(tattoo.id)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {tattoo.image && (
          <div className="mb-4 rounded-md overflow-hidden subtle-border">
            <img 
              src={tattoo.image} 
              alt={tattoo.title}
              className="w-full h-44 object-cover transition-transform hover:scale-105 duration-500"
              loading="lazy"
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            <span>Artist: {tattoo.artist}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Date: {format(tattoo.dateAdded, 'MMMM d, yyyy')}</span>
          </div>
          {tattoo.lastRefreshed && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Last refreshed: {format(tattoo.lastRefreshed, 'MMMM d, yyyy')}</span>
            </div>
          )}
        </div>
        {tattoo.meaning && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-1">Meaning:</h4>
            <p className="text-sm text-muted-foreground">{tattoo.meaning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TattooCard;
