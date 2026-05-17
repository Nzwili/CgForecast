import { test, expect } from '@playwright/test';

test('Full Pastor Login Workflow', async ({ page }) => {
  // 1. Go to the login page
  await page.goto('http://localhost:5173/');

  // 2. Perform login
  await page.fill('input[type="email"]', 'samuel@church.org');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button:has-text("Sign In")');

  // 3. Verify Dashboard loads
  // We look for the greeting "Good day"
  await expect(page.locator('.page-title')).toContainText('Good day');
  
  // 4. Verify Navbar shows "AI Forecast"
  await expect(page.locator('.sidebar-nav')).toContainText('AI Forecast');
});

test('Full Analyst Login Workflow', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Perform Analyst login
  await page.fill('input[type="email"]', 'victor@church.org');
  await page.fill('input[type="password"]', 'demo123');
  await page.click('button:has-text("Sign In")');

  // Verify Analyst routes to Model Metrics automatically (as per Section 4.5.1)
  await expect(page.getByText(/Model Performance/i)).toBeVisible({ timeout: 15000 });
  
  // Verify Analyst can see the SVR Model Health section
  await expect(page.getByText(/SVR Model Health/i)).toBeVisible({ timeout: 15000 });
});
