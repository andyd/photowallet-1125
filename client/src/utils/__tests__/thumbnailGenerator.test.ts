import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateThumbnail, generateThumbnails } from '../thumbnailGenerator';

describe('thumbnailGenerator', () => {
  let mockFile: File;
  let mockCanvas: any;
  let mockContext: any;
  let mockImage: any;

  beforeEach(() => {
    // Create a mock file
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock canvas context
    mockContext = {
      drawImage: vi.fn(),
    };

    // Mock canvas element
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toBlob: vi.fn((callback) => {
        const blob = new Blob(['thumbnail'], { type: 'image/jpeg' });
        callback(blob);
      }),
    };

    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return document.createElement(tagName);
    });

    // Mock Image constructor to return a fresh instance per call
    global.Image = vi.fn().mockImplementation(() => {
      const instance: any = {
        width: 800,
        height: 600,
        src: '',
        onload: null,
        onerror: null,
      };
      return instance;
    }) as any;
    // Keep a reference for single-file tests
    mockImage = new (global.Image as any)();

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  describe('generateThumbnail', () => {
    it('should generate a thumbnail from a file', async () => {
      const promise = generateThumbnail(mockFile);
      // Simulate image load on this instance
      const lastCall = (global.Image as unknown as vi.Mock).mock.results.at(-1)?.value;
      if (lastCall && lastCall.onload) {
        lastCall.onload();
      }

      const result = await promise;

      expect(result).toBeInstanceOf(Blob);
      expect(mockCanvas.width).toBe(400);
      expect(mockCanvas.height).toBe(400);
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should center-crop square thumbnails from landscape images', async () => {
      mockImage.width = 800;
      mockImage.height = 600;

      const promise = generateThumbnail(mockFile);
      const lastCall = (global.Image as unknown as vi.Mock).mock.results.at(-1)?.value;
      if (lastCall && lastCall.onload) {
        lastCall.onload();
      }

      await promise;

      // Should crop from center of landscape image
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        100, // sourceX: (800 - 600) / 2
        0,   // sourceY: (600 - 600) / 2
        600, // sourceSize: Math.min(800, 600)
        600,
        0,
        0,
        400,
        400
      );
    });

    it('should center-crop square thumbnails from portrait images', async () => {
      mockImage.width = 600;
      mockImage.height = 800;

      const promise = generateThumbnail(mockFile);
      const lastCall = (global.Image as unknown as vi.Mock).mock.results.at(-1)?.value;
      if (lastCall && lastCall.onload) {
        lastCall.onload();
      }

      await promise;

      // Should crop from center of portrait image
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImage,
        0,   // sourceX: (600 - 600) / 2
        100, // sourceY: (800 - 600) / 2
        600, // sourceSize: Math.min(600, 800)
        600,
        0,
        0,
        400,
        400
      );
    });

    it('should reject if canvas context is not available', async () => {
      mockCanvas.getContext = vi.fn(() => null);

      await expect(generateThumbnail(mockFile)).rejects.toThrow(
        'Failed to get canvas context'
      );
    });

    it('should reject if image fails to load', async () => {
      const promise = generateThumbnail(mockFile);

      // Simulate image error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(promise).rejects.toThrow('Failed to load image');
    });

    it('should reject if blob generation fails', async () => {
      mockCanvas.toBlob = vi.fn((callback) => {
        callback(null);
      });

      const promise = generateThumbnail(mockFile);

      if (mockImage.onload) {
        mockImage.onload();
      }

      await expect(promise).rejects.toThrow('Failed to generate thumbnail blob');
    });

    it('should clean up object URL after processing', async () => {
      const promise = generateThumbnail(mockFile);

      if (mockImage.onload) {
        mockImage.onload();
      }

      await promise;

      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('generateThumbnails', () => {
    it('should generate thumbnails for multiple files', async () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        new File(['test3'], 'test3.jpg', { type: 'image/jpeg' }),
      ];

      const promise = generateThumbnails(files);

      // Simulate each image loading independently
      setTimeout(() => {
        const calls = (global.Image as unknown as vi.Mock).mock.results;
        calls.forEach((res) => {
          const inst: any = res.value;
          inst?.onload && inst.onload();
        });
      }, 0);

      const results = await promise;

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeInstanceOf(Blob);
      });
    });

    it('should handle empty array', async () => {
      const results = await generateThumbnails([]);
      expect(results).toHaveLength(0);
    });
  });
});

