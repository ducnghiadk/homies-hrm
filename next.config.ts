import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  // ─────────────────────────────────────────────────────────────────────────────
  // PERFORMANCE OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  // Enable React strict mode for better dev experience
  reactStrictMode: true,

  // Compress output
  compress: true,

  // Powerpack compiler for faster builds
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // IMAGE OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    path: '/_next/image',
    loader: 'default',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CODE SPLITTING & OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@supabase/supabase-js',
      'recharts',
      'date-fns',
      'sonner',
    ],

    // Enable server actions (for form submissions)
    serverActions: {
      bodySizeLimit: '2mb',
    },

    // Partial prerendering (beta)
    // ppr: true,

    // Scroll restoration
    scrollRestoration: true,

  },

  serverExternalPackages: ['nodemailer'],

  // ─────────────────────────────────────────────────────────────────────────────
  // HEADERS FOR PERFORMANCE
  // ─────────────────────────────────────────────────────────────────────────────

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // REDIRECTS & REWRITES
  // ─────────────────────────────────────────────────────────────────────────────

  async redirects() {
    return [
      // 1. Phê duyệt & Yêu cầu hợp nhất về /approvals
      { source: '/requests', destination: '/approvals', permanent: false },
      { source: '/leave/approval', destination: '/approvals', permanent: false },
      { source: '/attendance/requests', destination: '/approvals', permanent: false },
      { source: '/career-path/requests', destination: '/approvals', permanent: false },

      // 2. Xếp lịch & Định biên
      { source: '/schedules', destination: '/schedule', permanent: false },
      { source: '/schedule/by-shift', destination: '/schedule', permanent: false },
      { source: '/staffing', destination: '/settings/staffing', permanent: false },
      { source: '/staffing/workspace', destination: '/settings/staffing', permanent: false },

      // 3. Lộ trình sự nghiệp, Đánh giá & Vi phạm
      { source: '/career', destination: '/career-path', permanent: false },
      { source: '/evaluation', destination: '/kpi/review', permanent: false },
      { source: '/kpi/evaluate', destination: '/kpi/result', permanent: false },
      { source: '/kpi/leaderboard', destination: '/kpi/reports?view=leaderboard', permanent: false },
      { source: '/kpi/evaluate/trial', destination: '/kpi/development/challenges', permanent: false },
      { source: '/kpi/violations/batch', destination: '/kpi/violations/log', permanent: false },
      { source: '/kpi/violations/store', destination: '/kpi/violations', permanent: false },

      // 4. Lương & Phụ cấp
      { source: '/payroll/salary-slip', destination: '/payroll', permanent: false },
      { source: '/payroll/calculate', destination: '/payroll', permanent: false },
      { source: '/payroll/by-store', destination: '/payroll', permanent: false },
      { source: '/payroll/company', destination: '/payroll', permanent: false },
      { source: '/payroll/deductions', destination: '/payroll', permanent: false },
      { source: '/payroll/hold', destination: '/payroll', permanent: false },
      { source: '/payroll/insurance', destination: '/payroll', permanent: false },
      { source: '/payroll/bonus', destination: '/bsc-bonus', permanent: false },
      { source: '/settings/labor-cost', destination: '/settings/payroll', permanent: false },

      // 5. Cài đặt & Phân quyền
      { source: '/admin', destination: '/settings', permanent: false },
      { source: '/rbac', destination: '/settings/permissions', permanent: false },
      { source: '/offline-demo', destination: '/settings/system', permanent: false },
    ]
  },

  async rewrites() {
    return []
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBPACK OPTIMIZATION
  // ─────────────────────────────────────────────────────────────────────────────

  webpack: (config, { isServer, dev }) => {
    // Optimize bundle splitting
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunks
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    // Enable persistent caching for faster rebuilds
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      }
    }

    return config
  },
}

export default nextConfig
