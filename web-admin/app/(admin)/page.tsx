import { cookies } from 'next/headers'
import AdminDashboardClient from './dashboard-client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Access cookies to ensure this is server-rendered at request time
  const cookieStore = await cookies()

  // This server component wraps the client component
  // It ensures the page is dynamically rendered, allowing middleware to run
  return <AdminDashboardClient />
}
