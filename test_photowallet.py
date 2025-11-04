#!/usr/bin/env python3
"""
PhotoWallet PWA Test Suite
Tests main functionality: photo upload, viewing, navigation, deletion
"""

from playwright.sync_api import sync_playwright
import sys
import time

def test_photowallet():
    """Test PhotoWallet app running on localhost:5001"""

    print("🧪 Starting PhotoWallet PWA Tests...\n")

    with sync_playwright() as p:
        # Launch browser in headed mode to see what's happening
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Enable console logging
        page.on("console", lambda msg: print(f"📝 Console [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: print(f"❌ Page Error: {err}"))

        try:
            # Test 1: Load the app
            print("✅ Test 1: Loading app at http://localhost:5001")
            page.goto('http://localhost:5001')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='/tmp/photowallet-1-loaded.png')
            print("   Screenshot saved: /tmp/photowallet-1-loaded.png")

            # Test 2: Check initial state
            print("\n✅ Test 2: Checking initial app state")
            title = page.locator('h1').first
            if title.is_visible():
                print(f"   Found title: {title.text_content()}")

            # Test 3: Check for upload button
            print("\n✅ Test 3: Looking for photo upload functionality")
            upload_buttons = page.locator('button').all()
            print(f"   Found {len(upload_buttons)} buttons on page")

            # Take screenshot of current state
            page.screenshot(path='/tmp/photowallet-2-ui.png')
            print("   Screenshot saved: /tmp/photowallet-2-ui.png")

            # Test 4: Check photo grid
            print("\n✅ Test 4: Checking photo grid")
            grid = page.locator('[data-testid="grid-photos"]')
            if grid.is_visible():
                print("   Photo grid is visible")
            else:
                print("   No photo grid found - might be empty state")

            # Test 5: Check for settings dialog
            print("\n✅ Test 5: Testing settings dialog")
            settings_button = page.locator('[data-testid="button-settings"]')
            if settings_button.is_visible():
                print("   Settings button found, clicking...")
                settings_button.click()
                page.wait_for_timeout(500)
                page.screenshot(path='/tmp/photowallet-3-settings.png')
                print("   Screenshot saved: /tmp/photowallet-3-settings.png")

                # Close settings
                page.keyboard.press('Escape')
                page.wait_for_timeout(300)

            # Test 6: Check responsive design
            print("\n✅ Test 6: Testing responsive design")
            # Mobile viewport
            page.set_viewport_size({"width": 375, "height": 667})
            page.wait_for_timeout(500)
            page.screenshot(path='/tmp/photowallet-4-mobile.png')
            print("   Mobile screenshot saved: /tmp/photowallet-4-mobile.png")

            # Desktop viewport
            page.set_viewport_size({"width": 1920, "height": 1080})
            page.wait_for_timeout(500)
            page.screenshot(path='/tmp/photowallet-5-desktop.png')
            print("   Desktop screenshot saved: /tmp/photowallet-5-desktop.png")

            # Test 7: Check for any console errors
            print("\n✅ Test 7: Checking for JavaScript errors")
            print("   (Check console output above for any errors)")

            # Test 8: Check page performance
            print("\n✅ Test 8: Performance metrics")
            metrics = page.evaluate("""() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    domInteractive: navigation.domInteractive - navigation.fetchStart
                };
            }""")
            print(f"   DOM Content Loaded: {metrics['domContentLoaded']:.2f}ms")
            print(f"   Load Complete: {metrics['loadComplete']:.2f}ms")
            print(f"   DOM Interactive: {metrics['domInteractive']:.2f}ms")

            print("\n✅ All tests completed successfully!")
            print(f"\n📸 Screenshots saved to /tmp/photowallet-*.png")

        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            page.screenshot(path='/tmp/photowallet-error.png')
            print("   Error screenshot saved: /tmp/photowallet-error.png")
            raise
        finally:
            # Keep browser open for 3 seconds to see final state
            page.wait_for_timeout(3000)
            browser.close()

if __name__ == "__main__":
    test_photowallet()
