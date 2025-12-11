import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import { PlansOverview, PlanCheckout } from './pages/checkout'

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

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/app.html">
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Public checkout routes */}
              <Route path="/checkout/plans" element={<PlansOverview />} />
              <Route path="/checkout/plans/:ageGroup" element={<PlanCheckout />} />

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
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
