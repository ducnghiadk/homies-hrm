import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { HermesErrorBoundary } from "@/components/telemetry/HermesErrorBoundary"
import { TelemetryClientInit } from "@/components/telemetry/TelemetryClientInit"
import { DevCockpitWrapper } from "@/components/dev/DevCockpitWrapper"

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "HRM Trà Sữa 🧋",
  description: "Hệ thống quản lý nhân sự chuỗi trà sữa - Chấm công, Xếp lịch, KPI, Gamification",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HRM Trà Sữa",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6B35",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={inter.className}>
        <TelemetryClientInit />
        <HermesErrorBoundary>
          {children}
        </HermesErrorBoundary>
        <DevCockpitWrapper />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
