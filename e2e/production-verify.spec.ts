import { test, expect } from '@playwright/test';

test.describe('Production Site Verification', () => {
  test('verify homepage redirects to /login with clean console', async ({ page }) => {
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const debugLogs: string[] = [];
    const networkErrors: string[] = [];

    // Capture all console output
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      consoleLogs.push(`[${type}] ${text}`);

      if (type === 'error') consoleErrors.push(text);
      if (type === 'warning') consoleWarnings.push(text);

      // Check for debug logs with [Auth] prefix
      if (text.includes('[Auth]')) {
        debugLogs.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });

    // Capture failed network requests (404s on CSS/JS)
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('.css') || url.includes('.js') || url.includes('.svg')) {
          networkErrors.push(`${response.status()} - ${url}`);
        }
      }
    });

    console.log('\n=== TEST 1: Homepage Redirect to /login ===');

    // Navigate to homepage
    await page.goto('https://crm.mmagym.be', { waitUntil: 'networkidle' });

    // Wait a bit for any async operations
    await page.waitForTimeout(2000);

    // Take screenshot of login page
    await page.screenshot({
      path: 'test-results/production-1-login.png',
      fullPage: true
    });

    // Verify redirect to /login
    expect(page.url()).toContain('/login');
    console.log(`✓ Redirected to: ${page.url()}`);

    // Check page title or login form exists
    const loginFormExists = await page.locator('form').count() > 0;
    expect(loginFormExists).toBe(true);
    console.log('✓ Login form rendered');

    // Output all console logs
    console.log('\n=== CONSOLE LOGS ===');
    if (consoleLogs.length === 0) {
      console.log('(No console output - perfect!)');
    } else {
      consoleLogs.forEach(log => console.log(log));
    }

    // Check for debug logs
    console.log('\n=== DEBUG LOGS CHECK ===');
    if (debugLogs.length > 0) {
      console.log(`❌ FOUND ${debugLogs.length} DEBUG LOGS WITH [Auth] PREFIX:`);
      debugLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✓ No [Auth] debug logs found');
    }

    // Check for errors
    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length > 0) {
      console.log(`Found ${consoleErrors.length} errors:`);
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✓ No console errors');
    }

    // Check for warnings
    console.log('\n=== CONSOLE WARNINGS ===');
    if (consoleWarnings.length > 0) {
      console.log(`Found ${consoleWarnings.length} warnings:`);
      consoleWarnings.forEach(warn => console.log(`  - ${warn}`));
    } else {
      console.log('✓ No console warnings');
    }

    // Check for network errors
    console.log('\n=== NETWORK ERRORS (404s) ===');
    if (networkErrors.length > 0) {
      console.log(`❌ Found ${networkErrors.length} failed asset requests:`);
      networkErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✓ No 404 errors on CSS/JS assets');
    }

    // Assertions - these will fail the test if violated
    expect(debugLogs.length).toBe(0); // No [Auth] debug logs
    expect(consoleErrors.filter(e => !e.includes('favicon')).length).toBe(0); // No errors (except favicon)
    expect(networkErrors.length).toBe(0); // No 404s on assets
  });

  test('verify /claim-account page renders correctly', async ({ page }) => {
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const debugLogs: string[] = [];

    // Capture console output
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();

      consoleLogs.push(`[${type}] ${text}`);

      if (type === 'error') consoleErrors.push(text);
      if (text.includes('[Auth]')) debugLogs.push(text);
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });

    console.log('\n=== TEST 2: /claim-account Page ===');

    // Navigate directly to claim-account
    await page.goto('https://crm.mmagym.be/claim-account', { waitUntil: 'networkidle' });

    // Wait for page to settle
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/production-2-claim-account.png',
      fullPage: true
    });

    // Verify page title/heading
    const heading = page.locator('h1, h2').first();
    const headingText = await heading.textContent();
    console.log(`Page heading: ${headingText}`);
    expect(headingText).toContain('Account Activeren');

    // Verify form exists
    const formExists = await page.locator('form').count() > 0;
    expect(formExists).toBe(true);
    console.log('✓ Claim account form rendered');

    // Output console logs
    console.log('\n=== CONSOLE LOGS ===');
    if (consoleLogs.length === 0) {
      console.log('(No console output)');
    } else {
      consoleLogs.forEach(log => console.log(log));
    }

    // Check for debug logs
    console.log('\n=== DEBUG LOGS CHECK ===');
    if (debugLogs.length > 0) {
      console.log(`❌ FOUND ${debugLogs.length} DEBUG LOGS:`);
      debugLogs.forEach(log => console.log(`  - ${log}`));
    } else {
      console.log('✓ No [Auth] debug logs found');
    }

    // Check for errors
    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length > 0) {
      console.log(`Found ${consoleErrors.length} errors:`);
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✓ No console errors');
    }

    // Assertions
    expect(debugLogs.length).toBe(0);
    expect(consoleErrors.filter(e => !e.includes('favicon')).length).toBe(0);
  });
});
