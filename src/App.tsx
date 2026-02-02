import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ShopCartProvider } from './contexts/ShopCartContext'
import { ProtectedRoute, RoleGuard } from './components/auth'
import { Layout } from './components/layout'

// Lazy load all page components for route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Members = lazy(() => import('./pages/Members').then(m => ({ default: m.Members })))
const MemberDetail = lazy(() => import('./pages/MemberDetail').then(m => ({ default: m.MemberDetail })))
const Leads = lazy(() => import('./pages/Leads').then(m => ({ default: m.Leads })))
const Subscriptions = lazy(() => import('./pages/Subscriptions').then(m => ({ default: m.Subscriptions })))
const SubscriptionsManage = lazy(() => import('./pages/SubscriptionsManage').then(m => ({ default: m.SubscriptionsManage })))
const Schedule = lazy(() => import('./pages/Schedule').then(m => ({ default: m.Schedule })))
const Reservations = lazy(() => import('./pages/Reservations').then(m => ({ default: m.Reservations })))
const CheckIn = lazy(() => import('./pages/CheckIn').then(m => ({ default: m.CheckIn })))
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })))
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })))
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })))
const Email = lazy(() => import('./pages/Email').then(m => ({ default: m.Email })))
const EmailPreview = lazy(() => import('./pages/EmailPreview').then(m => ({ default: m.EmailPreview })))
const GymScreen = lazy(() => import('./pages/GymScreen').then(m => ({ default: m.GymScreen })))
const DoorTest = lazy(() => import('./pages/DoorTest').then(m => ({ default: m.DoorTest })))
const KitanaHub = lazy(() => import('./pages/KitanaHub').then(m => ({ default: m.KitanaHub })))

// Auth pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })))
const ClaimAccount = lazy(() => import('./pages/ClaimAccount').then(m => ({ default: m.ClaimAccount })))
const ActivateAccount = lazy(() => import('./pages/ActivateAccount').then(m => ({ default: m.ActivateAccount })))

// Checkout pages
const PlansOverview = lazy(() => import('./pages/checkout/PlansOverview').then(m => ({ default: m.PlansOverview })))
const PlanCheckout = lazy(() => import('./pages/checkout/PlanCheckout').then(m => ({ default: m.PlanCheckout })))
const CheckoutSuccess = lazy(() => import('./pages/checkout/CheckoutSuccess').then(m => ({ default: m.CheckoutSuccess })))
const CheckoutCancel = lazy(() => import('./pages/checkout/CheckoutCancel').then(m => ({ default: m.CheckoutCancel })))

// Public shop pages
const ShopLanding = lazy(() => import('./pages/shop/ShopLanding'))
const ShopProductDetail = lazy(() => import('./pages/shop/ShopProductDetail'))
const ShopCheckout = lazy(() => import('./pages/shop/ShopCheckout'))
const ShopOrderComplete = lazy(() => import('./pages/shop/ShopOrderComplete'))

// Loading fallback for lazy-loaded pages
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}

// Loading fallback for lazy-loaded shop pages (custom branding)
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
  React.useEffect(() => {
    document.title = "MMA Shop"
  }, [])

  return (
    <ShopCartProvider>
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
    </ShopCartProvider>
  )
}

// CRM App - for crm.mmagym.be main domain
function CRMApp() {
  React.useEffect(() => {
    document.title = "Roster CRM - Dashboard"
  }, [])

  return (
    <ShopCartProvider>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
        <Routes>
        {/* Public routes - no auth required */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/claim-account" element={<ClaimAccount />} />
        <Route path="/activate" element={<ActivateAccount />} />
        <Route path="/app.html/login" element={<Login />} />
        <Route path="/app.html/forgot-password" element={<ForgotPassword />} />
        <Route path="/app.html/reset-password" element={<ResetPassword />} />
        <Route path="/app.html/claim-account" element={<ClaimAccount />} />
        <Route path="/app.html/activate" element={<ActivateAccount />} />

        {/* Email preview (dev only) */}
        <Route path="/email-preview" element={<EmailPreview />} />

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
          <Route path="kitana" element={<KitanaHub />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="leads" element={<RoleGuard permission="canManageLeads"><Leads /></RoleGuard>} />
          <Route path="subscriptions" element={<RoleGuard permission="canEditMembers"><Subscriptions /></RoleGuard>} />
          <Route path="subscriptions/manage" element={<RoleGuard permission="canEditMembers"><SubscriptionsManage /></RoleGuard>} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="checkin" element={<RoleGuard permission="canCheckInMembers"><CheckIn /></RoleGuard>} />
          <Route path="reports" element={<RoleGuard permission="canManageFinances"><Reports /></RoleGuard>} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<RoleGuard permission="isAdmin"><Team /></RoleGuard>} />
          <Route path="settings" element={<RoleGuard permission="isStaff"><Settings /></RoleGuard>} />
          <Route path="shop" element={<Shop />} />
          <Route path="email" element={<Email />} />
          <Route path="gymscreen" element={<GymScreen />} />
          <Route path="door-test" element={<RoleGuard permission="isAdmin"><DoorTest /></RoleGuard>} />
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
          <Route path="kitana" element={<KitanaHub />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="leads" element={<RoleGuard permission="canManageLeads"><Leads /></RoleGuard>} />
          <Route path="subscriptions" element={<RoleGuard permission="canEditMembers"><Subscriptions /></RoleGuard>} />
          <Route path="subscriptions/manage" element={<RoleGuard permission="canEditMembers"><SubscriptionsManage /></RoleGuard>} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="checkin" element={<RoleGuard permission="canCheckInMembers"><CheckIn /></RoleGuard>} />
          <Route path="reports" element={<RoleGuard permission="canManageFinances"><Reports /></RoleGuard>} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<RoleGuard permission="isAdmin"><Team /></RoleGuard>} />
          <Route path="settings" element={<RoleGuard permission="isStaff"><Settings /></RoleGuard>} />
          <Route path="shop" element={<Shop />} />
          <Route path="email" element={<Email />} />
          <Route path="gymscreen" element={<GymScreen />} />
          <Route path="door-test" element={<RoleGuard permission="isAdmin"><DoorTest /></RoleGuard>} />
        </Route>
        </Routes>
        </Suspense>
      </AuthProvider>
    </ShopCartProvider>
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
