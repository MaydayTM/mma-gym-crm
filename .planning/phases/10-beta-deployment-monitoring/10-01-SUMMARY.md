# Plan 10-01 Summary: Sentry Error Tracking & Production Hardening

**Phase:** 10-beta-deployment-monitoring
**Plan:** 01
**Status:** ✅ Complete
**Completed:** 2026-02-02

---

## Overview

Installed and configured Sentry error tracking with source maps, and hardened the application for production use by removing debug logging and adding security headers. All runtime errors will now be captured and reported to Sentry before beta testers start using the app.

---

## Objectives Met

- ✅ Sentry SDK installed and configured with browser tracing and session replay
- ✅ Source maps generated and configured for upload (when SENTRY_AUTH_TOKEN is set)
- ✅ Sentry error handlers integrated in React root
- ✅ Sentry ErrorBoundary wrapping entire app with user-friendly fallback
- ✅ All debug console.log statements removed from production code
- ✅ Security headers enhanced in vercel.json
- ✅ Production build generates hidden source maps
- ✅ Zero TypeScript errors

---

## Tasks Completed

### Task 1: Install and configure Sentry with source maps
**Commit:** `66b50c7`
**Files modified:** `package.json`, `package-lock.json`, `src/instrument.ts`, `src/main.tsx`, `vite.config.ts`, `.env.example`

**Actions:**
- Installed `@sentry/react` and `@sentry/vite-plugin`
- Created `src/instrument.ts` with Sentry initialization:
  - Browser tracing and replay integrations
  - 20% traces sample rate (appropriate for ~200 beta users)
  - 10% session replay, 100% on errors
  - Only enabled in production (`import.meta.env.PROD`)
- Updated `src/main.tsx` to import instrument.ts first (critical for error capture)
- Added Sentry error handlers to `createRoot()`: `onUncaughtError` and `onCaughtError`
- Configured `vite.config.ts`:
  - Set `build.sourcemap: 'hidden'` to generate maps without exposing them in browser
  - Added conditional `sentryVitePlugin` (only when `SENTRY_AUTH_TOKEN` is present)
- Updated `.env.example` with Sentry DSN and source map upload configuration

**Verification:**
- ✅ Build completes without errors
- ✅ Source maps generated in `dist/assets/*.map`
- ✅ No TypeScript errors

### Task 2: Production hardening — debug cleanup, error boundary, security headers
**Commit:** `4297221`
**Files modified:** `src/lib/supabase.ts`, `src/App.tsx`, `vercel.json`, `.gitignore`

**Actions:**
- Cleaned up `src/lib/supabase.ts`:
  - Removed 3 console.log debug statements (lines 8-9 and connection test on lines 23-25)
  - Kept env var validation throw (production guard)
- Added Sentry ErrorBoundary to `src/App.tsx`:
  - Imported `@sentry/react`
  - Created `ErrorFallback` component with Dutch messaging ("Er is iets misgegaan")
  - Wrapped entire app with `<Sentry.ErrorBoundary fallback={<ErrorFallback />}>`
  - Positioned outside Suspense boundaries to catch chunk loading errors
- Enhanced `vercel.json` security headers:
  - Added `Referrer-Policy: strict-origin-when-cross-origin`
  - Added `X-XSS-Protection: 0` (modern browsers, CSP is preferred)
  - Added `Permissions-Policy: camera=(), microphone=(), geolocation=()` (restrict unused browser APIs)
  - Kept existing `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`
- Added `.env.sentry-build-plugin` to `.gitignore`

**Verification:**
- ✅ Build succeeds
- ✅ `grep -rn "console.log" src/lib/supabase.ts` returns nothing
- ✅ vercel.json is valid JSON
- ✅ Sentry ErrorBoundary wraps app content
- ✅ No TypeScript errors

---

## Deviations from Plan

**None.** All tasks completed as specified with no deviations, bugs, or architectural changes needed.

---

## Technical Details

