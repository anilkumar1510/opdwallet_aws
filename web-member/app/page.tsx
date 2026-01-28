'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MemberLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/member')
      } else {
        // Handle nested message object from API error responses
        const errorMessage = typeof data.message === 'string'
          ? data.message
          : data.message?.message || data.error || 'Invalid credentials'
        setError(errorMessage)
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Blue Header Strip with Logo - Always visible */}
      <div style={{ backgroundColor: '#1E4A8D' }} className="w-full py-3 px-4 sm:py-4 sm:px-6">
        <img
          src="/logos/habit-logo-white.png"
          alt="Habit Health - Powered by HCL Healthcare"
          className="h-10 sm:h-12 w-auto"
        />
      </div>

      {/* Main Content - Flex on desktop, stacked on mobile */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Top/Left Section - Brand & Info (visible on mobile first) */}
        <div className="w-full lg:w-1/2 order-1 lg:order-2" style={{ background: 'linear-gradient(to bottom right, #1E4A8D, #2563A8, #1E4A8D)' }}>
          <div className="h-full flex items-center justify-center py-3 px-4 sm:py-8 sm:px-6 lg:px-10">
            <div className="text-white w-full max-w-lg">
              {/* Member Illustration */}
              <div className="flex justify-center mb-2 sm:mb-6">
                <img
                  src="/logos/Member.png"
                  alt="Member Illustration"
                  className="w-32 sm:w-64 lg:w-full lg:max-w-sm h-auto object-contain"
                  style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }}
                />
              </div>

              {/* Heading with Gradient Text Effect */}
              <div className="text-center mb-2 sm:mb-6">
                <h2
                  className="text-xl sm:text-3xl lg:text-4xl font-black mb-1 sm:mb-3 tracking-tight leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #C7D2FE 50%, #FFFFFF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4))'
                  }}
                >
                  Member Portal
                </h2>
                <p className="hidden sm:block text-sm sm:text-base lg:text-lg text-white opacity-95 leading-relaxed px-2">
                  Your complete healthcare benefits platform
                </p>
              </div>

              {/* Feature Cards with Radiant Gradient */}
              <div className="space-y-1.5 sm:space-y-3">
                <div
                  className="p-3 sm:p-4 rounded-xl backdrop-blur-lg border border-white/40 shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.25) 50%, rgba(255,255,255,0.15) 100%)',
                    boxShadow: '0 10px 40px 0 rgba(199, 210, 254, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(199,210,254,0.3) 100%)' }}
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm sm:text-base drop-shadow-sm">OPD Coverage</h3>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5">Complete outpatient care benefits</p>
                    </div>
                  </div>
                </div>

                {/* Hidden on mobile, visible on tablet and above */}
                <div
                  className="hidden sm:block p-3 sm:p-4 rounded-xl backdrop-blur-lg border border-white/40 shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.25) 50%, rgba(255,255,255,0.15) 100%)',
                    boxShadow: '0 10px 40px 0 rgba(199, 210, 254, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(199,210,254,0.3) 100%)' }}
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm sm:text-base drop-shadow-sm">Easy Claims</h3>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5">Quick and hassle-free claim process</p>
                    </div>
                  </div>
                </div>

                {/* Hidden on mobile, visible on tablet and above */}
                <div
                  className="hidden sm:block p-3 sm:p-4 rounded-xl backdrop-blur-lg border border-white/40 shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.25) 50%, rgba(255,255,255,0.15) 100%)',
                    boxShadow: '0 10px 40px 0 rgba(199, 210, 254, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(199,210,254,0.3) 100%)' }}
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-sm sm:text-base drop-shadow-sm">Family Coverage</h3>
                      <p className="text-white/90 text-xs sm:text-sm mt-0.5">Manage family health benefits</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom/Right Section - Login Form */}
        <div className="w-full lg:w-1/2 order-2 lg:order-1 flex items-center justify-center bg-gray-50 px-4 py-3 sm:px-6 sm:py-8 lg:py-12">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="mb-3 sm:mb-8">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Welcome Member
              </h1>
              <p className="hidden sm:block text-sm sm:text-base text-gray-600">
                Sign in to access your benefits portal
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
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
                  className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-colors text-sm sm:text-base"
                  style={{ borderColor: '#d1d5db' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1E4A8D';
                    e.target.style.boxShadow = '0 0 0 3px rgba(30, 74, 141, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  disabled={loading}
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
                    className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 transition-colors pr-12 text-sm sm:text-base"
                    style={{ borderColor: '#d1d5db' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1E4A8D';
                      e.target.style.boxShadow = '0 0 0 3px rgba(30, 74, 141, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    disabled={loading}
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

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 px-4 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                style={{ backgroundColor: '#1E4A8D' }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563A8')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1E4A8D')}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Links - Hidden on mobile */}
              <div className="hidden sm:block space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Need help?{' '}
                    <a href="#" className="font-semibold text-gray-900 hover:underline">
                      Contact Support
                    </a>
                  </p>
                </div>
              </div>

              {/* Demo Credentials - Hidden on mobile */}
              <div className="hidden sm:block mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg" style={{ backgroundColor: 'rgba(30, 74, 141, 0.1)' }}>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#1E4A8D' }}>Demo Credentials:</p>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#2563A8' }}>
                  Email: john.doe@company.com<br />
                  Password: Member@123
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
