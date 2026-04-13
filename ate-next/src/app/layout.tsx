import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from './components/ClientLayout'

export const metadata: Metadata = {
  title: 'ATE Platform — CRM',
  description: 'Alarm Transmission System — Internal CRM',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}