import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploaderProps {
  onPhotoSelect: (file: File) => Promise<void>;
  disabled?: boolean;
  photoCount: number;
  maxPhotos: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function PhotoUploader({ onPhotoSelect, disabled, photoCount, maxPhotos }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxPhotos - photoCount;

    if (fileArray.length > remainingSlots) {
      toast({
        title: 'Too many photos',
        description: `You can only add ${remainingSlots} more photo${remainingSlots === 1 ? '' : 's'}.`,
        variant: 'destructive',
      });
      return;
    }

    let errorCount = 0;

    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errorCount++;
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errorCount++;
        continue;
      }

      try {
        await onPhotoSelect(file);
      } catch (error) {
        errorCount++;
      }
    }

    if (errorCount > 0) {
      toast({
        title: 'Some photos failed',
        description: `${errorCount} photo${errorCount === 1 ? '' : 's'} could not be added.`,
        variant: 'destructive',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isAtLimit = photoCount >= maxPhotos;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        multiple
        className="hidden"
        data-testid="input-photo-upload"
      />
      <Button
        size="icon"
        onClick={handleClick}
        disabled={disabled || isAtLimit}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl z-50"
        data-testid="button-upload-fab"
        style={{ 
          bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
          right: 'max(1.5rem, env(safe-area-inset-right, 1.5rem))'
        }}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </>
  );
}
