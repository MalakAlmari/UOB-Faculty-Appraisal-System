"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { BarChart3, Edit, CheckCircle, Award, FileText, LogOut } from "lucide-react"
import { ScrollArea } from "@radix-ui/react-scroll-area"

const facultyNavItems = [
  { href: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/faculty/appraisal/achievements", icon: Edit, label: "Update Achievements" },
  { href: "/faculty/appraisal/results", icon: CheckCircle, label: "Appraisal Results" },
  { href: "/faculty/analytics", icon: BarChart3, label: "Performance Analytics" },
  { href: "/faculty/achievements", icon: Award, label: "My Achievements" },
  { href: "/faculty/reports", icon: FileText, label: "Reports & Downloads" },
]

export function FacultySidebar() {
  const [isCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const userName = session?.user?.name || "Faculty User"
  const userEmail = session?.user?.email || ""

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-white",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b">
        <div className="text-[11px] font-semibold tracking-wider text-muted-foreground">
          Faculty
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted/60 ring-1 ring-border" />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-5 truncate">{userName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {userEmail}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="px-5 pt-3 pb-1 text-[11px] font-semibold tracking-wider bg-border">
          HOME
        </div>
        <nav className="mt-1 divide-y divide-border">
          {facultyNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center px-5 py-3",
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
    </div>
  )
}
