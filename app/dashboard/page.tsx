import { getCurrentUser } from "@/lib/auth-utils"
import FacultyDashboard from "@/app/faculty/page"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  // The layout now guarantees the user is an instructor and is not null.
  return <FacultyDashboard  />
}
