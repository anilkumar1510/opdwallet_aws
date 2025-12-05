'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PREDEFINED_CATEGORIES } from '@/lib/constants/categories'
import { SpecialtyMappingTab } from './components/SpecialtyMappingTab'
import { EmptyStateTab } from './components/EmptyStateTab'

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Service Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage services and specialty assignments by category
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="CAT001" className="w-full">
        <TabsList className="grid w-full grid-cols-8 bg-white border border-gray-200">
          {PREDEFINED_CATEGORIES.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="text-xs sm:text-sm data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
            >
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {PREDEFINED_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            {cat.hasSpecialties ? (
              <SpecialtyMappingTab
                categoryId={cat.id}
                categoryName={cat.fullName}
              />
            ) : (
              <EmptyStateTab categoryName={cat.fullName} categoryId={cat.id} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
