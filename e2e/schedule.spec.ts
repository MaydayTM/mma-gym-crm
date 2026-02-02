import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Schedule', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser()

    if (!testUser) {
      test.skip()
      return
    }

    // Login and navigate to schedule page
    await page.goto('/login')
    await login(page, testUser.email, testUser.password)
    await page.goto('/schedule')
  })

  test('should display weekly schedule view', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Wait for schedule page to load
    await page.waitForSelector('text=Rooster')

    // Verify page header
    await expect(page.locator('h1:has-text("Rooster")')).toBeVisible()
    await expect(page.locator('text=Lesrooster en planning')).toBeVisible()

    // Verify calendar/timetable is visible - look for day headers
    // Schedule shows Ma, Di, Wo, etc. in header
    await expect(page.locator('text=Ma')).toBeVisible()
    await expect(page.locator('text=Di')).toBeVisible()
    await expect(page.locator('text=Wo')).toBeVisible()

    // Verify view mode toggle is present
    await expect(page.locator('button:has-text("Week")')).toBeVisible()
  })

  test('should switch between week and month view', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Rooster')

    // Verify we start in week view (default)
    const weekButton = page.locator('button:has-text("Week")')
    await expect(weekButton).toBeVisible()

    // Switch to month view
    await page.click('button:has-text("Maand")')

    // Wait for view to update - month view shows more dates
    await page.waitForTimeout(500)

    // Verify month view is active (button should have active styling)
    const monthButton = page.locator('button:has-text("Maand")')
    await expect(monthButton).toHaveClass(/bg-amber-400/)

    // Switch back to week view
    await page.click('button:has-text("Week")')
    await page.waitForTimeout(500)

    // Verify week view is active again
    await expect(weekButton).toHaveClass(/bg-amber-400/)

    // Switch to day view
    await page.click('button:has-text("Dag")')
    await page.waitForTimeout(500)

    // Verify day view is active
    const dayButton = page.locator('button:has-text("Dag")')
    await expect(dayButton).toHaveClass(/bg-amber-400/)
  })

  test('should navigate between weeks', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Rooster')

    // Get initial date range text
    const dateRangeSelector = page.locator('span.text-\\[14px\\].font-medium.text-neutral-200')
    const initialDateRange = await dateRangeSelector.textContent()

    // Click next week button
    const nextButton = page.locator('button', { has: page.locator('svg') }).filter({ hasText: '' }).last()
    await nextButton.click()
    await page.waitForTimeout(300)

    // Verify date range changed
    const newDateRange = await dateRangeSelector.textContent()
    expect(newDateRange).not.toBe(initialDateRange)

    // Click previous week button twice (to go back and then one week before)
    const prevButton = page.locator('button', { has: page.locator('svg') }).filter({ hasText: '' }).first()
    await prevButton.click()
    await page.waitForTimeout(300)
    await prevButton.click()
    await page.waitForTimeout(300)

    // Date should be different from both initial and new
    const finalDateRange = await dateRangeSelector.textContent()
    expect(finalDateRange).not.toBe(initialDateRange)
    expect(finalDateRange).not.toBe(newDateRange)

    // Test "Vandaag" button to return to current week
    await page.click('button:has-text("Vandaag")')
    await page.waitForTimeout(300)

    // Should be back near initial date range
    const currentDateRange = await dateRangeSelector.textContent()
    expect(currentDateRange).toBeTruthy()
  })

  test('should open create class modal', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Rooster')

    // Look for "Nieuwe Les" button (only visible for users with manage schedule permission)
    const newClassButton = page.locator('button:has-text("Nieuwe Les")')

    // Check if button exists (depends on user permissions)
    const buttonCount = await newClassButton.count()

    if (buttonCount === 0) {
      // User doesn't have permission - skip test
      console.log('User does not have schedule management permission - skipping')
      test.skip()
      return
    }

    // Click the button
    await newClassButton.click()

    // Wait for modal to appear
    await page.waitForSelector('text=Nieuwe Les', { timeout: 3000 })

    // Verify modal form fields are present
    await expect(page.locator('input[placeholder*="BJJ"]')).toBeVisible()
    await expect(page.locator('label:has-text("Discipline")')).toBeVisible()
    await expect(page.locator('label:has-text("Coach")')).toBeVisible()
    await expect(page.locator('label:has-text("Dag")')).toBeVisible()
    await expect(page.locator('input[type="time"]').first()).toBeVisible()

    // Verify submit button
    await expect(page.locator('button:has-text("Aanmaken")')).toBeVisible()

    // Close modal (click cancel or outside)
    await page.click('button:has-text("Annuleren")')
    await page.waitForTimeout(500)
  })

  test('should show existing classes on schedule', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Rooster')

    // Wait for classes to load
    await page.waitForTimeout(1000)

    // Check if any classes are visible
    // Classes appear as colored cards with time and name
    const classCards = page.locator('div[draggable="true"]')
    const classCount = await classCards.count()

    if (classCount > 0) {
      // At least one class exists - verify it has expected elements
      const firstClass = classCards.first()
      await expect(firstClass).toBeVisible()

      // Classes should have time displayed (HH:MM format)
      const classText = await firstClass.textContent()
      expect(classText).toMatch(/\d{2}:\d{2}/)
    } else {
      // No classes exist - verify empty state or just loaded grid
      console.log('No classes found in schedule - this is OK for empty database')
    }
  })

  test('should filter by discipline', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Rooster')

    // Look for room filter dropdown (labeled "Alle zalen")
    const filterDropdown = page.locator('select')
    const dropdownCount = await filterDropdown.count()

    if (dropdownCount === 0) {
      console.log('No filter dropdown found - skipping')
      test.skip()
      return
    }

    // Get initial class count
    await page.waitForTimeout(500)
    const initialClasses = await page.locator('div[draggable="true"]').count()

    // Check if dropdown has options
    const options = await page.locator('select option').count()

    if (options > 1) {
      // Select a filter option (not "Alle zalen")
      const selectElement = page.locator('select').first()
      const optionValue = await page.locator('select option').nth(1).getAttribute('value')

      if (optionValue) {
        await selectElement.selectOption(optionValue)
        await page.waitForTimeout(500)

        // Verify filter was applied (class count may change)
        const filteredClasses = await page.locator('div[draggable="true"]').count()
        // Class count should be <= initial count
        expect(filteredClasses).toBeLessThanOrEqual(initialClasses)
      }
    }
  })

  test('should open class detail on click', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Rooster')
    await page.waitForTimeout(1000)

    // Find a class card to click
    const classCards = page.locator('div[draggable="true"]')
    const classCount = await classCards.count()

    if (classCount === 0) {
      console.log('No classes to click - skipping')
      test.skip()
      return
    }

    // Check if user has manage permission (only then can they edit)
    const manageButton = page.locator('button:has-text("Nieuwe Les")')
    const hasPermission = await manageButton.count() > 0

    if (!hasPermission) {
      console.log('User does not have edit permission - skipping')
      test.skip()
      return
    }

    // Click first class
    await classCards.first().click()

    // Wait for edit modal to appear
    await page.waitForSelector('text=Les Bewerken', { timeout: 3000 })

    // Verify modal has edit form
    await expect(page.locator('label:has-text("Naam")')).toBeVisible()
    await expect(page.locator('button:has-text("Opslaan")')).toBeVisible()
    await expect(page.locator('button:has-text("Verwijderen")')).toBeVisible()

    // Close modal
    await page.click('button:has-text("Annuleren")')
    await page.waitForTimeout(500)
  })
})

test.describe.configure({ mode: 'parallel' })

test.beforeAll(async () => {
  if (!isTestEnvironmentConfigured()) {
    console.warn('⚠️  Test environment not fully configured')
    console.warn('   Some tests will be skipped')
  }
})
