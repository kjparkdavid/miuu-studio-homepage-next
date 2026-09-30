import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'
import { analyticsPageLocation, trackPageView } from '@/lib/analytics'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Saves where the visitor came from on whichever page they land, for the Play link
  useEffect(() => {
    captureAttribution()
  }, [])

  // A page view for the landing, then one per in-site navigation
  useEffect(() => {
    let previous = analyticsPageLocation(window.location)
    trackPageView()
    const onRouteChange = () => {
      trackPageView(previous)
      previous = analyticsPageLocation(window.location)
    }
    router.events.on('routeChangeComplete', onRouteChange)
    return () => router.events.off('routeChangeComplete', onRouteChange)
  }, [router.events])

  return <Component {...pageProps} />
}
