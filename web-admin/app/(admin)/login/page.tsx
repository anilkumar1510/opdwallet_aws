'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [logoutParam, setLogoutParam] = useState<string | null>(null)

  useEffect(() => {
    // Access searchParams only on client side
    const params = new URLSearchParams(window.location.search)
    const logout = params.get('logout')
    setLogoutParam(logout)

    console.log('🔐 [LOGIN PAGE] Component mounted')
    console.log('🔐 [LOGIN PAGE] Current URL:', window.location.href)
    console.log('🔐 [LOGIN PAGE] Pathname:', window.location.pathname)
    console.log('🔐 [LOGIN PAGE] Search params:', window.location.search)
    console.log('🔐 [LOGIN PAGE] logout param:', logout)
    console.log('🔐 [LOGIN PAGE] Current cookies:', document.cookie)

    // Log navigation events
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function(...args) {
      console.log('📍 [NAVIGATION] pushState called:', args)
      return originalPushState.apply(this, args)
    }

    window.history.replaceState = function(...args) {
      console.log('📍 [NAVIGATION] replaceState called:', args)
      return originalReplaceState.apply(this, args)
    }

    // Log popstate events (back/forward)
    const popstateHandler = (e: PopStateEvent) => {
      console.log('📍 [NAVIGATION] popstate event:', e.state, window.location.href)
    }
    window.addEventListener('popstate', popstateHandler)

    // Log beforeunload (page leaving)
    const beforeUnloadHandler = () => {
      console.log('🚪 [NAVIGATION] Page is unloading/navigating away from:', window.location.href)
    }
    window.addEventListener('beforeunload', beforeUnloadHandler)

    return () => {
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      window.removeEventListener('popstate', popstateHandler)
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
  }, [])

  const fillSuperAdminCredentials = () => {
    setEmail('admin@opdwallet.com')
    setPassword('Admin@123')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔐 [LOGIN] Starting login attempt...')
    console.log('🔐 [LOGIN] Email:', email)

    try {
      console.log('🔐 [LOGIN] Calling API at:', '/api/auth/login')
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      console.log('🔐 [LOGIN] Response status:', response.status, response.statusText)
      console.log('🔐 [LOGIN] Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        console.log('✅ [LOGIN] Login successful! User data:', data)
        console.log('✅ [LOGIN] User role:', data.role)
        console.log('✅ [LOGIN] Cookies after login:', document.cookie)

        // Store token in cookie is handled by the API
        // Redirect based on role
        // Note: For admin portal with basePath='/admin', use '/' which resolves to '/admin'
        if (data.role === 'SUPER_ADMIN' || data.role === 'ADMIN') {
          console.log('✅ [LOGIN] Redirecting SUPER_ADMIN/ADMIN to /')
          router.push('/')
        } else if (data.role === 'TPA_ADMIN' || data.role === 'TPA_USER') {
          console.log('✅ [LOGIN] Redirecting TPA to /tpa')
          router.push('/tpa')
        } else if (data.role === 'FINANCE_USER') {
          console.log('✅ [LOGIN] Redirecting FINANCE to /finance')
          router.push('/finance')
        } else if (data.role === 'OPS') {
          console.log('✅ [LOGIN] Redirecting OPS to /operations')
          router.push('/operations')
        } else {
          console.log('⚠️ [LOGIN] Unknown role, redirecting to /')
          router.push('/')
        }
      } else {
        console.error('❌ [LOGIN] Login failed with status:', response.status)
        const errorData = await response.json().catch(() => null)
        console.error('❌ [LOGIN] Error data:', errorData)
        setError(errorData?.message || 'Invalid email or password')
      }
    } catch (err) {
      console.error('❌ [LOGIN] Exception during login:', err)
      setError('An error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
      console.log('🔐 [LOGIN] Login attempt completed')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
        {/* Blue Header Strip with Logo */}
        <div style={{ backgroundColor: '#1E4A8D' }} className="w-full py-4 px-6">
          <img
            src="/admin/logos/habit-logo-white.png"
            alt="Habit Health - Powered by HCL Healthcare"
            className="h-12 w-auto"
          />
        </div>

        {/* Form Content - Centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to access your admin dashboard
              </p>
              <p className="text-xs text-gray-400 mt-1">
                v1.0.2 - All Configurations Verified ✓
              </p>
            </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-colors"
                style={{ borderColor: '#d1d5db' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1E4A8D';
                  e.target.style.boxShadow = '0 0 0 3px rgba(30, 74, 141, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-colors pr-12"
                  style={{ borderColor: '#d1d5db' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1E4A8D';
                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 74, 141, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Super Admin Quick Fill */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={fillSuperAdminCredentials}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors"
                style={{ backgroundColor: '#1E4A8D' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563A8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E4A8D'}
              >
                Quick Fill Admin
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1E4A8D' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563A8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E4A8D'}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Links */}
            <div className="space-y-4 pt-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <a href="#" className="font-semibold text-gray-900 hover:underline">
                    Contact Admin
                  </a>
                </p>
              </div>

              <div className="text-center">
                <a href="#" className="text-xs text-gray-500 hover:underline">
                  Terms & Conditions
                </a>
              </div>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(30, 74, 141, 0.1)' }}>
              <p className="text-sm font-medium" style={{ color: '#1E4A8D' }}>Demo Credentials:</p>
              <p className="text-sm mt-1" style={{ color: '#2563A8' }}>
                Email: admin@opdwallet.com<br />
                Password: Admin@123
              </p>
            </div>
          </form>
          </div>
        </div>
      </div>

      {/* Right Section - Gradient Background */}
      <div className="hidden lg:block lg:w-1/2" style={{ background: 'linear-gradient(to bottom right, #1E4A8D, #2563A8, #1E4A8D)' }}>
        <div className="h-full flex items-center justify-center py-8 px-10">
          <div className="text-white max-w-lg w-full">
            {/* Admin Illustration - Better Size */}
            <div className="mb-6 flex justify-center">
              <img
                src="/admin/logos/admin-illustration.png"
                alt="Admin Dashboard Illustration"
                className="w-full max-w-sm rounded-xl shadow-2xl"
                style={{ opacity: 0.95 }}
              />
            </div>

            {/* Heading with Gradient Text Effect */}
            <div className="text-center mb-6">
              <h2
                className="text-4xl font-black mb-3 tracking-tight leading-tight"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 50%, #FFFFFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4))'
                }}
              >
                OPD Wallet Admin Portal
              </h2>
              <p className="text-lg text-white opacity-95 leading-relaxed px-2">
                Comprehensive healthcare management platform
              </p>
            </div>

            {/* Feature Cards with Radiant Gradient */}
            <div className="space-y-3 mt-6">
              <div
                className="p-4 rounded-xl backdrop-blur-lg border border-white/40 shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.25) 50%, rgba(255,255,255,0.15) 100%)',
                  boxShadow: '0 10px 40px 0 rgba(199, 210, 254, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(199,210,254,0.3) 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base drop-shadow-sm">Policy & Benefits Management</h3>
                    <p className="text-white/90 text-sm mt-0.5">Oversee insurance policies and member benefits</p>
                  </div>
                </div>
              </div>

              <div
                className="p-4 rounded-xl backdrop-blur-lg border border-white/40 shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.25) 50%, rgba(255,255,255,0.15) 100%)',
                  boxShadow: '0 10px 40px 0 rgba(199, 210, 254, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(199,210,254,0.3) 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base drop-shadow-sm">Member Management & Analytics</h3>
                    <p className="text-white/90 text-sm mt-0.5">Manage member profiles and analyze user data</p>
                  </div>
                </div>
              </div>

              <div
                className="p-4 rounded-xl backdrop-blur-lg border border-white/40 shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.25) 50%, rgba(255,255,255,0.15) 100%)',
                  boxShadow: '0 10px 40px 0 rgba(199, 210, 254, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(199,210,254,0.3) 100%)' }}
                  >
                    <svg className="w-6 h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base drop-shadow-sm">Analytics & Reporting</h3>
                    <p className="text-white/90 text-sm mt-0.5">Real-time insights and data analytics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
