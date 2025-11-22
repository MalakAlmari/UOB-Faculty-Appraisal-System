import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthSessionProvider } from "@/components/auth/session-provider"
import { Suspense } from "react"
import "./globals.css"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: "Faculty Appraisal System",
  description: "University Faculty Performance Management Portal",
  generator: "we",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
