import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth'
import { Layout } from './components/layout'
import {
  Dashboard,
  Members,
  MemberDetail,
  Leads,
  Subscriptions,
  Schedule,
  Reservations,
  CheckIn,
  Reports,
  Tasks,
  Team,
  Settings,
  Login,
  Shop,
} from './pages'
import { SubscriptionsManage } from './pages/SubscriptionsManage'
import { PlansOverview, PlanCheckout, CheckoutSuccess, CheckoutCancel } from './pages/checkout'

// Lazy load public shop pages for better performance
const ShopLanding = React.lazy(() => import('./pages/shop/ShopLanding'))
const ShopProductDetail = React.lazy(() => import('./pages/shop/ShopProductDetail'))
const ShopCheckout = React.lazy(() => import('./pages/shop/ShopCheckout'))
const ShopOrderComplete = React.lazy(() => import('./pages/shop/ShopOrderComplete'))

// Loading fallback for lazy-loaded shop pages
const ShopLoadingFallback = () => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-neutral-400">Laden...</p>
    </div>
  </div>
)

// Check if we're on the shop subdomain
const isShopSubdomain = window.location.hostname.startsWith('shop.') ||
  window.location.hostname === 'shop.mmagym.be'

// Check if we're on the roster subdomain (should be handled by Vercel rewrites to landing.html, but failsafe here)
const isRosterSubdomain = window.location.hostname.startsWith('roster.') ||
  window.location.hostname === 'roster.mmagym.be'

if (isRosterSubdomain) {
  // If the React App loads on roster, it means the Vercel rewrite failed or we hit a cached Service Worker/index.html
  // Force redirect to the static landing page file
  window.location.replace('/landing.html')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-8">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <pre className="bg-zinc-900 p-4 rounded overflow-auto text-sm">
            {this.state.error?.message}
            {'\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

// Shop App - for shop.mmagym.be subdomain
function ShopApp() {
  return (
    <Routes>
      {/* Root shows shop landing */}
      <Route path="/" element={<Suspense fallback={<ShopLoadingFallback />}><ShopLanding /></Suspense>} />
      <Route path="/products" element={<Suspense fallback={<ShopLoadingFallback />}><ShopLanding /></Suspense>} />
      <Route path="/products/:slug" element={<Suspense fallback={<ShopLoadingFallback />}><ShopProductDetail /></Suspense>} />
      <Route path="/cart" element={<Suspense fallback={<ShopLoadingFallback />}><ShopCheckout /></Suspense>} />
      <Route path="/checkout" element={<Suspense fallback={<ShopLoadingFallback />}><ShopCheckout /></Suspense>} />
      <Route path="/order-complete" element={<Suspense fallback={<ShopLoadingFallback />}><ShopOrderComplete /></Suspense>} />
      {/* Fallback - redirect unknown routes to shop */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// CRM App - for crm.mmagym.be main domain
function CRMApp() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/app.html/login" element={<Login />} />

        {/* Public checkout routes */}
        <Route path="/checkout/plans" element={<PlansOverview />} />
        <Route path="/checkout/plans/:ageGroup" element={<PlanCheckout />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="/app.html/checkout/plans" element={<PlansOverview />} />
        <Route path="/app.html/checkout/plans/:ageGroup" element={<PlanCheckout />} />
        <Route path="/app.html/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/app.html/checkout/cancel" element={<CheckoutCancel />} />

        {/* Public shop routes on CRM domain */}
        <Route path="/shop/products" element={<Suspense fallback={<ShopLoadingFallback />}><ShopLanding /></Suspense>} />
        <Route path="/shop/products/:slug" element={<Suspense fallback={<ShopLoadingFallback />}><ShopProductDetail /></Suspense>} />
        <Route path="/shop/checkout" element={<Suspense fallback={<ShopLoadingFallback />}><ShopCheckout /></Suspense>} />
        <Route path="/shop/order-complete" element={<Suspense fallback={<ShopLoadingFallback />}><ShopOrderComplete /></Suspense>} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="leads" element={<Leads />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="subscriptions/manage" element={<SubscriptionsManage />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="reports" element={<Reports />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
          <Route path="shop" element={<Shop />} />
        </Route>
        <Route
          path="/app.html"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="leads" element={<Leads />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="subscriptions/manage" element={<SubscriptionsManage />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="reports" element={<Reports />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<Team />} />
          <Route path="settings" element={<Settings />} />
          <Route path="shop" element={<Shop />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {isShopSubdomain ? <ShopApp /> : <CRMApp />}
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
