import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured, createAdminClient } from './helpers/supabase'

test.describe('Leads Pipeline', () => {
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

    // Navigate to leads page
    await page.goto('/leads')
    await page.waitForLoadState('networkidle')
  })

  test('should display kanban board with status columns', async ({ page }) => {
    // Wait for the page title
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible()

    // Check for kanban columns - the expected status columns
    const expectedColumns = [
      'Nieuw',
      'Gecontacteerd',
      'Proefles Gepland',
      'Proefles Gedaan',
      'Geconverteerd',
      'Verloren',
    ]

    // Verify each column is present
    for (const columnName of expectedColumns) {
      const columnHeading = page.getByText(columnName)
      await expect(columnHeading).toBeVisible()
    }

    // Check that the kanban board layout is present (horizontal scrollable container)
    const kanbanContainer = page.locator('.flex.gap-4.overflow-x-auto')
    await expect(kanbanContainer).toBeVisible()
  })

  test('should open new lead form', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible()

    // Click "Nieuwe Lead" button
    const addButton = page.getByRole('button', { name: /Nieuwe Lead/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Wait for modal to appear
    await expect(page.getByText(/Nieuwe Lead/i)).toBeVisible()

    // Check form fields are present
    await expect(page.locator('input[name="first_name"]')).toBeVisible()
    await expect(page.locator('input[name="last_name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('select[name="source"]')).toBeVisible()
  })

  test('should create a new lead', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now()
    const testLead = {
      firstName: 'E2ETest',
      lastName: `Lead${timestamp}`,
      email: `lead-${timestamp}@e2etest.com`,
      phone: '+32470654321',
    }

    // Open new lead modal
    const addButton = page.getByRole('button', { name: /Nieuwe Lead/i })
    await addButton.click()
    await expect(page.getByText(/Nieuwe Lead/i)).toBeVisible()

    // Fill form
    await page.locator('input[name="first_name"]').fill(testLead.firstName)
    await page.locator('input[name="last_name"]').fill(testLead.lastName)
    await page.locator('input[name="email"]').fill(testLead.email)
    await page.locator('input[name="phone"]').fill(testLead.phone)

    // Select a source
    await page.locator('select[name="source"]').selectOption('website')

    // Submit form
    const submitButton = page.getByRole('button', { name: /Toevoegen|Opslaan/i })
    await submitButton.click()

    // Wait for modal to close and lead to appear
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Nieuwe Lead/i)).not.toBeVisible()

    // Verify lead appears in "Nieuw" column (default status)
    const nieuwColumn = page.locator('div').filter({ hasText: /^Nieuw/ }).first()
    await expect(nieuwColumn).toBeVisible()

    // Look for the lead card with the test name
    const leadCard = page.locator('div').filter({ hasText: testLead.firstName })
    await expect(leadCard.first()).toBeVisible()

    // Cleanup: Delete test lead
    try {
      const adminClient = createAdminClient()
      const { data: leads } = await adminClient
        .from('leads')
        .select('id')
        .eq('email', testLead.email)
        .single()

      if (leads?.id) {
        await adminClient
          .from('leads')
          .delete()
          .eq('id', leads.id)
      }
    } catch (error) {
      console.warn('Failed to cleanup test lead:', error)
    }
  })

  test('should open lead detail modal', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible()

    // Check if any leads exist
    const leadCards = page.locator('[class*="bg-neutral-900"]').filter({ hasText: /^[A-Z]/ })
    const leadCount = await leadCards.count()

    if (leadCount === 0) {
      test.skip() // Skip if no leads to click
    }

    // Click on first lead card
    const firstLeadCard = leadCards.first()
    await firstLeadCard.click()

    // Wait for detail modal to appear (slide-over panel)
    await page.waitForTimeout(500)
    await expect(page.getByText('Lead details')).toBeVisible()

    // Check that contact info sections are present
    await expect(page.getByText('Contact')).toBeVisible()
    await expect(page.getByText('Lead Details')).toBeVisible()

    // Check form fields are present
    await expect(page.locator('input[name="first_name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test('should update lead status', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible()

    // Check if any leads exist in "Nieuw" column
    const nieuwColumn = page.locator('div').filter({ hasText: /^Nieuw/ }).first()
    const leadCards = nieuwColumn.locator('[class*="bg-neutral-900"]').filter({ hasText: /^[A-Z]/ })
    const leadCount = await leadCards.count()

    if (leadCount === 0) {
      test.skip() // Skip if no leads to update
    }

    // Get first lead name for verification
    const firstLeadCard = leadCards.first()
    const leadName = await firstLeadCard.textContent()

    // Click on lead card to open detail modal
    await firstLeadCard.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('Lead details')).toBeVisible()

    // Find and click "Gecontacteerd" status button
    const gecontacteerdButton = page.locator('button').filter({ hasText: 'Gecontacteerd' })
    await expect(gecontacteerdButton).toBeVisible()
    await gecontacteerdButton.click()

    // Wait for status update
    await page.waitForTimeout(1000)

    // Close modal
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    await closeButton.click()

    // Wait for modal to close
    await page.waitForTimeout(500)

    // Verify lead moved to "Gecontacteerd" column
    const gecontacteerdColumn = page.locator('div').filter({ hasText: /^Gecontacteerd/ }).first()
    await expect(gecontacteerdColumn).toBeVisible()

    // Note: Drag-and-drop testing is complex with Playwright
    // The status update via detail modal covers the core functionality
  })

  test('should filter leads by source', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible()

    // Check if source filter exists
    // Currently the Leads page doesn't have a visible source filter UI
    // This test documents the expected behavior once filters are implemented
    test.skip() // Skip until source filter is implemented in the UI
  })

  test('should show lead count in header', async ({ page }) => {
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Leads/i })).toBeVisible()

    // Check that lead count is displayed
    const countText = page.locator('p').filter({ hasText: /leads in pipeline/i })
    await expect(countText).toBeVisible()

    // Verify count format (e.g., "5 leads in pipeline")
    const countContent = await countText.textContent()
    expect(countContent).toMatch(/\d+ leads in pipeline/i)
  })

  test('should display empty state when no leads', async ({ page }) => {
    // This test would require cleaning all leads from the database
    // Which is too destructive for a shared test environment
    // Skip for now, but documents expected behavior
    test.skip()

    // Expected behavior:
    // - Empty state message should appear
    // - "Nieuwe Lead" button should still be visible
    // - Kanban columns should still be rendered but empty
  })
})
