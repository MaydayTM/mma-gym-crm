import { test, expect } from '@playwright/test'
import { login, logout, expectRedirectToLogin } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test at the login page
    await page.goto('/login')
  })

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access the dashboard without being logged in
    await page.goto('/')

    // Should redirect to login page
    await expectRedirectToLogin(page)
  })

  test('should show login page with email and password fields', async ({ page }) => {
    // Verify login form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Verify branding (use heading role to be specific)
    await expect(page.locator('h1:has-text("Roster")')).toBeVisible()
    await expect(page.locator('text=Reconnect Academy')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for error message to appear
    await page.waitForSelector('text=/Invalid login credentials|Ongeldige inloggegevens/i', {
      timeout: 5000,
    })

    // Should still be on login page
    expect(page.url()).toContain('/login')
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    const testUser = getTestUser()

    if (!testUser) {
      test.skip()
      return
    }

    // Use the login helper
    await login(page, testUser.email, testUser.password)

    // Verify we're on the dashboard
    expect(page.url()).not.toContain('/login')
    await expect(page.locator('text=Dashboard')).toBeVisible()

    // Verify dashboard elements are present (KPI cards, navigation, etc.)
    // Look for typical dashboard elements
    const dashboardContent = page.locator('main, [role="main"]')
    await expect(dashboardContent).toBeVisible()
  })

  test('should logout and redirect to login', async ({ page }) => {
    const testUser = getTestUser()

    if (!testUser) {
      test.skip()
      return
    }

    // Login first
    await login(page, testUser.email, testUser.password)

    // Verify we're logged in
    await expect(page.locator('text=Dashboard')).toBeVisible()

    // Logout using helper
    await logout(page)

    // Should be back at login page
    await expectRedirectToLogin(page)
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should show forgot password page', async ({ page }) => {
    // Navigate to forgot password
    await page.goto('/forgot-password')

    // Verify forgot password form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Verify page heading
    await expect(page.locator('text=/Wachtwoord vergeten|Forgot Password/i')).toBeVisible()
  })

  test('should navigate between login and forgot-password', async ({ page }) => {
    // Start at login page
    await expect(page.locator('h1:has-text("Roster")')).toBeVisible()

    // Click "Wachtwoord vergeten?" link
    await page.click('text=/Wachtwoord vergeten|Forgot.*password/i')

    // Should navigate to forgot-password page
    await page.waitForURL('/forgot-password')
    await expect(page.locator('text=/Wachtwoord vergeten|Forgot Password/i')).toBeVisible()

    // Navigate back to login (there should be a back link)
    await page.click('a[href="/login"]:has-text("Terug naar login")')

    // Should be back at login
    await page.waitForURL('/login')
    await expect(page.locator('h1:has-text("Roster")')).toBeVisible()
  })

  test('should show Google sign-in button', async ({ page }) => {
    // Verify Google OAuth button is present
    await expect(page.locator('button:has-text("Google"), button:has-text("Doorgaan met Google")')).toBeVisible()
  })

  test('should show claim account link', async ({ page }) => {
    // Verify claim account link is present
    await expect(page.locator('a[href="/claim-account"]')).toBeVisible()
    await expect(page.locator('text=/Activeer je account|Claim account/i')).toBeVisible()
  })
})

// Test suite info
test.describe.configure({ mode: 'parallel' })

test.beforeAll(async () => {
  if (!isTestEnvironmentConfigured()) {
    console.warn('⚠️  Test environment not fully configured')
    console.warn('   Some tests will be skipped')
    console.warn('   See .env.test.example for setup instructions')
  }
})
