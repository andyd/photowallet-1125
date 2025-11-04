#!/usr/bin/env python3
"""Quick debug script to check PhotoViewer layout"""

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page(viewport={"width": 1920, "height": 1080})

    print("📱 Opening PhotoWallet...")
    page.goto('http://localhost:5001')
    page.wait_for_load_state('networkidle')

    # Take initial screenshot
    page.screenshot(path='/tmp/photowallet-home.png', full_page=True)
    print("✅ Home screenshot: /tmp/photowallet-home.png")

    # Try to find and click a photo
    photos = page.locator('[data-testid="card-photo"]').all()
    print(f"📸 Found {len(photos)} photos")

    if len(photos) > 0:
        print("🔍 Opening first photo...")
        photos[0].click()
        page.wait_for_timeout(1000)

        # Take viewer screenshot
        page.screenshot(path='/tmp/photowallet-viewer.png', full_page=True)
        print("✅ Viewer screenshot: /tmp/photowallet-viewer.png")

        # Check for navigation arrows
        prev_arrow = page.locator('[aria-label="Previous photo"]')
        next_arrow = page.locator('[aria-label="Next photo"]')

        if prev_arrow.is_visible():
            box = prev_arrow.bounding_box()
            print(f"⬅️  Previous arrow at: x={box['x']}, y={box['y']}")

        if next_arrow.is_visible():
            box = next_arrow.bounding_box()
            print(f"➡️  Next arrow at: x={box['x']}, y={box['y']}")

        # Get image element
        img = page.locator('[data-testid="img-viewer-photo"]')
        if img.is_visible():
            box = img.bounding_box()
            print(f"🖼️  Image at: x={box['x']}, y={box['y']}, width={box['width']}, height={box['height']}")

        time.sleep(3)
    else:
        print("⚠️  No photos found - upload some first!")
        time.sleep(2)

    browser.close()
    print("\n✅ Screenshots saved to /tmp/")
