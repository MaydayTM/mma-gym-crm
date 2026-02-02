import { Page } from '@playwright/test'

/**
 * Login helper - fills the login form and waits for dashboard navigation
 */
export async function login(page: Page, email: string, password: string) {
  // Navigate to login page
  await page.goto('/login')

  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]')

  // Fill in credentials
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for navigation to dashboard (URL changes to /)
  await page.waitForURL('/', { timeout: 10000 })

  // Wait for dashboard content to be visible
  await page.waitForSelector('text=Dashboard', { timeout: 10000 })
}

/**
 * Logout helper - clicks user menu and logout button
 */
export async function logout(page: Page) {
  // Click user menu button (top right profile button)
  // The button has data-user-menu or similar, but we can use text selector
  await page.click('[data-test-id="user-menu-button"], button:has-text("Account")').catch(async () => {
    // Fallback: try clicking the profile/avatar button
    await page.click('button[aria-label="User menu"]').catch(async () => {
      // Last fallback: use generic selector for button in top-right area
      // Look for logout button directly if menu is already open
      await page.click('button:has-text("Uitloggen"), button:has-text("Logout")')
    })
  })

  // Wait for dropdown menu to appear
  await page.waitForTimeout(500)

  // Click logout button
  await page.click('button:has-text("Uitloggen"), button:has-text("Logout")')

  // Wait for redirect to login page
  await page.waitForURL('/login', { timeout: 5000 })
}

/**
 * Assert that user has been redirected to login page
 */
export async function expectRedirectToLogin(page: Page) {
  await page.waitForURL('/login', { timeout: 5000 })
}
