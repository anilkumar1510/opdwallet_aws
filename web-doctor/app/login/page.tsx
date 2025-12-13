'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { loginDoctor } from '@/lib/api/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const loginPayload = { email, password }

    try {
      const result = await loginDoctor(loginPayload)
      router.push('/doctorview')
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed. Please check your credentials.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gray-50">
        {/* Blue Header Strip with Logo */}
        <div style={{ backgroundColor: '#1E4A8D' }} className="w-full py-4 px-6">
          <img
            src="/doctor/logos/habit-logo-white.png"
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
                Welcome Doctor
              </h1>
              <p className="text-gray-600">
                Sign in to access your doctor portal
              </p>
              <p className="text-xs text-gray-400 mt-1">
                v1.0 - Secure Portal ✓
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
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563A8')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1E4A8D')}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Links */}
              <div className="space-y-4 pt-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Need help?{' '}
                    <a href="#" className="font-semibold text-gray-900 hover:underline">
                      Contact Support
                    </a>
                  </p>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(30, 74, 141, 0.1)' }}>
                <p className="text-sm font-medium" style={{ color: '#1E4A8D' }}>Demo Credentials:</p>
                <p className="text-sm mt-1" style={{ color: '#2563A8' }}>
                  Email: doctor@opdwallet.com<br />
                  Password: Doctor@123
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Section - Information */}
      <div className="hidden lg:block lg:w-1/2" style={{ background: 'linear-gradient(to bottom right, #1E4A8D, #2563A8, #1E4A8D)' }}>
        <div className="h-full flex items-center justify-center py-8 px-10">
          <div className="text-white max-w-lg w-full">
            {/* Doctor Illustration */}
            <div className="flex justify-center mb-6">
              <img
                src="/doctor/logos/Doctor.png"
                alt="Doctor Illustration"
                className="max-w-sm w-full h-auto object-contain"
                style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))' }}
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
                Doctor Portal
              </h2>
              <p className="text-lg text-white opacity-95 leading-relaxed px-2">
                Comprehensive patient care management platform
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base drop-shadow-sm">Patient Management</h3>
                    <p className="text-white/90 text-sm mt-0.5">Complete patient records and history</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base drop-shadow-sm">Appointment Scheduling</h3>
                    <p className="text-white/90 text-sm mt-0.5">Manage appointments and availability</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base drop-shadow-sm">Digital Prescriptions</h3>
                    <p className="text-white/90 text-sm mt-0.5">Create and manage e-prescriptions</p>
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
