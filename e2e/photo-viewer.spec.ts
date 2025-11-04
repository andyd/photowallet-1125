import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Create a simple test image (1x1 red pixel PNG)
const createTestImage = (): Buffer => {
  // Simple 1x1 red pixel PNG in base64
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  return Buffer.from(base64Data, 'base64');
};

test.describe('Photo Viewer', () => {
  test('uploads photo and opens viewer when photo is clicked', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForLoadState('networkidle');
    
    // Dismiss welcome screen if present
    const welcomeButton = page.getByTestId('button-get-started');
    if (await welcomeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Check if we're on empty state or have photos
    const emptyState = page.getByTestId('container-empty-state');
    const isEmptyState = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log('Empty state visible:', isEmptyState);
    
    // Create and save test image to temp file
    const testImagePath = path.join(process.cwd(), 'test-photo.png');
    fs.writeFileSync(testImagePath, createTestImage());
    
    try {
      // Find and interact with file input
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for photo to be added
      await page.waitForTimeout(1000);
      
      // Check if photo grid is now visible
      const photoGrid = page.getByTestId('container-photo-grid');
      await expect(photoGrid).toBeVisible({ timeout: 5000 });
      
      // Find the first photo card
      const photoCards = page.locator('[data-testid^="card-photo-"]');
      const firstCard = photoCards.first();
      
      console.log('Photo card count:', await photoCards.count());
      await expect(firstCard).toBeVisible();
      
      // Take screenshot before clicking
      await page.screenshot({ path: 'before-click.png', fullPage: true });
      
      // Click the photo to open viewer
      await firstCard.click();
      
      // Wait a bit for animations
      await page.waitForTimeout(500);
      
      // Take screenshot after clicking
      await page.screenshot({ path: 'after-click.png', fullPage: true });
      
      // Check if viewer container is visible
      const viewerContainer = page.getByTestId('container-photo-viewer');
      const isViewerVisible = await viewerContainer.isVisible({ timeout: 2000 }).catch(() => false);
      console.log('Viewer visible:', isViewerVisible);
      
      if (!isViewerVisible) {
        // Log the current state
        const body = await page.innerHTML('body');
        console.log('Body HTML length:', body.length);
        console.log('Viewer container exists:', await viewerContainer.count() > 0);
      }
      
      // Assert viewer is visible
      await expect(viewerContainer).toBeVisible();
      
      // Check if image is actually rendered in viewer
      const viewerImage = page.getByTestId('img-viewer-photo');
      await expect(viewerImage).toBeVisible({ timeout: 3000 });
      
      // Verify image has src attribute
      const imageSrc = await viewerImage.getAttribute('src');
      console.log('Image src:', imageSrc?.substring(0, 50));
      expect(imageSrc).toBeTruthy();
      expect(imageSrc).toMatch(/^blob:/);
      
      console.log('✓ Photo viewer test passed!');
      
    } finally {
      // Cleanup
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
  });
});
