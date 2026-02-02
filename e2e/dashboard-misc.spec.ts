import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import { getTestUser, isTestEnvironmentConfigured } from './helpers/supabase'

test.describe('Dashboard', () => {
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

    // Navigate to dashboard (root)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display KPI cards', async ({ page }) => {
    // Wait for dashboard title
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Check for KPI cards (Actieve Leden, Nieuwe Leden, Check-ins, Omzet)
    const kpiLabels = [
      /Actieve Leden/i,
      /Nieuwe Leden/i,
      /Check-ins/i,
      /Omzet/i,
    ]

    // Verify at least 3 KPI cards are visible
    let visibleCount = 0
    for (const label of kpiLabels) {
      const isVisible = await page.getByText(label).isVisible().catch(() => false)
      if (isVisible) visibleCount++
    }
    expect(visibleCount).toBeGreaterThanOrEqual(3)
  })

  test('should show recent activity', async ({ page }) => {
    // Wait for dashboard title
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Check for recent activity sections
    // Dashboard has "Recente Check-ins" and "Open Leads" sections
    const recentCheckinsVisible = await page.getByText(/Recente Check-ins/i).isVisible().catch(() => false)
    const openLeadsVisible = await page.getByText(/Open Leads/i).isVisible().catch(() => false)

    // At least one activity section should be visible
    expect(recentCheckinsVisible || openLeadsVisible).toBeTruthy()
  })

  test('should have new member quick-action', async ({ page }) => {
    // Wait for dashboard title
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Verify "Nieuw Lid" button is visible
    const newMemberButton = page.getByRole('button', { name: /Nieuw Lid/i })
    await expect(newMemberButton).toBeVisible()

    // Click to verify modal opens
    await newMemberButton.click()
    await page.waitForTimeout(500)

    // Modal should appear with form
    await expect(page.getByText(/Nieuw Lid Toevoegen/i)).toBeVisible()
  })
})

test.describe('Shop Module', () => {
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

    // Navigate to shop page
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
  })

  test('should display shop dashboard', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Shop/i })).toBeVisible()

    // Check description
    await expect(page.getByText(/Beheer je producten, bestellingen en voorraad/i)).toBeVisible()

    // Verify main content is visible
    const shopContent = page.locator('main, [role="main"]')
    await expect(shopContent).toBeVisible()
  })

  test('should show module access info', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Shop/i })).toBeVisible()

    // Check for trial badge or active status indicator
    // The page shows trial info if module is in trial
    const trialBadgeVisible = await page.getByText(/trial|dagen over/i).isVisible().catch(() => false)
    const statsVisible = await page.getByText(/Producten|Bestellingen|Omzet/i).isVisible().catch(() => false)

    // Either trial badge or stats should be visible (indicates access)
    expect(trialBadgeVisible || statsVisible).toBeTruthy()
  })
})

test.describe('Email', () => {
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

    // Navigate to email page
    await page.goto('/email')
    await page.waitForLoadState('networkidle')
  })

  test('should display email page with tabs', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Email Marketing/i })).toBeVisible()

    // Check description
    await expect(page.getByText(/Campagnes, templates en analytics/i)).toBeVisible()

    // Verify tabs are visible (Campagnes, Templates, Analytics)
    await expect(page.getByText(/Campagnes/i).first()).toBeVisible()
    await expect(page.getByText(/Templates/i).first()).toBeVisible()
    await expect(page.getByText(/Analytics/i).first()).toBeVisible()
  })

  test('should show template list', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Email Marketing/i })).toBeVisible()

    // Click Templates tab
    const templatesTab = page.getByRole('button', { name: /Templates/i }).first()
    await templatesTab.click()
    await page.waitForTimeout(500)

    // Should see either template cards or empty state
    const hasTemplates = await page.getByText(/Nieuw Template/i).isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/Geen templates|Maak je eerste/i).isVisible().catch(() => false)

    expect(hasTemplates || hasEmptyState).toBeTruthy()
  })
})

