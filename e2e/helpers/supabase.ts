import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load test environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

/**
 * Test credentials interface
 */
interface TestUser {
  email: string
  password: string
}

/**
 * Get test user credentials from environment
 * These are real credentials for testing - should be set in .env.test
 */
export function getTestUser(): TestUser | null {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    console.warn('⚠️  TEST_USER_EMAIL and TEST_USER_PASSWORD not set in .env.test')
    console.warn('   Tests requiring authentication will be skipped')
    return null
  }

  return { email, password }
}

/**
 * Create a Supabase admin client for test setup/teardown
 * Note: This uses SERVICE_ROLE_KEY which has admin privileges
 * Only use in E2E tests, NEVER in frontend code
 */
export function createAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Check if test environment is properly configured
 */
export function isTestEnvironmentConfigured(): boolean {
  const testUser = getTestUser()
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL

  return !!(testUser && supabaseUrl)
}
