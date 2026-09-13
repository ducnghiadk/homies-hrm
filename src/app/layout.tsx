import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "@xyflow/react/dist/style.css"
import { Toaster } from "sonner"
import { HermesErrorBoundary } from "@/components/telemetry/HermesErrorBoundary"
import { TelemetryClientInit } from "@/components/telemetry/TelemetryClientInit"
import { DevCockpitWrapper } from "@/components/dev/DevCockpitWrapper"
import { HermesWidgetsWrapper } from "@/components/hermes/HermesWidgetsWrapper"

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Homies Milk Tea HRM",
  description: "Hệ thống quản lý nhân sự chuyên nghiệp cho Homies Milk Tea",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Homies HRM",
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
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning className={inter.className}>
        <TelemetryClientInit />
        <HermesErrorBoundary>
          {children}
        </HermesErrorBoundary>
        <DevCockpitWrapper />
        <HermesWidgetsWrapper />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