test.describe('GymScreen', () => {
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

    // Navigate to gymscreen page
    await page.goto('/gymscreen')
    await page.waitForLoadState('networkidle')
  })

  test('should display gym screen manager', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /GymScreen/i })).toBeVisible()

    // Check description
    await expect(page.getByText(/Beheer de content die op je gym TV-displays wordt getoond/i)).toBeVisible()

    // Verify tabs or sections are visible
    const tabVisible = await page.getByText(/Overzicht|Slideshow|Verjaardagen/i).isVisible().catch(() => false)
    const statsVisible = await page.getByText(/Slides|Jarigen/i).isVisible().catch(() => false)

    expect(tabVisible || statsVisible).toBeTruthy()
  })
})

test.describe('KitanaHub', () => {
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

    // Navigate to kitana page
    await page.goto('/kitana')
    await page.waitForLoadState('networkidle')
  })

  test('should display Kitana AI hub', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Kitana/i })).toBeVisible()

    // Check for AI Assistant badge
    await expect(page.getByText(/AI Assistant/i)).toBeVisible()

    // Verify hero section with description
    await expect(page.getByText(/Jouw slimme assistent/i)).toBeVisible()

    // Check for chat input
    const chatInput = page.locator('input[placeholder*="Vraag Kitana"]')
    await expect(chatInput).toBeVisible()
  })

  test('should show agent function cards', async ({ page }) => {
    // Wait for page title
    await expect(page.getByRole('heading', { name: /Kitana/i })).toBeVisible()

    // Verify Smart Functies section
    await expect(page.getByText(/Smart Functies/i)).toBeVisible()

    // Check for function cards (Email Versturen, Rapport Genereren, etc.)
    const functionCards = [
      /Email Versturen/i,
      /Rapport Genereren/i,
      /Churn Analyse/i,
      /Training Rankings/i,
    ]

    // Verify at least 3 function cards are visible
    let visibleCount = 0
    for (const cardLabel of functionCards) {
      const isVisible = await page.getByText(cardLabel).isVisible().catch(() => false)
      if (isVisible) visibleCount++
    }
    expect(visibleCount).toBeGreaterThanOrEqual(3)
  })
})

test.describe('Sidebar Navigation', () => {
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
  })

  test('should show all main navigation items', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Check for main navigation items in sidebar
    const navItems = [
      /Dashboard/i,
      /Leden/i,
      /Leads/i,
      /Abonnementen/i,
      /Rooster/i,
      /Reserveringen/i,
      /Check-in/i,
      /Rapporten/i,
      /Team/i,
      /Instellingen/i,
    ]

    // Verify at least 8 out of 10 nav items are visible (some might be collapsed)
    let visibleCount = 0
    for (const navItem of navItems) {
      const isVisible = await page.getByRole('link', { name: navItem }).isVisible().catch(() => false)
      if (isVisible) visibleCount++
    }
    expect(visibleCount).toBeGreaterThanOrEqual(8)
  })

  test('should navigate to each main page', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible()

    // Test navigation to key pages
    const pagesToTest = [
      { link: /Leden/i, url: '/members', heading: /Leden/i },
      { link: /Leads/i, url: '/leads', heading: /Leads/i },
      { link: /Rooster/i, url: '/schedule', heading: /Rooster|Schedule/i },
      { link: /Team/i, url: '/team', heading: /Team/i },
    ]

    for (const pageTest of pagesToTest) {
      // Click navigation link
      const navLink = page.getByRole('link', { name: pageTest.link })
      const isVisible = await navLink.isVisible().catch(() => false)

      if (isVisible) {
        await navLink.click()
        await page.waitForLoadState('networkidle')

        // Verify URL changed
        expect(page.url()).toContain(pageTest.url)

        // Verify page heading
        const headingVisible = await page.getByRole('heading', { name: pageTest.heading }).isVisible().catch(() => false)
        expect(headingVisible).toBeTruthy()

        // Go back to dashboard for next iteration
        await page.goto('/')
        await page.waitForLoadState('networkidle')
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
