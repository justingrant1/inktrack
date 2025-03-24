
import React, { useState } from 'react';
import { Calendar, CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TattooFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tattoo: any) => void;
  editingTattoo?: any | null;
}

const TattooForm: React.FC<TattooFormProps> = ({ 
  open, 
  onOpenChange, 
  onSave,
  editingTattoo 
}) => {
  const [title, setTitle] = useState(editingTattoo?.title || '');
  const [artist, setArtist] = useState(editingTattoo?.artist || '');
  const [location, setLocation] = useState(editingTattoo?.location || '');
  const [meaning, setMeaning] = useState(editingTattoo?.meaning || '');
  const [dateAdded, setDateAdded] = useState<Date | undefined>(
    editingTattoo?.dateAdded ? new Date(editingTattoo.dateAdded) : undefined
  );
  const [lastRefreshed, setLastRefreshed] = useState<Date | undefined>(
    editingTattoo?.lastRefreshed ? new Date(editingTattoo.lastRefreshed) : undefined
  );
  const [image, setImage] = useState<string | undefined>(editingTattoo?.image);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !artist || !location || !dateAdded) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const newTattoo = {
      id: editingTattoo?.id || Date.now().toString(),
      title,
      artist,
      location,
      meaning,
      dateAdded,
      lastRefreshed,
      image
    };
    
    onSave(newTattoo);
    resetForm();
    onOpenChange(false);
  };
  
  const resetForm = () => {
    if (!editingTattoo) {
      setTitle('');
      setArtist('');
      setLocation('');
      setMeaning('');
      setDateAdded(undefined);
      setLastRefreshed(undefined);
      setImage(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] neo-blur animate-scale-in">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editingTattoo ? 'Edit Tattoo' : 'Add New Tattoo'}</DialogTitle>
            <DialogDescription>
              Fill in the details about your tattoo. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="artist" className="text-right">
                Artist *
              </Label>
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location *
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="col-span-3"
                placeholder="E.g., Left arm, Back, etc."
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dateAdded" className="text-right">
                Date *
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateAdded && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateAdded ? format(dateAdded, 'PP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateAdded}
                      onSelect={setDateAdded}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastRefreshed" className="text-right">
                Last Refreshed
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !lastRefreshed && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lastRefreshed ? format(lastRefreshed, 'PP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={lastRefreshed}
                      onSelect={setLastRefreshed}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="meaning" className="text-right pt-2">
                Meaning
              </Label>
              <Textarea
                id="meaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className="col-span-3"
                placeholder="What does this tattoo mean to you?"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image URL
              </Label>
              <Input
                id="image"
                value={image || ''}
                onChange={(e) => setImage(e.target.value)}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            {image && (
              <div className="grid grid-cols-4 gap-4">
                <div className="col-start-2 col-span-3">
                  <div className="relative rounded-md overflow-hidden subtle-border h-32">
                    <img 
                      src={image} 
                      alt="Tattoo preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/400x300?text=Invalid+Image+URL';
                      }}
                    />
                    <Button 
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 bg-background/80 backdrop-blur-sm"
                      onClick={() => setImage(undefined)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TattooForm;
