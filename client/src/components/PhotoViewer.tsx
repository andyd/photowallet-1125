import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Share2, Trash2 } from 'lucide-react';
import { useGesture } from '@use-gesture/react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { useWebShare } from '@/hooks/useWebShare';
import { GestureTutorial } from '@/components/GestureTutorial';
import type { Photo } from '@shared/schema';

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDeletePhoto: (id: string) => void;
}

export function PhotoViewer({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  onDeletePhoto,
}: PhotoViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showUI, setShowUI] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const dragOffsetX = useMotionValue(0);
  const dragOffsetY = useMotionValue(0);
  const closingProgress = useMotionValue(0);

  const hideUITimeoutRef = useRef<NodeJS.Timeout>();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const currentPhoto = photos[currentIndex];

  const { canShare, sharePhoto } = useWebShare();

  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [urlsReady, setUrlsReady] = useState(false);

  // Create object URLs in useEffect but track when they're ready
  useEffect(() => {
    if (!isOpen || photos.length === 0) {
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
  }, [isOpen, photos]);

  // Sync carousel with currentIndex
  useEffect(() => {
    if (carouselApi && currentIndex !== carouselApi.selectedScrollSnap()) {
      carouselApi.scrollTo(currentIndex);
    }
  }, [currentIndex, carouselApi]);

  // Listen to carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      const index = carouselApi.selectedScrollSnap();
      onIndexChange(index);
    };

    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, onIndexChange]);

  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    dragOffsetX.set(0);
    dragOffsetY.set(0);
    // Hide UI when transitioning between photos
    setShowUI(false);
  }, [currentIndex]);

  // Reset zoom/pan state when viewer closes
  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsClosing(false);
      dragOffsetX.set(0);
      dragOffsetY.set(0);
      closingProgress.set(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Check if user has seen gesture tutorial
    const hasSeenTutorial = localStorage.getItem('photo-wallet-tutorial-seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }

    // Don't auto-show UI, let user tap to show
    setShowUI(false);
    
    return () => {
      if (hideUITimeoutRef.current) {
        clearTimeout(hideUITimeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleTutorialClose = () => {
    localStorage.setItem('photo-wallet-tutorial-seen', 'true');
    setShowTutorial(false);
  };

  const handleTap = (e: React.MouseEvent) => {
    // Don't navigate if zoomed in
    if (scale > 1) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Divide screen into thirds: left, center, right
    const leftThird = width / 3;
    const rightThird = (width * 2) / 3;

    if (x < leftThird) {
      // Tap on left third - go to previous
      if (carouselApi && photos.length > 1) {
        carouselApi.scrollPrev();
      }
    } else if (x > rightThird) {
      // Tap on right third - go to next
      if (carouselApi && photos.length > 1) {
        carouselApi.scrollNext();
      }
    } else {
      // Tap in center third - toggle UI
      if (showUI) {
        setShowUI(false);
        if (hideUITimeoutRef.current) {
          clearTimeout(hideUITimeoutRef.current);
        }
      } else {
        setShowUI(true);
        if (hideUITimeoutRef.current) {
          clearTimeout(hideUITimeoutRef.current);
        }
        hideUITimeoutRef.current = setTimeout(() => {
          setShowUI(false);
        }, 1657);
      }
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    dragOffsetX.set(0);
    dragOffsetY.set(0);

    animate(closingProgress, 1, {
      duration: 0.3,
      ease: [0.32, 0.72, 0, 1],
    }).then(() => {
      onClose();
    });
  };

  const handleDelete = () => {
    if (currentPhoto) {
      onDeletePhoto(currentPhoto.id);

      // Navigate to next photo or close if this was the last one
      if (photos.length > 1) {
        if (currentIndex >= photos.length - 1) {
          onIndexChange(0);
        }
      } else {
        onClose();
      }
    }
  };

  const handleShare = async () => {
    if (!currentPhoto) return;

    await sharePhoto(currentPhoto, {
      title: 'Photo from Photo Wallet',
      text: currentPhoto.filename,
    });
    // Share silently, no toast needed
  };

  // Use gesture hook for comprehensive touch handling
  const bind = useGesture(
    {
      onDrag: ({ offset: [x, y], movement: [mx, my], down, cancel }: any) => {
        // If zoomed in, allow panning
        if (scale > 1) {
          setPosition({ x, y });
        } else if (!isClosing) {
          // While dragging, update offset values for visual feedback
          if (down) {
            const isVertical = Math.abs(my) > Math.abs(mx);
            if (isVertical) {
              dragOffsetY.set(my);
              dragOffsetX.set(0);
            } else {
              dragOffsetX.set(mx);
              dragOffsetY.set(0);
            }
          } else {
            // Gesture ended - determine action
            const isVertical = Math.abs(my) > Math.abs(mx);

            // Vertical swipe to close
            if (isVertical && Math.abs(my) > 80) {
              cancel();
              handleClose();
              return;
            }

            // Animate back to center if no action triggered
            animate(dragOffsetX, 0, { type: 'spring', stiffness: 300, damping: 30 });
            animate(dragOffsetY, 0, { type: 'spring', stiffness: 300, damping: 30 });
          }
        }
      },
      onPinch: ({ offset: [d] }: any) => {
        const newScale = Math.min(Math.max(1, 1 + d / 200), 3);
        setScale(newScale);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      },
      onDoubleClick: ({ event }: any) => {
        event.preventDefault();
        // Double tap to toggle zoom
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
        filterTaps: true,
      },
      pinch: {
        scaleBounds: { min: 1, max: 3 },
        rubberband: true,
      },
    }
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !currentPhoto) {
    return null;
  }
  
  // Don't render until URLs are ready to prevent blank images
  if (!urlsReady || imageUrls.size === 0) {
    return null;
  }
  
  if (isClosing && closingProgress.get() >= 0.99) return null;

  const closingScale = useTransform(closingProgress, [0, 1], [1, 0.3]);
  const closingOpacity = useTransform(closingProgress, [0, 1], [1, 0]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
        onClick={handleTap}
        data-testid="container-photo-viewer"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showUI && !isClosing ? 1 : 0 }}
          className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10"
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
            data-testid="button-close-viewer"
            aria-label="Close photo viewer"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </Button>
          <div
            className="text-white text-sm"
            data-testid="text-photo-index"
            role="status"
            aria-live="polite"
            aria-label={`Viewing photo ${currentIndex + 1} of ${photos.length}`}
          >
            {currentIndex + 1} of {photos.length}
          </div>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              className="text-white hover:bg-white/20"
              data-testid="button-delete-photo"
              aria-label="Delete this photo"
            >
              <Trash2 className="w-6 h-6" aria-hidden="true" />
            </Button>
            {canShare && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
                data-testid="button-share-photo"
                aria-label="Share this photo"
              >
                <Share2 className="w-6 h-6" aria-hidden="true" />
              </Button>
            )}
          </div>
        </motion.div>

        <Carousel
          className="w-full h-full flex items-center justify-center"
          setApi={setCarouselApi}
          opts={{
            loop: true,
            startIndex: currentIndex,
          }}
        >
          <CarouselContent className="h-full items-center ml-0">
            {photos.map((photo, index) => (
              <CarouselItem key={photo.id} className="h-full flex items-center justify-center pl-0">
                <div
                  ref={imageContainerRef}
                  {...bind()}
                  className="relative w-screen h-full flex items-center justify-center touch-none"
                  role="img"
                  aria-label={`Photo: ${photo.filename}`}
                  style={{
                    cursor: scale > 1 ? 'grab' : 'default',
                  }}
                >
                  <motion.div
                    className="flex items-center justify-center"
                    style={{
                      x: dragOffsetX,
                      y: dragOffsetY,
                      scale: isClosing ? closingScale : scale > 1 ? scale : undefined,
                      opacity: isClosing ? closingOpacity : undefined,
                    }}
                  >
                    {imageUrls.get(photo.id) && (
                      <motion.img
                        src={imageUrls.get(photo.id)}
                        alt={photo.filename}
                        className="max-w-[100vw] max-h-[100vh] w-auto h-auto object-contain select-none"
                        style={{
                          transform: scale > 1 && index === currentIndex
                            ? `translate(${position.x / scale}px, ${position.y / scale}px)`
                            : undefined,
                        }}
                        data-testid="img-viewer-photo"
                      />
                    )}
                  </motion.div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {photos.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showUI && !isClosing ? 1 : 0 }}
            >
              <CarouselPrevious
                className="left-4 text-white hover:bg-white/20 border-0"
                aria-label="Previous photo"
              />
              <CarouselNext
                className="right-4 text-white hover:bg-white/20 border-0"
                aria-label="Next photo"
              />
            </motion.div>
          )}
        </Carousel>

        {scale > 1 && !isClosing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm"
            data-testid="text-zoom-level"
          >
            {scale.toFixed(1)}x
          </motion.div>
        )}

        {/* Gesture Tutorial for first-time users */}
        {showTutorial && <GestureTutorial onClose={handleTutorialClose} />}
      </motion.div>
    </AnimatePresence>
  );
}
