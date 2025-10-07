import DoctorNavigation from '@/components/DoctorNavigation'

export default function DoctorViewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavigation />
      <main className="pt-16 md:pt-20">
        {children}
      </main>
    </div>
  )
}
