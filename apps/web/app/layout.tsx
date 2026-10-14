import '../styles/globals.css'
import { getLEARNHOUSE_TOP_DOMAIN_VAL, getLEARNHOUSE_TELEMETRY_DISABLED_VAL } from '@services/config/config'
import Script from 'next/script'
import Providers from '@components/Providers'
import { cookies } from 'next/headers'
import { Inter, Noto_Sans_Arabic } from 'next/font/google'
import { getDirection, localeCode } from '../lib/direction'

const isDevEnv = getLEARNHOUSE_TOP_DOMAIN_VAL() === 'localhost'
const isTelemetryDisabled = getLEARNHOUSE_TELEMETRY_DISABLED_VAL() === 'true'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-default',
})

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-arabic',
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // i18next-browser-languagedetector persists the active language in the
  // `i18next` cookie, so the server can render the correct lang + dir on the
  // very first paint — this is what prevents a flash of LTR under Arabic.
  const cookieStore = await cookies()
  const language = localeCode(cookieStore.get('i18next')?.value) || 'en'
  const direction = getDirection(language)

  return (
    <html
      className={`${inter.variable} ${notoArabic.variable}`}
      lang={language}
      dir={direction}
      suppressHydrationWarning
    >
      <head>
        {/* Synchronous script — blocks parsing to guarantee window.__RUNTIME_CONFIG__ exists before any JS runs.
            Next.js <Script strategy="beforeInteractive"> is not truly blocking in all browsers (Safari). */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/runtime-config.js" />
        {/* Prevent white flash on embed routes: set html+body bg before body is painted.
            Reads the optional ?bgcolor param (hex-validated) or defaults to dark. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/embed-bg.js" />
      </head>
      <body suppressHydrationWarning>
        {
            isDevEnv ? '' : isTelemetryDisabled ? '' :
                            <Script
                                data-website-id="a1af6d7a-9286-4a1f-8385-ddad2a29fcbb"
                                src="/umami/script.js"
                            />
        }
        <Providers>
          <main className="animate-fade-in">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
