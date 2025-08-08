import '../styles/globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'NSE Top Gainers (Last 1 Hour)', description: 'Top 50 NSE gainers over the last 60 minutes with industry filter' }
export default function RootLayout({ children }: { children: React.ReactNode }) { return (<html lang='en'><body>{children}</body></html>) }
