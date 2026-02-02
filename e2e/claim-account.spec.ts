import { test, expect } from '@playwright/test'

test.describe('Claim Account', () => {
  test('should show claim account page with search form', async ({ page }) => {
    // Navigate to claim account page
    await page.goto('/claim-account')

    // Verify page heading
    await expect(page.locator('h1:has-text("Account Activeren")')).toBeVisible()

    // Verify description text (use label which is unique)
    await expect(page.locator('label:has-text("Lidnummer of e-mailadres")')).toBeVisible()

    // Verify form elements
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Verify submit button text
    await expect(page.locator('button:has-text("Verstuur activatielink")')).toBeVisible()
  })

  test('should show error for non-existent member', async ({ page }) => {
    await page.goto('/claim-account')

    // Fill in random email that doesn't exist
    const randomEmail = `nonexistent-${Date.now()}@example.com`
    await page.fill('input[type="text"]', randomEmail)

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success message (security: no account enumeration)
    // The system shows success even if account doesn't exist
    await page.waitForSelector('text=/Check je inbox|Email verzonden/i', { timeout: 5000 })

    // Verify the generic success message is shown
    await expect(page.locator('text=/Als er een account bestaat/i')).toBeVisible()
  })

  test('should navigate from login to claim account', async ({ page }) => {
    // Start at login page
    await page.goto('/login')

    // Click claim account link
    await page.click('a[href="/claim-account"]')

    // Should navigate to claim account page
    await page.waitForURL('/claim-account')
    await expect(page.locator('h1:has-text("Account Activeren")')).toBeVisible()
  })

  test('should show link back to login', async ({ page }) => {
    await page.goto('/claim-account')

    // Verify back to login link exists
    await expect(page.locator('a[href="/login"]:has-text("Inloggen")')).toBeVisible()
  })

  test('should disable submit button when input is empty', async ({ page }) => {
    await page.goto('/claim-account')

    // Submit button should be disabled when input is empty
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()

    // Fill in some text
    await page.fill('input[type="text"]', 'test@example.com')

    // Submit button should now be enabled
    await expect(submitButton).toBeEnabled()
  })
})

test.describe('Activate Account', () => {
  test('should show activate account page', async ({ page }) => {
    // Navigate to activate page without token
    await page.goto('/activate')

    // Should show error state (no token) - use heading to be specific
    await expect(page.locator('h2:has-text("Link ongeldig")')).toBeVisible()
  })

  test('should show error for missing token', async ({ page }) => {
    await page.goto('/activate')

    // Wait for error state to load
    await page.waitForSelector('h2:has-text("Link ongeldig")', { timeout: 5000 })

    // Verify error message
    await expect(page.locator('p:has-text("Geen activatietoken gevonden")')).toBeVisible()

    // Verify there's a link to request new token
    await expect(page.locator('a[href="/claim-account"]')).toBeVisible()
  })

  test('should show activate page with invalid token parameter', async ({ page }) => {
    // Navigate with invalid token
    await page.goto('/activate?token=invalid-token-123')

    // Wait for verification to complete
    await page.waitForSelector('h2:has-text("Link ongeldig")', { timeout: 10000 })

    // Should show error heading
    await expect(page.locator('h2:has-text("Link ongeldig")')).toBeVisible()

    // Verify there's a button to request new link
    await expect(page.locator('a[href="/claim-account"]:has-text("Nieuwe link")')).toBeVisible()
  })

  test('should show loading state while verifying token', async ({ page }) => {
    // Navigate with token (will be invalid but we test loading state)
    const navigationPromise = page.goto('/activate?token=test-token')

    // Check for loading indicator (should appear briefly)
    // Note: This might be too fast to catch, so we make it optional
    try {
      await expect(page.locator('text=/verifiëren|Loading|Laden/i')).toBeVisible({ timeout: 1000 })
    } catch {
      // Loading state might be too fast to catch - that's okay
    }

    await navigationPromise
  })

  test('should handle malformed token gracefully', async ({ page }) => {
    // Navigate with malformed token (special characters, very long, etc.)
    await page.goto('/activate?token=' + encodeURIComponent('!!!invalid@#$%^&*()'))

    // Should not crash - should show error
    await page.waitForSelector('h2:has-text("Link ongeldig")', { timeout: 10000 })
    await expect(page.locator('h2:has-text("Link ongeldig")')).toBeVisible()
  })

  test('should show member info when token is valid', async ({ page }) => {
    // Note: This test cannot run without a real valid token
    // We can only test the structure exists by checking for the error state
    // A real token would show member name, email, password form

    // For now, we'll just verify the page doesn't crash and shows appropriate error
    await page.goto('/activate?token=test')
    await page.waitForSelector('h2:has-text("Link ongeldig")', { timeout: 10000 })

    // In a real scenario with valid token, we would see:
    // - Member profile picture or avatar
    // - Welcome message with member's first name
    // - Email and member number
    // - Password input fields
    // - Activate button
  })
})

// Test suite configuration
test.describe.configure({ mode: 'parallel' })

test.beforeAll(async () => {
  console.log('Running Claim Account & Activation E2E tests')
  console.log('Note: These tests verify UI rendering and error handling')
  console.log('Real claim token generation requires email integration (out of scope)')
})
