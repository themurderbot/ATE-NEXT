'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { LangProvider } from '../lib/LangContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  if (isLogin) {
    return <LangProvider>{children}</LangProvider>
  }

  return (
    <LangProvider>
      <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'row-reverse' }}>
        <Sidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </LangProvider>
  )
}