
import React, { useState, useRef } from 'react';
import { Calendar as CalendarIcon, X, Camera, Upload } from 'lucide-react';
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
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      setShowCamera(false);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle camera capture
  const handleCameraClick = async () => {
    try {
      if (showCamera && stream) {
        // If camera is already open, close it
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setShowCamera(false);
        return;
      }

      // Open camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'tattoo-photo.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            const imageUrl = URL.createObjectURL(blob);
            setImage(imageUrl);
            
            // Close camera
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setShowCamera(false);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Clean up function to stop camera stream
  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setShowCamera(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !artist || !location || !dateAdded) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    let finalImageUrl = image;
    
    // If we have a new image file, prepare it for upload
    if (imageFile) {
      try {
        // Here you would typically upload the file to your storage
        // For now, we'll just use the local object URL
        finalImageUrl = URL.createObjectURL(imageFile);
        
        // In a real implementation with Supabase storage, you would do:
        // const { data, error } = await supabase.storage
        //   .from('tattoos')
        //   .upload(`${user.id}/${Date.now()}.jpg`, imageFile);
        // if (error) throw error;
        // finalImageUrl = supabase.storage.from('tattoos').getPublicUrl(data.path).publicUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image. Please try again.');
        return;
      }
    }
    
    const newTattoo = {
      id: editingTattoo?.id || Date.now().toString(),
      title,
      artist,
      location,
      meaning,
      dateAdded,
      lastRefreshed,
      image: finalImageUrl
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
      setImageFile(null);
    }
    
    // Always stop camera when form is reset
    stopCameraStream();
  };

  // Clean up when dialog closes
  React.useEffect(() => {
    if (!open) {
      stopCameraStream();
    }
    
    return () => {
      stopCameraStream();
    };
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          stopCameraStream();
        }
        onOpenChange(isOpen);
      }}
    >
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

            {/* Image capture/upload section */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Image
              </Label>
              <div className="col-span-3 space-y-4">
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCameraClick}
                    className="flex-1"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {showCamera ? 'Cancel' : 'Take Photo'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleUploadClick}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Camera view */}
                {showCamera && (
                  <div className="relative rounded-md overflow-hidden">
                    <AspectRatio ratio={4/3} className="bg-muted">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                    <Button 
                      onClick={capturePhoto}
                      className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                      type="button"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture
                    </Button>
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                )}
                
                {/* Image preview */}
                {image && !showCamera && (
                  <div className="relative rounded-md overflow-hidden subtle-border">
                    <AspectRatio ratio={4/3} className="bg-muted">
                      <img 
                        src={image} 
                        alt="Tattoo preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://placehold.co/400x300?text=Invalid+Image+URL';
                        }}
                      />
                    </AspectRatio>
                    <Button 
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 bg-background/80 backdrop-blur-sm"
                      onClick={() => {
                        setImage(undefined);
                        setImageFile(null);
                      }}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Image URL input (as fallback) */}
                <Input
                  id="image"
                  value={image || ''}
                  onChange={(e) => {
                    setImage(e.target.value);
                    setImageFile(null);
                  }}
                  placeholder="Or paste an image URL"
                  className={image ? "opacity-50" : ""}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                stopCameraStream();
                onOpenChange(false);
              }} 
              type="button"
            >
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
