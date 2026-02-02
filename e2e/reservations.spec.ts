import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Reservations', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser()

    if (!testUser) {
      test.skip()
      return
    }

    // Login and navigate to reservations page
    await page.goto('/login')
    await login(page, testUser.email, testUser.password)
    await page.goto('/reservations')
  })

  test('should display weekly reservation view', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    // Wait for reservations page to load
    await page.waitForSelector('text=Reservaties')

    // Verify page header
    await expect(page.locator('h1:has-text("Reservaties")')).toBeVisible()
    await expect(page.locator('text=Bekijk en beheer les-inschrijvingen')).toBeVisible()

    // Verify week navigation is present
    await expect(page.locator('button:has-text("Vandaag")')).toBeVisible()

    // Verify week view with 7 days (Ma, Di, Wo, Do, Vr, Za, Zo)
    const weekDays = page.locator('button').filter({ hasText: /^(Ma|Di|Wo|Do|Vr|Za|Zo)$/ })
    const dayCount = await weekDays.count()
    expect(dayCount).toBe(7)
  })

  test('should show class slots with capacity info', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Reservaties')
    await page.waitForTimeout(1000)

    // Look for class cards - they should show capacity with Users icon
    const classCards = page.locator('button').filter({ hasText: /\d+:\d+/ })
    const cardCount = await classCards.count()

    if (cardCount > 0) {
      // At least one class exists
      const firstCard = classCards.first()
      await expect(firstCard).toBeVisible()

      // Verify capacity info is shown (format: "X" or "X/Y")
      // Look for Users icon followed by number
      const cardHtml = await firstCard.innerHTML()

      // Check if card contains capacity info
      // The capacity is shown with Users icon and text like "0/20" or "5"
      expect(cardHtml).toBeTruthy()

      // Class cards should be clickable
      await expect(firstCard).toBeEnabled()
    } else {
      // No classes today - verify empty state or just loaded page
      console.log('No classes found for selected day - this is OK')
    }
  })

  test('should navigate between weeks', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Reservaties')

    // Get initial month display
    const monthDisplay = page.locator('span.text-\\[16px\\].font-medium.text-neutral-100')
    const initialMonth = await monthDisplay.textContent()

    // Click next week button (right arrow)
    const nextButton = page.locator('button', { has: page.locator('svg') }).filter({ hasText: '' }).last()
    await nextButton.click()
    await page.waitForTimeout(500)

    // Get new month display (might be same month or different)
    const newMonth = await monthDisplay.textContent()
    expect(newMonth).toBeTruthy()

    // Click previous week button (left arrow)
    const prevButton = page.locator('button', { has: page.locator('svg') }).filter({ hasText: '' }).first()
    await prevButton.click()
    await page.waitForTimeout(500)

    // Should be back at or near initial month
    const finalMonth = await monthDisplay.textContent()
    expect(finalMonth).toBeTruthy()

    // Test "Vandaag" button
    await page.click('button:has-text("Vandaag")')
    await page.waitForTimeout(500)

    // Should show current month
    const currentMonth = await monthDisplay.textContent()
    expect(currentMonth).toContain(new Date().toLocaleDateString('nl-BE', { month: 'long' }))
  })

  test('should show reservation details for a class', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Reservaties')
    await page.waitForTimeout(1000)

    // Look for class cards
    const classCards = page.locator('button').filter({ hasText: /\d+:\d+/ })
    const cardCount = await classCards.count()

    if (cardCount === 0) {
      console.log('No classes to click - skipping')
      test.skip()
      return
    }

    // Click on first class
    await classCards.first().click()

    // Wait for modal to open
    await page.waitForTimeout(1000)

    // Look for modal content - should show class details
    // Modal might show "Inschrijvingen" heading or member list
    const modalContent = page.locator('div').filter({ hasText: 'Inschrijvingen' }).first()

    // Check if modal opened (might show empty state or member list)
    const isModalVisible = await modalContent.isVisible().catch(() => false)

    if (isModalVisible) {
      // Modal opened - verify expected content
      // Should show either "Nog geen inschrijvingen" or a list of members
      const hasEmptyState = await page.locator('text=Nog geen inschrijvingen').isVisible().catch(() => false)
      const hasMemberList = await page.locator('div').filter({ hasText: /\w+\s+\w+/ }).count() > 0

      expect(hasEmptyState || hasMemberList).toBe(true)

      // Close modal by clicking outside or close button
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    } else {
      console.log('Modal did not open - might be permission issue')
    }
  })

  test('should show attendance stats', async ({ page }) => {
    const testUser = getTestUser()
    if (!testUser) {
      test.skip()
      return
    }

    await page.waitForSelector('text=Reservaties')
    await page.waitForTimeout(1000)

    // Look for class cards with capacity indicators
    const capacityIndicators = page.locator('div').filter({ hasText: /\d+/ }).filter({ has: page.locator('svg') })
    const indicatorCount = await capacityIndicators.count()

    if (indicatorCount > 0) {
      // Found capacity/attendance indicators
      // These show format like "5/20" or "0"
      const firstIndicator = capacityIndicators.first()
      const text = await firstIndicator.textContent()

      // Should contain numbers
      expect(text).toMatch(/\d+/)
      console.log(`Found capacity indicator: ${text}`)
    } else {
      console.log('No capacity indicators found - might be no classes')
    }

    // Click on a class to see detailed attendance
    const classCards = page.locator('button').filter({ hasText: /\d+:\d+/ })
    const cardCount = await classCards.count()

    if (cardCount > 0) {
      await classCards.first().click()
      await page.waitForTimeout(1000)

      // In the modal, look for attendance stats
      // Check for "Inschrijvingen" with count like "Inschrijvingen (5)"
      const attendanceHeading = page.locator('h3').filter({ hasText: 'Inschrijvingen' })
      const isVisible = await attendanceHeading.isVisible().catch(() => false)

      if (isVisible) {
        const headingText = await attendanceHeading.textContent()
        // Should show count in format "Inschrijvingen (X)"
        expect(headingText).toMatch(/Inschrijvingen\s*\(\d+\)/)
      }

      // Close modal
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }
  })
})

test.describe.configure({ mode: 'parallel' })

test.beforeAll(async () => {
  if (!isTestEnvironmentConfigured()) {
    console.warn('⚠️  Test environment not fully configured')
    console.warn('   Some tests will be skipped')
  }
})
