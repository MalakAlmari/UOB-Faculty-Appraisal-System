import type React from "react"
import FacultyLayout from "@/components/layout/faculty-layout"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <FacultyLayout>{children}</FacultyLayout>
}
