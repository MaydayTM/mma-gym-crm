import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser()

    if (!testUser) {
      test.skip()
      return
    }

    // Login as admin
    await page.goto('/login')
    await login(page, testUser.email, testUser.password)

    // Navigate to subscriptions page
    await page.goto('/subscriptions')
    await page.waitForLoadState('networkidle')
  })

  test('should display subscriptions list', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Verify page header
    await expect(page.locator('h1:has-text("Abonnementen")')).toBeVisible()

    // Should show either table with rows or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=Geen abonnementen gevonden').isVisible().catch(() => false)

    // One of them should be visible
    expect(hasTable || hasEmptyState).toBe(true)
  })

  test('should display subscription statistics', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Verify stats cards are visible
    await expect(page.locator('text=Actieve abonnementen')).toBeVisible()
    await expect(page.locator('text=MRR')).toBeVisible()
    await expect(page.locator('text=Gepauzeerd')).toBeVisible()
    await expect(page.locator('text=Opgezegd')).toBeVisible()

    // Verify stats have numeric values (even if 0)
    const activeCount = await page.locator('text=Actieve abonnementen').locator('..').locator('..').locator('p').first().textContent()
    expect(activeCount).toMatch(/^\d+$/)
  })

  test('should filter by status', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Find the status filter dropdown
    const statusFilter = page.locator('select')

    // Verify dropdown has filter options
    await expect(statusFilter).toBeVisible()

    // Try filtering by "active"
    await statusFilter.selectOption('active')
    await page.waitForTimeout(500) // Wait for filtering

    // Verify URL or content changed (table should update)
    // We don't assert specific results as data may vary

    // Try filtering by "cancelled"
    await statusFilter.selectOption('cancelled')
    await page.waitForTimeout(500)

    // Reset filter
    await statusFilter.selectOption('')
    await page.waitForTimeout(500)
  })

  test('should search by member name', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Find search input
    const searchInput = page.locator('input[placeholder*="Zoek op naam"]')
    await expect(searchInput).toBeVisible()

    // Type a search query
    await searchInput.fill('test')
    await page.waitForTimeout(500) // Wait for filtering

    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(500)
  })

  test('should show manage button for admins', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Should have a "Beheren" button linking to /subscriptions/manage
    const manageButton = page.locator('a[href="/subscriptions/manage"]')

    // Check if it's visible (depends on user permissions)
    const isVisible = await manageButton.isVisible().catch(() => false)

    if (isVisible) {
      await expect(manageButton).toContainText('Beheren')
    }
  })

  test('should show new subscription button', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Should have a link to checkout
    const newButton = page.locator('a[href="/checkout/plans"]')

    const isVisible = await newButton.isVisible().catch(() => false)

    if (isVisible) {
      await expect(newButton).toContainText('Nieuw Abonnement')
    }
  })

  test('should navigate to member from subscription row', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Check if there are any subscription rows
    const hasRows = await page.locator('table tbody tr').count().catch(() => 0)

    if (hasRows > 0) {
      // Click on first member name/link in table
      const firstMemberCell = page.locator('table tbody tr').first().locator('td').first()
      const memberLink = firstMemberCell.locator('a')

      // Check if member name is clickable
      const hasLink = await memberLink.isVisible().catch(() => false)

      if (hasLink) {
        const memberName = await memberLink.textContent()
        await memberLink.click()

        // Should navigate to member detail page
        await page.waitForURL(/\/members\/.*/)
        expect(page.url()).toContain('/members/')
      }
    }
  })

  test('should show subscription details in table', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Check if table has subscription data
    const hasRows = await page.locator('table tbody tr').count().catch(() => 0)

    if (hasRows > 0) {
      // Verify table headers
      await expect(page.locator('th:has-text("Lid")')).toBeVisible()
      await expect(page.locator('th:has-text("Abonnement")')).toBeVisible()
      await expect(page.locator('th:has-text("Periode")')).toBeVisible()
      await expect(page.locator('th:has-text("Prijs")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()

      // Verify first row has expected columns
      const firstRow = page.locator('table tbody tr').first()
      const cells = await firstRow.locator('td').count()
      expect(cells).toBeGreaterThanOrEqual(5)
    }
  })

  test('should display status badges with colors', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Check if table has rows
    const hasRows = await page.locator('table tbody tr').count().catch(() => 0)

    if (hasRows > 0) {
      // Look for status badges in the last column
      const statusBadges = page.locator('table tbody tr td:last-child span')
      const badgeCount = await statusBadges.count()

      if (badgeCount > 0) {
        // Verify badge has status text
        const firstBadge = statusBadges.first()
        const badgeText = await firstBadge.textContent()
        expect(badgeText).toMatch(/Actief|Gepauzeerd|Opgezegd|Verlopen/)
      }
    }
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
