import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Switch } from '@/components/ui/switch';
import { toast } from "sonner";
import { markTattooAsGloballyPublic } from "@/utils/publicTattooUtils";

interface TattooFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tattoo: {
    id?: string;
    title: string;
    image?: string;
    dateAdded: Date;
    artist: string;
    location: string;
    meaning: string;
    imageFile?: File;
    isPublic?: boolean;
  }) => Promise<any>;
  editingTattoo: {
    id: string;
    title: string;
    image?: string;
    dateAdded: Date;
    artist: string;
    location: string;
    meaning: string;
    isPublic?: boolean;
  } | null;
}

const TattooForm: React.FC<TattooFormProps> = ({ open, onOpenChange, onSave, editingTattoo }) => {
  const [title, setTitle] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<Date>(new Date());
  const [artist, setArtist] = useState('');
  const [location, setLocation] = useState('');
  const [meaning, setMeaning] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (open) {
      if (editingTattoo) {
        setTitle(editingTattoo.title);
        setImage(editingTattoo.image);
        setDate(editingTattoo.dateAdded);
        setArtist(editingTattoo.artist);
        setLocation(editingTattoo.location);
        setMeaning(editingTattoo.meaning);
        setIsPublic(editingTattoo.isPublic || false);
        setImageFile(undefined);
      } else {
        setTitle('');
        setImage(undefined);
        setDate(new Date());
        setArtist('');
        setLocation('');
        setMeaning('');
        setImageFile(undefined);
        setIsPublic(false);
      }
      setIsSubmitting(false);
    }
  }, [open, editingTattoo]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image is too large. Maximum file size is 5MB.");
        return;
      }
      
      setImageFile(file);
      
      try {
        const url = URL.createObjectURL(file);
        setImage(url);
      } catch (error) {
        console.error("Error creating object URL:", error);
        toast.error("Could not preview image");
      }
    }
  };
  
  const removeImage = () => {
    if (image && image.startsWith('blob:')) {
      URL.revokeObjectURL(image);
    }
    
    setImage(undefined);
    setImageFile(undefined);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (imageFile) {
        console.log("Image file ready for upload:", imageFile.name, imageFile.type, `${Math.round(imageFile.size / 1024)}KB`);
      }
      
      // Prepare the tattoo data
      const tattooData = {
        id: editingTattoo?.id,
        title: title.trim(),
        image,
        dateAdded: date,
        artist: artist.trim(),
        location: location.trim(),
        meaning: meaning.trim(),
        imageFile,
        isPublic
      };
      
      // Save the tattoo
      await onSave(tattooData);
      
      // After saving, if this is tagged as public, make sure to mark it as globally public
      // This step ensures it has the [Public] tag in its title for non-logged-in users to see
      if (editingTattoo?.id && isPublic) {
        await markTattooAsGloballyPublic(editingTattoo.id, true);
        console.log(`Marked tattoo ${editingTattoo.id} as globally public for all users to see`);
      } else if (isPublic) {
        // For new tattoos, we'll handle this in the Index component after we know the ID
        console.log('New tattoo marked as public - will be made globally public after saving');
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTattoo ? 'Edit Tattoo' : 'Add New Tattoo'}</DialogTitle>
          <DialogDescription>
            {editingTattoo 
              ? 'Update the details of your tattoo.'
              : 'Fill in the details below to add a new tattoo to your collection.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My awesome tattoo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            {image ? (
              <div className="relative">
                <AspectRatio ratio={4/3} className="bg-muted rounded-md overflow-hidden">
                  <img
                    src={image}
                    alt="Tattoo preview"
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  type="button"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-md h-40 bg-muted/50">
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                  <ImagePlus className="h-10 w-10 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground mt-2">Upload an image</span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Body Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Forearm"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meaning">Meaning or Story</Label>
            <Textarea
              id="meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="What's the story behind this tattoo?"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Make this tattoo public</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTattoo ? 'Update Tattoo' : 'Add Tattoo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TattooForm;
