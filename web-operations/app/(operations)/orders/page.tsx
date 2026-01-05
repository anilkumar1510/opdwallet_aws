import { Suspense } from 'react'
import OpsOrdersContent from './orders-content'

export default function OpsOrdersPage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    }>
      <OpsOrdersContent />
    </Suspense>
  )
}