### Sentry Configuration
```typescript
// src/instrument.ts
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.2,  // 20% for beta (200 users)
  replaysSessionSampleRate: 0.1,  // 10% general
  replaysOnErrorSampleRate: 1.0,  // 100% on errors
  enabled: import.meta.env.PROD,
  environment: import.meta.env.MODE,
});
```

### Security Headers Added
```json
{
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "0",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
}
```

### Error Boundary
- User-friendly Dutch error message
- Reload button for recovery
- Positioned outside Suspense to catch React.lazy() chunk loading errors
- Sentry automatically captures and reports errors before showing fallback

---

## Files Modified

1. **package.json** - Added Sentry dependencies
2. **package-lock.json** - Dependency lock file
3. **src/instrument.ts** - New file: Sentry initialization
4. **src/main.tsx** - Import instrument.ts first, add error handlers
5. **vite.config.ts** - Source maps and sentryVitePlugin
6. **src/lib/supabase.ts** - Removed debug console.logs
7. **src/App.tsx** - Added Sentry ErrorBoundary and ErrorFallback
8. **vercel.json** - Enhanced security headers
9. **.env.example** - Added Sentry configuration documentation
10. **.gitignore** - Added .env.sentry-build-plugin

---

## Verification Results

All verification checks passed:

- ✅ `npm run build` succeeds without errors
- ✅ `grep -rn "console.log" src/lib/supabase.ts` returns nothing
- ✅ `src/instrument.ts` exists with Sentry.init()
- ✅ `src/main.tsx` imports instrument.ts first
- ✅ `vite.config.ts` includes sentryVitePlugin (conditional on auth token)
- ✅ `vercel.json` has enhanced security headers and is valid JSON
- ✅ Sentry ErrorBoundary wraps app content in App.tsx
- ✅ No TypeScript errors (`npx tsc --noEmit`)
- ✅ Source maps generated in dist/assets/

---

## Next Steps

**For Mehdi to complete:**

1. **Create Sentry project:**
   - Go to https://sentry.io and create a new project
   - Choose "React" as the platform
   - Copy the DSN from Project Settings > Client Keys

2. **Configure environment variables:**
   - Add to local `.env` file:
     ```
     VITE_SENTRY_DSN=https://your-key@sentry.io/your-project-id
     ```
   - Add to Vercel environment variables (Production + Preview):
     ```
     VITE_SENTRY_DSN=https://your-key@sentry.io/your-project-id
     ```

3. **Configure source map uploads (optional but recommended):**
   - Create Sentry auth token: Settings > Auth Tokens
   - Add to Vercel environment variables (Production only):
     ```
     SENTRY_ORG=your-org-slug
     SENTRY_PROJECT=your-project-slug
     SENTRY_AUTH_TOKEN=your-auth-token
     ```
   - Source maps will automatically upload on production builds

4. **Test error tracking:**
   - Deploy to Vercel: `vercel --prod`
   - Trigger a test error (or wait for real errors)
   - Verify errors appear in Sentry dashboard with source maps

---

## Success Criteria Met

- ✅ All tasks completed
- ✅ All verification checks pass
- ✅ No errors or warnings introduced
- ✅ Sentry SDK configured and ready to receive errors (DSN needed from dashboard)
- ✅ Source maps uploaded on production builds (when SENTRY_AUTH_TOKEN is set)
- ✅ Debug console.logs removed from production code
- ✅ Security headers hardened

---

## Notes

- Sentry only runs in production builds (`import.meta.env.PROD`)
- Source maps are "hidden" - not exposed in browser but available for Sentry
- Error fallback uses Dutch language consistent with app locale
- Sample rates are conservative (20% traces, 10% sessions) to avoid quota issues
- Security headers do not include CSP yet - would require careful testing with Supabase WebSockets and Tailwind inline styles

---

**Plan Duration:** ~15 minutes
**Issues Encountered:** None
**Blockers:** None
