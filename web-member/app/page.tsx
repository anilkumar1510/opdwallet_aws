'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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

      if (response.ok) {
        router.push('/member')
      } else {
        setError('Invalid credentials')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Your Benefits
            </h1>
            <p className="text-gray-600">
              Sign in to access your benefits and claims
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
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 transition-colors pr-12"
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

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-green-600 hover:text-green-500">
                  Forgot password?
                </a>
              </div>
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
              className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Links */}
            <div className="space-y-4 pt-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  New to OPD Wallet?{' '}
                  <a href="#" className="font-semibold text-gray-900 hover:underline">
                    Contact HR
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
            <div className="mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-medium">Demo Credentials:</p>
              <div className="text-xs sm:text-sm text-blue-700 mt-1 space-y-1">
                <p className="break-all">Member: john.doe@company.com / Member@123</p>
                <p className="break-all">Dependent: jane.doe@email.com / Dependent@123</p>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Section - Image/Illustration */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        {/* Placeholder for image - you can add your image here */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full max-w-2xl">
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-8">
              <div className="space-y-6">
                {/* Healthcare Benefits Card */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">Your Healthcare Benefits</h3>
                    <span className="text-sm text-gray-500">24/7 Access</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">OPD Coverage</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Easy Claims</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Family Coverage</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">100%</p>
                      <p className="text-xs text-gray-500">Coverage</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">24/7</p>
                      <p className="text-xs text-gray-500">Support</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">5min</p>
                      <p className="text-xs text-gray-500">Claim Time</p>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-300 rounded-full opacity-20"></div>
                <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-300 rounded-full opacity-20"></div>
              </div>
            </div>

            {/* Bottom Text */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm mb-4">Trusted by leading companies</p>
              <div className="flex justify-center items-center space-x-8">
                <div className="text-gray-400">
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="text-gray-400">
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="text-gray-400">
                  <div className="w-20 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note for image placement */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white p-3 rounded-lg text-xs">
          <p>Place your image at:</p>
          <p className="font-mono mt-1">/web-member/public/assets/images/login-page.jpg</p>
        </div>
      </div>
    </div>
  )
}