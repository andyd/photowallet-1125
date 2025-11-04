/**
 * Web Share API Hook
 *
 * Provides native sharing functionality using the Web Share API.
 * Falls back gracefully on browsers that don't support it.
 */

import { useState } from 'react';
import type { Photo } from '@shared/schema';

interface ShareOptions {
  title?: string;
  text?: string;
}

export function useWebShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Web Share API is available
  const canShare =
    typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';

  /**
   * Share a photo using the Web Share API
   * @param photo - The photo to share
   * @param options - Optional title and text for the share
   * @returns Promise<boolean> - true if shared successfully, false if cancelled
   */
  const sharePhoto = async (
    photo: Photo,
    options: ShareOptions = {}
  ): Promise<boolean> => {
    if (!canShare) {
      setError('Web Share API is not supported on this browser');
      return false;
    }

    setIsSharing(true);
    setError(null);

    try {
      // Convert blob to File object (required by Web Share API)
      const file = new File([photo.blob], photo.filename, {
        type: photo.blob.type,
      });

      // Prepare share data
      const shareData: ShareData = {
        title: options.title || 'Photo from Photo Wallet',
        text: options.text || `Sharing ${photo.filename}`,
        files: [file],
      };

      // Check if we can share files
      if (!navigator.canShare || !navigator.canShare(shareData)) {
        // Fallback: share without the file
        const fallbackData: ShareData = {
          title: shareData.title,
          text: shareData.text,
        };
        await navigator.share(fallbackData);
      } else {
        await navigator.share(shareData);
      }

      setIsSharing(false);
      return true;
    } catch (err: any) {
      // User cancelled the share
      if (err.name === 'AbortError') {
        setIsSharing(false);
        return false;
      }

      // Other errors
      setError(err.message || 'Failed to share photo');
      setIsSharing(false);
      return false;
    }
  };

  /**
   * Share multiple photos
   * Note: Most browsers only support sharing one file at a time
   */
  const sharePhotos = async (
    photos: Photo[],
    options: ShareOptions = {}
  ): Promise<boolean> => {
    if (photos.length === 0) {
      setError('No photos to share');
      return false;
    }

    if (photos.length === 1) {
      return sharePhoto(photos[0], options);
    }

    // For multiple photos, share the first one with a note about count
    return sharePhoto(photos[0], {
      ...options,
      text: `Sharing ${photos.length} photos from Photo Wallet`,
    });
  };

  return {
    canShare,
    isSharing,
    error,
    sharePhoto,
    sharePhotos,
  };
}
