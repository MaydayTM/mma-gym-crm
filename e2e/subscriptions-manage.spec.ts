import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Subscriptions Management', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser()

    if (!testUser) {
      test.skip()
      return
    }

    // Login as admin
    await page.goto('/login')
    await login(page, testUser.email, testUser.password)

    // Navigate to subscriptions management page
    await page.goto('/subscriptions/manage')
    await page.waitForLoadState('networkidle')
  })

  test('should display pricing management page', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Verify page header
    await expect(page.locator('h1:has-text("Abonnementen Beheren")')).toBeVisible()
    await expect(page.locator('text=Configureer prijzen, kortingen en producten')).toBeVisible()

    // Should have a back button to /subscriptions
    const backButton = page.locator('a[href="/subscriptions"]')
    await expect(backButton).toBeVisible()
  })

  test('should display pricing management tabs', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Verify all tabs are present
    await expect(page.locator('button:has-text("1. Leeftijdsgroepen")')).toBeVisible()
    await expect(page.locator('button:has-text("2. Types")')).toBeVisible()
    await expect(page.locator('button:has-text("3. Prijzen")')).toBeVisible()
    await expect(page.locator('button:has-text("Dagpassen")')).toBeVisible()
    await expect(page.locator('button:has-text("Kortingen")')).toBeVisible()
    await expect(page.locator('button:has-text("Add-ons")')).toBeVisible()
  })

  test('should show age groups tab by default', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // First tab (age groups) should be active by default
    const ageGroupsTab = page.locator('button:has-text("1. Leeftijdsgroepen")')

    // Check if tab has active styling (amber background)
    const hasActiveClass = await ageGroupsTab.evaluate((el) =>
      el.classList.contains('bg-amber-300')
    )
    expect(hasActiveClass).toBe(true)
  })

  test('should show existing age groups', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Age groups tab should be active by default
    // Look for age group data (Reconnect seed data should have at least one)
    await page.waitForTimeout(1000) // Wait for data to load

    // Check if there's a table or list with age groups
    const hasContent = await page.locator('table, [role="table"]').isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=/Geen.*groepen|No age groups/i').isVisible().catch(() => false)

    // Should show either content or empty state
    expect(hasContent || hasEmptyState).toBe(true)
  })

  test('should switch to plan types tab', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Click on plan types tab
    const planTypesTab = page.locator('button:has-text("2. Types")')
    await planTypesTab.click()
    await page.waitForTimeout(500)

    // Verify tab is now active
    const hasActiveClass = await planTypesTab.evaluate((el) =>
      el.classList.contains('bg-amber-300')
    )
    expect(hasActiveClass).toBe(true)
  })

  test('should show existing plan types', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Switch to plan types tab
    await page.locator('button:has-text("2. Types")').click()
    await page.waitForTimeout(1000)

    // Check if there's content or empty state
    const hasContent = await page.locator('table, [role="table"]').isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=/Geen.*types|No plan types/i').isVisible().catch(() => false)

    expect(hasContent || hasEmptyState).toBe(true)
  })

  test('should switch to pricing matrix tab', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Click on pricing matrix tab
    const pricingTab = page.locator('button:has-text("3. Prijzen")')
    await pricingTab.click()
    await page.waitForTimeout(500)

    // Verify tab is now active
    const hasActiveClass = await pricingTab.evaluate((el) =>
      el.classList.contains('bg-amber-300')
    )
    expect(hasActiveClass).toBe(true)
  })

  test('should show pricing matrix', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Switch to pricing matrix tab
    await page.locator('button:has-text("3. Prijzen")').click()
    await page.waitForTimeout(1000)

    // Check if there's pricing data or empty state
    const hasContent = await page.locator('table, [role="table"]').isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=/Geen prijzen|No pricing/i').isVisible().catch(() => false)

    expect(hasContent || hasEmptyState).toBe(true)

    // If there's content, verify pricing structure
    if (hasContent) {
      // Look for price displays (€ symbol)
      const hasPrices = await page.locator('text=/€\\d+/').isVisible().catch(() => false)
      expect(hasPrices).toBe(true)
    }
  })

  test('should show one-time products section', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Switch to one-time products tab
    await page.locator('button:has-text("Dagpassen")').click()
    await page.waitForTimeout(1000)

    // Check if tab loaded
    const hasContent = await page.locator('table, [role="table"]').isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=/Geen.*producten|No products/i').isVisible().catch(() => false)

    expect(hasContent || hasEmptyState).toBe(true)
  })

  test('should show discounts section', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Switch to discounts tab
    await page.locator('button:has-text("Kortingen")').click()
    await page.waitForTimeout(1000)

    // Check if tab loaded
    const hasContent = await page.locator('table, [role="table"]').isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=/Geen.*kortingen|No discounts/i').isVisible().catch(() => false)

    expect(hasContent || hasEmptyState).toBe(true)
  })

  test('should show add-ons section', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Switch to add-ons tab
    await page.locator('button:has-text("Add-ons")').click()
    await page.waitForTimeout(1000)

    // Check if tab loaded
    const hasContent = await page.locator('table, [role="table"]').isVisible().catch(() => false)
    const hasEmptyState = await page.locator('text=/Geen.*add-ons|No add-ons/i').isVisible().catch(() => false)

    expect(hasContent || hasEmptyState).toBe(true)

    // If there's content, look for insurance or equipment rental
    if (hasContent) {
      const hasInsurance = await page.locator('text=/verzekering|insurance/i').isVisible().catch(() => false)
      const hasEquipment = await page.locator('text=/materiaalhuur|equipment/i').isVisible().catch(() => false)

      // At least one type of add-on should be visible if content exists
      expect(hasInsurance || hasEquipment).toBe(true)
    }
  })

  test('should allow navigation between tabs', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Navigate through all tabs
    const tabs = [
      '1. Leeftijdsgroepen',
      '2. Types',
      '3. Prijzen',
      'Dagpassen',
      'Kortingen',
      'Add-ons'
    ]

    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`)
      await tab.click()
      await page.waitForTimeout(300)

      // Verify tab is active
      const hasActiveClass = await tab.evaluate((el) =>
        el.classList.contains('bg-amber-300')
      )
      expect(hasActiveClass).toBe(true)
    }
  })

  test('should have form validation for pricing', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Switch to pricing matrix tab
    await page.locator('button:has-text("3. Prijzen")').click()
    await page.waitForTimeout(1000)

    // Look for an "Add" or "Create" button
    const addButton = page.locator('button:has-text("Toevoegen"), button:has-text("Add"), button:has-text("Nieuw")')
    const hasAddButton = await addButton.first().isVisible().catch(() => false)

    if (hasAddButton) {
      await addButton.first().click()
      await page.waitForTimeout(500)

      // Should show a form or modal
      const hasForm = await page.locator('form, [role="dialog"]').isVisible().catch(() => false)

      if (hasForm) {
        // Try submitting empty form (if there's a submit button)
        const submitButton = page.locator('button[type="submit"]:has-text("Opslaan"), button[type="submit"]:has-text("Save")')
        const hasSubmit = await submitButton.isVisible().catch(() => false)

        if (hasSubmit) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Should show validation error or form should not close
          // (Validation message may vary, so we just check form is still visible)
          const formStillVisible = await page.locator('form, [role="dialog"]').isVisible().catch(() => false)
          expect(formStillVisible).toBe(true)
        }
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
