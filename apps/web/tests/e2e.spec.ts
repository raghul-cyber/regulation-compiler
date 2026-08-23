import { test, expect } from '@playwright/test';

test.describe('Phase 6 & 7 Verification', () => {
  test('Coverage globe renders and matches jurisdiction count', async ({ page }) => {
    // Intercept the server action / API call for regulations
    await page.route('**/api/v1/regulations*', async route => {
      const json = {
        data: [
          { id: '1', jurisdiction: 'EU' },
          { id: '2', jurisdiction: 'US' },
          { id: '3', jurisdiction: 'Global' }
        ]
      };
      await route.fulfill({ json });
    });

    // In a real authenticated scenario, we would use a signed-in state or bypass clerk
    // Assuming the test environment allows bypassing or mock session
    await page.goto('/dashboard');

    // Wait for the 3D Engine to load (lazy loaded next/dynamic)
    await expect(page.locator('text=Initializing 3D WebGL Engine...')).toBeVisible({ timeout: 5000 });
    
    // The globe is rendered in a canvas
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
    
    // Check if the jurisdiction count is rendered in the UI list
    // Based on Phase 7, the Active Regions panel should list them
    await expect(page.locator('text=Active Regions (3)')).toBeVisible();
    await expect(page.locator('text=EU')).toBeVisible();
    await expect(page.locator('text=US')).toBeVisible();
    await expect(page.locator('text=GLOBAL')).toBeVisible();
  });

  test('Zero console errors across click-through', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('requestfailed', request => {
      errors.push(`Request failed: ${request.url()}`);
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/regulations');
    await page.waitForLoadState('networkidle');

    await page.goto('/regulations/upload');
    await page.waitForLoadState('networkidle');

    // Assert that the array of errors is empty
    expect(errors.length).toBe(0);
  });
});
