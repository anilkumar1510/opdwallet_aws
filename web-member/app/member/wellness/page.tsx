'use client'

import { SparklesIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function WellnessPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/member" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Wellness Services</h1>
          <p className="text-gray-600 mt-2">Access wellness and preventive care services</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="text-center py-16">
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mb-6">
              <SparklesIcon className="h-10 w-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h2>
            <p className="text-gray-600 max-w-md mb-6">
              Wellness services are currently being set up. You'll be able to access wellness and preventive care benefits here soon.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-purple-800">
                <strong>What to expect:</strong> Access wellness programs, preventive care services, and health screenings.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
