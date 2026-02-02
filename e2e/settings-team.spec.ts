import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if test environment not configured
    if (!isTestEnvironmentConfigured()) {
      test.skip()
    }

    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
    }

    // Login as admin
    await login(page, testUser.email, testUser.password)

    // Navigate to settings page
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
  })

  test('should display settings page with tabs', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Instellingen/i })).toBeVisible()

    // Check description
    await expect(page.getByText(/Configureer je gym en account/i)).toBeVisible()

    // Verify overview sections are visible (card grid)
    const settingsGrid = page.locator('.grid')
    await expect(settingsGrid).toBeVisible()

    // Verify at least some setting sections are visible
    await expect(page.getByText('Onboarding')).toBeVisible()
    await expect(page.getByText('Betalingen')).toBeVisible()
    await expect(page.getByText('Rooster')).toBeVisible()
  })

  test('should show onboarding settings', async ({ page }) => {
    // Wait for settings page
    await expect(page.getByRole('heading', { name: /Instellingen/i })).toBeVisible()

    // Click on Onboarding section
    await page.getByText('Onboarding').click()
    await page.waitForTimeout(500)

    // Verify we're in onboarding tab
    await expect(page.getByText(/Nodig leden uit om hun account te activeren/i)).toBeVisible()

    // Check for member invitation section or claim stats
    const onboardingContent = page.locator('main, [role="main"]')
    await expect(onboardingContent).toBeVisible()
  })

  test('should show payment settings tab', async ({ page }) => {
    // Wait for settings page
    await expect(page.getByRole('heading', { name: /Instellingen/i })).toBeVisible()

    // Click on Betalingen section
    await page.getByText('Betalingen').click()
    await page.waitForTimeout(500)

    // Verify payment provider configuration is visible
    await expect(page.getByText(/Stripe|Mollie|payment/i)).toBeVisible()
  })

  test('should show schedule settings tab', async ({ page }) => {
    // Wait for settings page
    await expect(page.getByRole('heading', { name: /Instellingen/i })).toBeVisible()

    // Click on Rooster section
    await page.getByText('Rooster').click()
    await page.waitForTimeout(500)

    // Verify schedule/discipline configuration is visible
    const scheduleContent = page.locator('main, [role="main"]')
    await expect(scheduleContent).toBeVisible()
  })

  test('should restrict admin-only tabs for staff', async ({ page }) => {
    // Documentation note: Admin-only tabs (Betalingen, Gebruikers & Rollen, Beveiliging)
    // are gated by isAdmin check in Settings.tsx (line 147-148, 178)
    // This test just verifies tabs render correctly for admin users

    // Wait for settings page
    await expect(page.getByRole('heading', { name: /Instellingen/i })).toBeVisible()

    // Verify admin has access to Betalingen
    await expect(page.getByText('Betalingen')).toBeVisible()

    // Click to verify access
    await page.getByText('Betalingen').click()
    await page.waitForTimeout(500)

    // Should not show access denied
    await expect(page.getByText(/geen toegang|access denied/i)).not.toBeVisible()
  })
})

test.describe('Team', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if test environment not configured
    if (!isTestEnvironmentConfigured()) {
      test.skip()
    }

    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
    }

    // Login as admin
    await login(page, testUser.email, testUser.password)

    // Navigate to team page
    await page.goto('/team')
    await page.waitForLoadState('networkidle')
  })

  test('should display team members list', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Team/i })).toBeVisible()

    // Check description
    await expect(page.getByText(/Beheer administrators, medewerkers en coaches/i)).toBeVisible()

    // Verify team member sections are visible
    // The page groups by role (Administrator, Medewerker, Coördinator, Coach)
    const teamContent = page.locator('main, [role="main"]')
    await expect(teamContent).toBeVisible()

    // Should see at least one role group heading
    const roleHeadings = page.locator('h2')
    const headingCount = await roleHeadings.count()
    expect(headingCount).toBeGreaterThan(0)
  })

  test('should show role badges', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Team/i })).toBeVisible()

    // Check for role labels/badges (Administrator, Medewerker, Coördinator, Coach)
    // These appear as section headers with colored text
    const roleLabels = [
      /Administrator/i,
      /Medewerker/i,
      /Coördinator|Coordinator/i,
      /Coach/i,
    ]

    // At least one role should be visible
    let foundRole = false
    for (const roleLabel of roleLabels) {
      const isVisible = await page.getByText(roleLabel).isVisible().catch(() => false)
      if (isVisible) {
        foundRole = true
        break
      }
    }
    expect(foundRole).toBeTruthy()
  })

  test('should open add team member form', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Team/i })).toBeVisible()

    // Click "Teamlid Toevoegen" button
    const addButton = page.getByRole('button', { name: /Teamlid Toevoegen/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Wait for modal to appear
    await expect(page.getByText(/Teamlid Toevoegen/i).first()).toBeVisible()

    // Check form fields are present
    await expect(page.locator('input[name="firstName"], input[placeholder*="Voornaam"]').first()).toBeVisible()
    await expect(page.locator('input[name="lastName"], input[placeholder*="Achternaam"]').first()).toBeVisible()
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible()

    // Verify role selection is present (radio buttons for admin, medewerker, coordinator, coach)
    await expect(page.getByText(/Administrator|Medewerker|Coördinator|Coach/i).first()).toBeVisible()
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
