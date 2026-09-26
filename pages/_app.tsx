import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'

export default function App({ Component, pageProps }: AppProps) {
  // Saves where the visitor came from on whichever page they land, for the Play link
  useEffect(() => {
    captureAttribution()
  }, [])

  return <Component {...pageProps} />
}
