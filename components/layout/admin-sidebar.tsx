"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Home,
  Users,
  Building2,
  Calendar,
  Award,
  FileText,
  MessageSquare,
  BarChart,
  Shield,
  Settings,
  LogOut,
} from "lucide-react"
import { ScrollArea } from "@radix-ui/react-scroll-area"

const adminNavItems = [
  { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/structure", icon: Building2, label: "Structure" },
  { href: "/admin/cycles", icon: Calendar, label: "Cycles" },
  { href: "/admin/grading", icon: Award, label: "Grading" },
  { href: "/admin/appraisals", icon: FileText, label: "Appraisals" },
  { href: "/admin/appeals", icon: MessageSquare, label: "Appeals Center" },
  { href: "/admin/reports", icon: BarChart, label: "Reports" },
  { href: "/admin/audit", icon: Shield, label: "Audit Log" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export function AdminSidebar() {
  const [isCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const userId = (session?.user as any)?.id // تأكد أن الـsession يُرجع id
  const userName = session?.user?.name || "Admin User"
  const userEmail = session?.user?.email || ""

  // dialogs state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)

  // forms state
  const [emailForm, setEmailForm] = useState<{ email: string }>({ email: "" })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // handlers
  const handleUpdateEmail = async () => {
    setError("")
    if (!userId) {
      setError("User id not found in session")
      return
    }
    if (!/^[A-Za-z0-9._%+-]+@uob\.edu$/.test(emailForm.email)) {
      setError("Email must end with @uob.edu")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForm.email }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to update email")
      setEmailDialogOpen(false)
    } catch (e: any) {
      setError(e.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    setError("")
    if (!userId) {
      setError("User id not found in session")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match")
      return
    }
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError("Please fill all password fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to update password")

      setPasswordDialogOpen(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (e: any) {
      setError(e.message || "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex h-full flex-col bg-white", isCollapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="px-5 py-4 border-b">
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground">
          Admin
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted/60 ring-1 ring-border" />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-5 truncate">{userName}</div>
            <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="px-5 pt-3 pb-1 text-[11px] font-semibold tracking-wider bg-border">
          HOME
        </div>
        <nav className="mt-1 divide-y divide-border">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-5 py-3",
                  "text-[15px] leading-5 transition-colors",
                  isActive
                    ? "bg-muted/40 text-foreground"
                    : "hover:bg-muted/30 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="my-4 h-px bg-border mx-5" />

        <div className="px-5 pt-3 pb-1 text-[11px] font-semibold tracking-wider bg-border">
          ACC. SETTINGS
        </div>

        <ul className="mt-1 mb-2 divide-y divide-border">
          <li>
            <button
              onClick={() => {
                setError("")
                setEmailForm({ email: "" })
                setEmailDialogOpen(true)
              }}
              className="block w-full text-left px-5 py-3 text-[15px] text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            >
              Change Email
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                setError("")
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                setPasswordDialogOpen(true)
              }}
              className="block w-full text-left px-5 py-3 text-[15px] text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            >
              Change Password
            </button>
          </li>
        </ul>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground",
            isCollapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>

      {/* Change Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>Update your account email (must end with @uob.edu)</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email</Label>
            <Input
              id="newEmail"
              type="email"
              value={emailForm.email}
              onChange={(e) => setEmailForm({ email: e.target.value })}
              placeholder="user@uob.edu"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmail} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current and new password.</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
