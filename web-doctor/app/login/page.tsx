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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    console.log('🚀 [LOGIN PAGE] ========== DOCTOR LOGIN FLOW START ==========')
    console.log('⏰ [LOGIN PAGE] Timestamp:', new Date().toISOString())
    console.log('📍 [LOGIN PAGE] Current page URL:', window.location.href)
    console.log('🌐 [LOGIN PAGE] Browser info:', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    })

    console.log('📋 [FORM STATE] Before submission:')
    console.log('   📧 Email:', email)
    console.log('   📧 Email length:', email.length)
    console.log('   📧 Email valid format:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    console.log('   🔐 Password:', password.replace(/./g, '*'))
    console.log('   🔐 Password length:', password.length)
    console.log('   🔐 Has password:', !!password)
    console.log('   ⚙️ Loading state before:', loading)
    console.log('   ⚠️ Error state before:', error)

    console.log('🧹 [STATE UPDATE] Clearing error state...')
    setError('')
    console.log('⏳ [STATE UPDATE] Setting loading to true...')
    setLoading(true)

    console.log('🔍 [ENVIRONMENT] Checking environment variables:')
    console.log('   NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET')
    console.log('   NODE_ENV:', process.env.NODE_ENV)

    console.log('🍪 [COOKIES] Current document.cookie:', document.cookie || 'NO COOKIES')

    const loginPayload = { email, password }
    console.log('📦 [PAYLOAD] Login payload prepared:', {
      email: loginPayload.email,
      passwordLength: loginPayload.password.length,
      hasPassword: !!loginPayload.password
    })

    try {
      console.log('📞 [API CALL] Calling loginDoctor function...')
      const apiCallStartTime = Date.now()

      const result = await loginDoctor(loginPayload)

      const apiCallDuration = Date.now() - apiCallStartTime
      console.log(`✅ [API CALL] Login API call completed in ${apiCallDuration}ms`)
      console.log('🎉 [SUCCESS] Login successful!')
      console.log('📦 [RESPONSE] Full result:', JSON.stringify(result, null, 2))
      console.log('👤 [DOCTOR INFO] Logged in as:', {
        doctorId: result.doctor?.doctorId,
        name: result.doctor?.name,
        email: result.doctor?.email,
        specialty: result.doctor?.specialty,
        role: result.doctor?.role
      })

      console.log('🍪 [COOKIES] After login, document.cookie:', document.cookie || 'NO COOKIES')
      console.log('🍪 [COOKIES] Session cookie check:', document.cookie.includes('opd_session') ? 'FOUND' : 'NOT FOUND')

      console.log('🔄 [NAVIGATION] Preparing to redirect to /doctorview...')
      console.log('🔄 [NAVIGATION] Router ready:', !!router)

      router.push('/doctorview')
      console.log('✅ [NAVIGATION] Redirect initiated successfully')

    } catch (err: any) {
      const apiCallDuration = Date.now() - Date.now()
      console.error(`❌ [ERROR] Login failed after ${apiCallDuration}ms`)
      console.error('❌ [ERROR] Error occurred during login')
      console.error('❌ [ERROR] Error type:', typeof err)
      console.error('❌ [ERROR] Error name:', err.name)
      console.error('❌ [ERROR] Error message:', err.message)
      console.error('❌ [ERROR] Error stack:', err.stack)
      console.error('❌ [ERROR] Error toString:', err.toString())
      console.error('❌ [ERROR] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
      console.error('❌ [ERROR] Error constructor:', err.constructor?.name)

      if (err.cause) {
        console.error('❌ [ERROR] Error cause:', err.cause)
      }

      const errorMessage = err.message || 'Login failed. Please check your credentials.'
      console.error('❌ [ERROR] Setting error message to:', errorMessage)
      setError(errorMessage)

    } finally {
      console.log('🏁 [CLEANUP] Finally block executing...')
      console.log('⏳ [STATE UPDATE] Setting loading to false...')
      setLoading(false)
      console.log('📊 [FINAL STATE] Loading:', false)
      console.log('📊 [FINAL STATE] Error:', error || 'NONE')
      console.log('🎬 [LOGIN PAGE] ========== DOCTOR LOGIN FLOW END ==========')
      console.log('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 flex items-center justify-center">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Doctor Portal
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to access your dashboard
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="doctor@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          OPD Wallet Doctor Portal v1.0
        </div>
      </div>
    </div>
  )
}
