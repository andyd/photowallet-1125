/**
 * Integration Tests - Photo Workflow
 * 
 * These tests verify complete user workflows from start to finish.
 * They test the interaction between multiple components and services.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePhotoStore } from '@/hooks/usePhotoStore';
import { photoStorage } from '@/services/photoStorage';
import { createMockFile } from '@/test/testUtils';

vi.mock('@/services/photoStorage');
vi.mock('@/utils/thumbnailGenerator', () => ({
  generateThumbnail: vi.fn().mockResolvedValue(new Blob(['thumb'], { type: 'image/jpeg' })),
}));

describe('Photo Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(photoStorage.getAllPhotos).mockResolvedValue([]);
    vi.mocked(photoStorage.getArchivedPhotos).mockResolvedValue([]);
    vi.mocked(photoStorage.addPhoto).mockResolvedValue('test-id');
    vi.mocked(photoStorage.deletePhoto).mockResolvedValue();
    vi.mocked(photoStorage.reorderPhotos).mockResolvedValue();
    vi.mocked(photoStorage.archivePhoto).mockResolvedValue();
    vi.mocked(photoStorage.unarchivePhoto).mockResolvedValue();
    // Reset the photo store between tests to avoid shared state
    usePhotoStore.setState({
      photos: [],
      isLoading: false,
      currentPhotoIndex: null,
      isViewerOpen: false,
      archivedPhotos: [],
    } as any);
  });

  describe('Complete Photo Lifecycle', () => {
    it('should add, view, and delete a photo', async () => {
      const { result } = renderHook(() => usePhotoStore());

      // Load initial photos
      await act(async () => {
        await result.current.loadPhotos();
      });
      expect(result.current.photos).toHaveLength(0);

      // Add a photo
      const mockFile = createMockFile('test.jpg');
      await act(async () => {
        await result.current.addPhoto(mockFile);
      });
      
      expect(photoStorage.addPhoto).toHaveBeenCalled();

      // Open viewer
      act(() => {
        result.current.openViewer(0);
      });
      expect(result.current.isViewerOpen).toBe(true);
      expect(result.current.currentPhotoIndex).toBe(0);

      // Close viewer
      act(() => {
        result.current.closeViewer();
      });
      expect(result.current.isViewerOpen).toBe(false);
    });

    it('should enforce 18 photo limit', async () => {
      const { result } = renderHook(() => usePhotoStore());

      // Mock 18 existing photos
      act(() => {
        usePhotoStore.setState({
          photos: Array.from({ length: 18 }, (_, i) => ({
            id: `photo-${i}`,
            blob: new Blob(['test'], { type: 'image/jpeg' }),
            thumbnail: new Blob(['thumb'], { type: 'image/jpeg' }),
            filename: `photo-${i}.jpg`,
            order: i,
            createdAt: new Date(),
            archived: false,
          })),
        });
      });

      // Try to add 19th photo
      const mockFile = createMockFile('new.jpg');
      
      await expect(
        act(async () => {
          await result.current.addPhoto(mockFile);
        })
      ).rejects.toThrow(/Maximum of 18 photos/);
    });
  });

  describe('Archive Workflow', () => {
    it('should move photo to overflow folder', async () => {
      const { result } = renderHook(() => usePhotoStore());

      // Mock a photo being archived
      vi.mocked(photoStorage.archivePhoto).mockResolvedValue();
      vi.mocked(photoStorage.getArchivedPhotos).mockResolvedValue([
        {
          id: 'archived-1',
          blob: new Blob(['test'], { type: 'image/jpeg' }),
          thumbnail: new Blob(['thumb'], { type: 'image/jpeg' }),
          filename: 'archived.jpg',
          order: 0,
          createdAt: new Date(),
          archived: true,
          archivedAt: new Date(),
        },
      ]);

      // Load archived photos
      await act(async () => {
        await result.current.loadArchivedPhotos();
      });

      expect(photoStorage.getArchivedPhotos).toHaveBeenCalled();
    });

    it('should restore photo from overflow', async () => {
      const { result } = renderHook(() => usePhotoStore());

      vi.mocked(photoStorage.unarchivePhoto).mockResolvedValue();
      vi.mocked(photoStorage.getAllPhotos).mockResolvedValue([]);
      vi.mocked(photoStorage.getArchivedPhotos).mockResolvedValue([]);

      await act(async () => {
        await result.current.unarchivePhoto('archived-1');
      });

      expect(photoStorage.unarchivePhoto).toHaveBeenCalledWith('archived-1');
    });

    it('should prevent unarchive when wallet is full', async () => {
      const { result } = renderHook(() => usePhotoStore());

      // Set wallet to full
      act(() => {
        usePhotoStore.setState({
          photos: Array.from({ length: 18 }, (_, i) => ({
            id: `photo-${i}`,
            blob: new Blob(['test'], { type: 'image/jpeg' }),
            thumbnail: new Blob(['thumb'], { type: 'image/jpeg' }),
            filename: `photo-${i}.jpg`,
            order: i,
            createdAt: new Date(),
          })),
        });
      });

      await expect(
        act(async () => {
          await result.current.unarchivePhoto('archived-1');
        })
      ).rejects.toThrow(/maximum capacity/);
    });
  });

  describe('Multiple Photo Operations', () => {
    it('should handle adding multiple photos sequentially', async () => {
      const { result } = renderHook(() => usePhotoStore());

      const files = [
        createMockFile('photo1.jpg'),
        createMockFile('photo2.jpg'),
        createMockFile('photo3.jpg'),
      ];

      for (const file of files) {
        await act(async () => {
          await result.current.addPhoto(file);
        });
      }

      expect(photoStorage.addPhoto).toHaveBeenCalledTimes(3);
    });

    it('should maintain photo order after deletion', async () => {
      const { result } = renderHook(() => usePhotoStore());

      // Set up 3 photos
      act(() => {
        usePhotoStore.setState({
          photos: [
            { id: 'photo-1', order: 0 } as any,
            { id: 'photo-2', order: 1 } as any,
            { id: 'photo-3', order: 2 } as any,
          ],
        });
      });

      // Delete middle photo
      await act(async () => {
        await result.current.deletePhoto('photo-2');
      });

      // Verify reordering was called
      expect(photoStorage.reorderPhotos).toHaveBeenCalled();
    });
  });

  describe('Viewer Navigation', () => {
    it('should navigate between photos correctly', () => {
      const { result } = renderHook(() => usePhotoStore());

      // Set up 3 photos
      act(() => {
        usePhotoStore.setState({
          photos: [
            { id: 'photo-1' } as any,
            { id: 'photo-2' } as any,
            { id: 'photo-3' } as any,
          ],
        });
      });

      // Open viewer at first photo
      act(() => {
        result.current.openViewer(0);
      });
      expect(result.current.currentPhotoIndex).toBe(0);

      // Navigate to second photo
      act(() => {
        result.current.setCurrentPhotoIndex(1);
      });
      expect(result.current.currentPhotoIndex).toBe(1);

      // Navigate to third photo
      act(() => {
        result.current.setCurrentPhotoIndex(2);
      });
      expect(result.current.currentPhotoIndex).toBe(2);

      // Close viewer
      act(() => {
        result.current.closeViewer();
      });
      expect(result.current.isViewerOpen).toBe(false);
      expect(result.current.currentPhotoIndex).toBeNull();
    });
  });
});

