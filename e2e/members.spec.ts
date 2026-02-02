import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured, createAdminClient } from './helpers/supabase'

test.describe('Members', () => {
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
  })

  test('should display members table', async ({ page }) => {
    // Wait for the page title
    await expect(page.getByRole('heading', { name: /Leden/i })).toBeVisible()

    // Check if table or empty state is visible
    const tableVisible = await page.locator('table').isVisible().catch(() => false)
    const emptyStateVisible = await page.getByText(/Geen leden gevonden/i).isVisible().catch(() => false)

    // Either table with rows or empty state should be visible
    expect(tableVisible || emptyStateVisible).toBeTruthy()

    // If table is visible, check for at least one row in tbody
    if (tableVisible) {
      const rows = await page.locator('tbody tr')
      const rowCount = await rows.count()
      expect(rowCount).toBeGreaterThan(0)

      // Check table headers are present
      await expect(page.getByText('Lid')).toBeVisible()
      await expect(page.getByText('Contact')).toBeVisible()
      await expect(page.getByText('Status')).toBeVisible()
    }
  })

  test('should search members by name', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leden/i })).toBeVisible()

    // Check if members exist
    const tableVisible = await page.locator('table').isVisible().catch(() => false)
    if (!tableVisible) {
      test.skip() // Skip if no members to search
    }

    // Get first member name before search
    const firstMemberName = await page.locator('tbody tr').first().locator('td').first().textContent()
    if (!firstMemberName) {
      test.skip()
    }

    // Extract first word for search
    const searchTerm = firstMemberName.trim().split(' ')[0]

    // Type in search input
    const searchInput = page.locator('input[placeholder*="Zoek"]')
    await searchInput.fill(searchTerm)
    await page.waitForTimeout(500) // Wait for filter to apply

    // Verify results contain search term
    const rows = await page.locator('tbody tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)

    // Check first result contains search term
    const firstResultText = await rows.first().textContent()
    expect(firstResultText?.toLowerCase()).toContain(searchTerm.toLowerCase())
  })

  test('should filter members by status', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leden/i })).toBeVisible()

    // Check if members exist
    const tableVisible = await page.locator('table').isVisible().catch(() => false)
    if (!tableVisible) {
      test.skip() // Skip if no members to filter
    }

    // Click filter button
    const filterButton = page.getByRole('button', { name: /Filters/i })
    if (await filterButton.isVisible()) {
      // Currently the filter button exists but doesn't have a dropdown
      // This test documents the expected behavior once filters are implemented
      test.skip() // Skip until filter dropdown is implemented
    }
  })

  test('should open add member modal', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leden/i })).toBeVisible()

    // Click "Nieuw Lid" button
    const addButton = page.getByRole('button', { name: /Nieuw Lid/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Wait for modal to appear
    await expect(page.getByText(/Nieuw Lid Toevoegen/i)).toBeVisible()

    // Check form fields are present
    await expect(page.locator('input[name="first_name"]')).toBeVisible()
    await expect(page.locator('input[name="last_name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('should create a new member', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now()
    const testMember = {
      firstName: 'E2ETest',
      lastName: `Member${timestamp}`,
      email: `test-${timestamp}@e2etest.com`,
      phone: '+32470123456',
    }

    // Open new member modal
    const addButton = page.getByRole('button', { name: /Nieuw Lid/i })
    await addButton.click()
    await expect(page.getByText(/Nieuw Lid Toevoegen/i)).toBeVisible()

    // Fill form
    await page.locator('input[name="first_name"]').fill(testMember.firstName)
    await page.locator('input[name="last_name"]').fill(testMember.lastName)
    await page.locator('input[name="email"]').fill(testMember.email)
    await page.locator('input[name="phone"]').fill(testMember.phone)

    // Submit form
    const submitButton = page.getByRole('button', { name: /Toevoegen|Opslaan/i })
    await submitButton.click()

    // Wait for modal to close and member to appear in table
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Nieuw Lid Toevoegen/i)).not.toBeVisible()

    // Search for new member
    const searchInput = page.locator('input[placeholder*="Zoek"]')
    await searchInput.fill(testMember.email)
    await page.waitForTimeout(500)

    // Verify member appears in results
    await expect(page.getByText(testMember.firstName)).toBeVisible()
    await expect(page.getByText(testMember.email)).toBeVisible()

    // Cleanup: Delete test member
    try {
      const adminClient = createAdminClient()
      const { data: members } = await adminClient
        .from('members')
        .select('id')
        .eq('email', testMember.email)
        .single()

      if (members?.id) {
        await adminClient
          .from('members')
          .delete()
          .eq('id', members.id)
      }
    } catch (error) {
      console.warn('Failed to cleanup test member:', error)
    }
  })

  test('should navigate to member detail', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leden/i })).toBeVisible()

    // Check if members exist
    const tableVisible = await page.locator('table').isVisible().catch(() => false)
    if (!tableVisible) {
      test.skip() // Skip if no members to click
    }

    // Get first member row
    const firstRow = page.locator('tbody tr').first()
    const memberName = await firstRow.locator('td').first().textContent()

    // Click on first member row
    await firstRow.click()

    // Wait for navigation to detail page
    await page.waitForURL(/\/members\/[a-f0-9-]+/)

    // Verify member detail page loaded
    await expect(page.locator('button:has-text("Terug naar leden")')).toBeVisible()

    // Verify member name appears on detail page
    if (memberName) {
      const nameText = memberName.trim().split('\n')[0] // Get first line (name)
      if (nameText) {
        await expect(page.getByRole('heading', { level: 1 })).toContainText(nameText)
      }
    }
  })
})
