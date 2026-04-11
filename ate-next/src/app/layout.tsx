import type { Metadata } from 'next'
import './globals.css'
import Sidebar from './components/Sidebar'
import { LangProvider } from './lib/LangContext'

export const metadata: Metadata = {
  title: 'ATE Platform — CRM',
  description: 'Alarm Transmission System — Internal CRM',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <body>
        <LangProvider>
          <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'row-reverse' }}>
            <Sidebar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {children}
            </main>
          </div>
        </LangProvider>
      </body>
    </html>
  )
}