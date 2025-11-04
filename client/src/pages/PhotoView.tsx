import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { usePhotoStore } from '@/hooks/usePhotoStore';
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel';
import { useGesture } from '@use-gesture/react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PhotoView() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { photos, deletePhoto } = usePhotoStore();
  
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [urlsReady, setUrlsReady] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Gesture and zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Swipe-down to close
  const [isClosing, setIsClosing] = useState(false);
  const closingProgress = useMotionValue(0);
  const closingScale = useTransform(closingProgress, [0, 1], [1, 0.3]);
  const closingOpacity = useTransform(closingProgress, [0, 1], [1, 0]);

  // Find current photo index
  useEffect(() => {
    if (!id || photos.length === 0) return;
    
    const index = photos.findIndex(p => p.id === id);
    if (index === -1) {
      // Photo not found, go back to album
      navigate('/album');
      return;
    }
    
    setCurrentIndex(index);
    
    // Initialize carousel to correct index
    if (carouselApi && index !== carouselApi.selectedScrollSnap()) {
      carouselApi.scrollTo(index, true);
    }
  }, [id, photos, carouselApi, navigate]);

  // Create object URLs
  useEffect(() => {
    if (photos.length === 0) {
      setImageUrls(new Map());
      setUrlsReady(false);
      return;
    }

    const urls = new Map<string, string>();
    photos.forEach((photo) => {
      const url = URL.createObjectURL(photo.blob);
      urls.set(photo.id, url);
    });

    setImageUrls(urls);
    setUrlsReady(true);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      setUrlsReady(false);
    };
  }, [photos]);

  // Update URL when carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    const handleSelect = () => {
      const newIndex = carouselApi.selectedScrollSnap();
      const newPhoto = photos[newIndex];
      if (newPhoto && newPhoto.id !== id) {
        navigate(`/photo/${newPhoto.id}`, { replace: true });
      }
    };

    carouselApi.on('select', handleSelect);
    return () => {
      carouselApi.off('select', handleSelect);
    };
  }, [carouselApi, photos, id, navigate]);

  // Gestures for zoom and pan
  const bind = useGesture(
    {
      onPinch: ({ offset: [d] }) => {
        const newScale = Math.max(1, Math.min(3, 1 + d / 200));
        setScale(newScale);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      },
      onDrag: ({ offset: [x, y], down, velocity: [vx, vy] }) => {
        if (scale > 1) {
          // Pan when zoomed
          setPosition({ x, y });
        } else if (!down && vy > 0.5 && y > 100) {
          // Swipe down to close
          handleClose();
        } else if (down && scale === 1) {
          // Track swipe-down progress for animation
          const progress = Math.min(Math.max(y / 300, 0), 1);
          closingProgress.set(progress);
        } else if (!down) {
          closingProgress.set(0);
        }
      },
      onDoubleClick: () => {
        // Toggle zoom
        if (scale > 1) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2);
        }
      },
    },
    {
      drag: {
        from: () => [position.x, position.y],
        bounds: scale > 1 ? undefined : { top: 0, bottom: 300, left: -50, right: 50 },
      },
      pinch: { scaleBounds: { min: 1, max: 3 }, rubberband: true },
    }
  );

  const handleClose = () => {
    navigate('/album');
  };

  const handleDelete = async () => {
    if (!id) return;
    
    const confirmDelete = window.confirm('Remove this photo from your wallet?');
    if (!confirmDelete) return;

    await deletePhoto(id);
    
    // Navigate to next photo or back to album
    if (photos.length > 1) {
      const nextIndex = currentIndex < photos.length - 1 ? currentIndex : currentIndex - 1;
      const nextPhoto = photos[nextIndex];
      if (nextPhoto && nextPhoto.id !== id) {
        navigate(`/photo/${nextPhoto.id}`, { replace: true });
      } else {
        navigate('/album');
      }
    } else {
      navigate('/album');
    }
  };

  const currentPhoto = photos[currentIndex];
  const currentUrl = currentPhoto ? imageUrls.get(currentPhoto.id) : null;

  if (!currentPhoto || !urlsReady || !currentUrl) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        scale: isClosing ? closingScale : 1,
        opacity: isClosing ? closingOpacity : 1 
      }}
    >
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="text-white text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-white hover:bg-white/20"
            data-testid="button-delete-photo"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Photo Carousel */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <Carousel
          className="w-full h-full"
          setApi={setCarouselApi}
          opts={{ loop: false, startIndex: currentIndex }}
        >
          <CarouselContent className="h-full">
            {photos.map((photo) => {
              const url = imageUrls.get(photo.id);
              if (!url) return null;

              return (
                <CarouselItem key={photo.id} className="h-full flex items-center justify-center">
                  <div
                    ref={imageRef}
                    {...bind()}
                    className="relative w-full h-full flex items-center justify-center touch-none"
                    style={{
                      transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                      transition: 'transform 0.2s ease-out',
                    }}
                  >
                    <img
                      src={url}
                      alt={photo.filename}
                      className="max-w-full max-h-full object-contain select-none"
                      draggable={false}
                      data-testid={`photo-view-${photo.id}`}
                    />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Instructions */}
      {scale === 1 && (
        <div className="absolute bottom-20 left-0 right-0 p-4 text-center">
          <p className="text-white/60 text-sm">
            Swipe left/right • Pinch to zoom • Double tap • Swipe down to close
          </p>
        </div>
      )}
    </motion.div>
  );
}
