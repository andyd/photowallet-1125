import { useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Plus, Images } from 'lucide-react';
import { usePhotoStore } from '@/hooks/usePhotoStore';
import { Button } from '@/components/ui/button';
import { PhotoCounter } from '@/components/PhotoCounter';
import { PhotoGrid } from '@/components/PhotoGrid';
import { ManagePhotosDialog } from '@/components/ManagePhotosDialog';
import { InstallBanner } from '@/components/InstallBanner';
import { photoStorage } from '@/services/photoStorage';
import { isDuplicatePhoto } from '@/utils/photoUtils';
import { MAX_PHOTOS } from '@/utils/constants';

export default function Album() {
  const { photos, isLoading, addPhoto, deletePhoto } = usePhotoStore();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showManagePhotos, setShowManagePhotos] = useState(false);
  const pendingFilesRef = useRef<File[]>([]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleAddPhotos(files);
  };

  const handleAddPhotos = async (files: FileList) => {
    const fileArray = Array.from(files);
    const remainingSlots = MAX_PHOTOS - photos.length;

    if (remainingSlots <= 0) {
      alert(`Your wallet is full (${MAX_PHOTOS} photos). Please remove some photos before adding more.`);
      setShowManagePhotos(true);
      return;
    }

    if (fileArray.length > remainingSlots) {
      alert(`You can only add ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'}. Your wallet limit is ${MAX_PHOTOS} photos.`);
      pendingFilesRef.current = fileArray.slice(0, remainingSlots);
    } else {
      pendingFilesRef.current = fileArray;
    }

    await processNextFile();
  };

  const processNextFile = async () => {
    if (pendingFilesRef.current.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const file = pendingFilesRef.current[0];
    const isDuplicate = await isDuplicatePhoto(file, photos);

    if (!isDuplicate) {
      await addPhotoToStore(file);
    }
    
    pendingFilesRef.current = pendingFilesRef.current.slice(1);
    await processNextFile();
  };

  const addPhotoToStore = async (file: File) => {
    if (photos.length >= MAX_PHOTOS) {
      return;
    }

    try {
      await addPhoto(file);
    } catch (error) {
      console.error('Failed to add photo:', error);
    }
  };

  const handlePhotoClick = (index: number) => {
    const photo = photos[index];
    if (photo) {
      navigate(`/photo/${photo.id}`);
    }
  };

  const handleRemovePhoto = async (id: string) => {
    await photoStorage.archivePhoto(id);
    const { loadPhotos } = usePhotoStore.getState();
    await loadPhotos();
  };

  if (isLoading && photos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Loading your photos...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Images className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No Photos Yet</h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start building your photo wallet by adding your first cherished photo.
        </p>
        <Button onClick={handleUploadClick} size="lg" data-testid="button-add-first-photo">
          <Plus className="w-5 h-5 mr-2" />
          Add Your First Photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header with counter and add button */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <PhotoCounter 
          count={photos.length} 
          onClick={() => setShowManagePhotos(true)}
        />
        <Button
          size="sm"
          onClick={handleUploadClick}
          disabled={photos.length >= MAX_PHOTOS}
          data-testid="button-add-photos-header"
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Photos</span>
        </Button>
      </div>

      {/* Photo Grid */}
      <PhotoGrid
        photos={photos}
        onPhotoClick={handlePhotoClick}
        onDelete={deletePhoto}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />

      {/* Manage Photos Dialog */}
      <ManagePhotosDialog
        photos={photos}
        open={showManagePhotos}
        onOpenChange={setShowManagePhotos}
        onDelete={handleRemovePhoto}
      />

      {/* Install Banner */}
      <InstallBanner photoCount={photos.length} />
    </div>
  );
}
