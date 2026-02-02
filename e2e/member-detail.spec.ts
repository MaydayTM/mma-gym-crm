import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Member Detail', () => {
  let memberId: string | null = null

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

    // Navigate to members page
    await page.goto('/members')
    await page.waitForLoadState('networkidle')

    // Check if members exist
    const tableVisible = await page.locator('table').isVisible().catch(() => false)
    if (!tableVisible) {
      test.skip() // Skip if no members available
    }

    // Click on first member to go to detail page
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/members\/[a-f0-9-]+/)

    // Extract member ID from URL
    const url = page.url()
    const match = url.match(/\/members\/([a-f0-9-]+)/)
    memberId = match ? match[1] : null
  })

  test('should display member profile info', async ({ page }) => {
    // Check back button
    await expect(page.locator('button:has-text("Terug naar leden")')).toBeVisible()

    // Check member name heading
    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toBeVisible()

    // Check status badge
    await expect(page.locator('span:has-text("active"), span:has-text("frozen"), span:has-text("cancelled")')).toBeVisible()

    // Check role is displayed
    await expect(page.locator('p:has-text("admin"), p:has-text("fighter"), p:has-text("coach"), p:has-text("medewerker")')).toBeVisible()

    // Check profile card sections
    await expect(page.getByText('Contact')).toBeVisible()
    await expect(page.getByText('Persoonlijk')).toBeVisible()
  })

  test('should show subscription section', async ({ page }) => {
    // Scroll to subscriptions section
    const subscriptionSection = page.getByRole('heading', { name: /Abonnementen/i })
    await subscriptionSection.scrollIntoViewIfNeeded()
    await expect(subscriptionSection).toBeVisible()

    // Check if subscriptions list or empty state is visible
    const hasSubscriptions = await page.locator('div:has-text("Geen abonnementen")').isVisible().catch(() => false)
    const hasSubscriptionsList = await page.locator('[class*="divide-y"]').filter({ hasText: /€|maand|jaar/i }).isVisible().catch(() => false)

    // Either subscription list or empty state should be visible
    expect(hasSubscriptions || hasSubscriptionsList).toBeTruthy()
  })

  test('should show check-in history section', async ({ page }) => {
    // Scroll to check-in section
    const checkinSection = page.getByRole('heading', { name: /Check-in historie/i })
    await checkinSection.scrollIntoViewIfNeeded()
    await expect(checkinSection).toBeVisible()

    // Check if check-ins list or empty state is visible
    const hasCheckins = await page.locator('div:has-text("Geen check-ins")').isVisible().catch(() => false)
    const hasCheckinsList = await page.locator('[class*="divide-y"]').filter({ hasText: /training|Handmatig|qr_code/i }).isVisible().catch(() => false)

    // Either check-in list or empty state should be visible
    expect(hasCheckins || hasCheckinsList).toBeTruthy()
  })

  test('should show belt tracking', async ({ page }) => {
    // Look for BeltProgressCard by checking for belt-related text
    const beltCard = page.locator('div:has-text("Gordels"), div:has-text("belt"), div:has-text("BJJ"), div:has-text("Judo")').first()

    // Belt card should be visible (may be empty state or have belt data)
    const isBeltCardVisible = await beltCard.isVisible().catch(() => false)

    // If belt card is not found, check for alternative structure
    const hasBeltSection = await page.locator('text=/gordel|belt|BJJ|Judo|Karate/i').isVisible().catch(() => false)

    // At least one belt-related element should be visible
    expect(isBeltCardVisible || hasBeltSection).toBeTruthy()
  })

  test('should show door access card', async ({ page }) => {
    // Look for DoorAccessCard component
    const doorAccessCard = page.locator('div:has-text("Toegang"), div:has-text("Door Access"), div:has-text("QR")').first()

    // Door access card should be visible
    const isDoorAccessVisible = await doorAccessCard.isVisible().catch(() => false)

    // Alternative: look for QR code or access-related text
    const hasAccessSection = await page.locator('text=/toegang|access|QR/i').isVisible().catch(() => false)

    // At least one door access element should be visible
    expect(isDoorAccessVisible || hasAccessSection).toBeTruthy()
  })

  test('should open edit member form', async ({ page }) => {
    // Find and click edit button
    const editButton = page.getByRole('button', { name: /Bewerken/i })
    await expect(editButton).toBeVisible()
    await editButton.click()

    // Wait for edit modal to appear
    await expect(page.getByText(/Lid bewerken/i)).toBeVisible()

    // Check form fields are present and pre-filled
    await expect(page.locator('input[name="first_name"]')).toBeVisible()
    await expect(page.locator('input[name="last_name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()

    // Verify fields have values (not empty)
    const firstName = await page.locator('input[name="first_name"]').inputValue()
    expect(firstName.length).toBeGreaterThan(0)
  })

  test('should edit member details', async ({ page }) => {
    // Open edit modal
    const editButton = page.getByRole('button', { name: /Bewerken/i })
    await editButton.click()
    await expect(page.getByText(/Lid bewerken/i)).toBeVisible()

    // Get current phone value
    const phoneInput = page.locator('input[name="phone"]')
    const currentPhone = await phoneInput.inputValue()

    // Generate new test phone number
    const timestamp = Date.now().toString().slice(-8)
    const newPhone = `+3247${timestamp}`

    // Change phone number
    await phoneInput.fill(newPhone)

    // Submit form
    const saveButton = page.getByRole('button', { name: /Opslaan|Bijwerken/i })
    await saveButton.click()

    // Wait for modal to close
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Lid bewerken/i)).not.toBeVisible()

    // Verify updated phone appears on page
    await expect(page.locator(`text=${newPhone}`)).toBeVisible()

    // Cleanup: Restore original phone value
    if (currentPhone !== newPhone) {
      await editButton.click()
      await expect(page.getByText(/Lid bewerken/i)).toBeVisible()
      await phoneInput.fill(currentPhone || '')
      await saveButton.click()
      await page.waitForTimeout(1000)
    }
  })

  test.skip('should delete member', () => {
    // Skipped: Member deletion is too destructive for shared test data
    // This test should only be run against dedicated test members
    // or in an isolated test database environment
  })
})
