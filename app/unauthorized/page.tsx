import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">Access Denied</CardTitle>
          <CardDescription>You don't have permission to access this resource.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-6">
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/auth/signin">Sign In Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
