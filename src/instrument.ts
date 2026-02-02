import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance: capture 20% of transactions (adjust for beta)
  tracesSampleRate: 0.2,
  // Session Replay: capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Only enable in production
  enabled: import.meta.env.PROD,
  // Environment tag
  environment: import.meta.env.MODE,
});
