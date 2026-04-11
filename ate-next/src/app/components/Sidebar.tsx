'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLang } from '../lib/LangContext'

const navItems = [
  { section: { ar: 'الرئيسية', en: 'MAIN' }, items: [
    { id: 'dashboard', ar: 'لوحة التحكم', en: 'Dashboard',    icon: '📊', href: '/' },
  ]},
  { section: { ar: 'العمليات', en: 'OPERATIONS' }, items: [
    { id: 'clients',  ar: 'العملاء',    en: 'Clients',      icon: '👥', href: '/clients',  badge: '248', badgeColor: 'blue' },
    { id: 'requests', ar: 'الطلبات',    en: 'Requests',     icon: '📋', href: '/requests', badge: '12',  badgeColor: 'red' },
    { id: 'pipeline', ar: 'Pipeline',   en: 'Pipeline',     icon: '🔄', href: '/pipeline' },
    { id: 'map', ar: 'الخريطة', en: 'Map', icon: '🗺️', href: '/map' },
  ]},
  { section: { ar: 'المالية', en: 'FINANCE' }, items: [
    { id: 'invoices', ar: 'الفواتير',   en: 'Invoices',     icon: '💰', href: '/invoices', badge: '8', badgeColor: 'yellow' },
    { id: 'payments', ar: 'المدفوعات', en: 'Payments',     icon: '💳', href: '/payments' },
  ]},
  { section: { ar: 'التشغيل', en: 'OPERATIONS' }, items: [
    { id: 'schedule', ar: 'الجدولة',    en: 'Schedule',     icon: '📅', href: '/schedule' },
    { id: 'certs',    ar: 'الشهادات',   en: 'Certs',        icon: '📜', href: '/certs',   badge: '3', badgeColor: 'green' },
    { id: 'docs',     ar: 'المستندات',  en: 'Documents',    icon: '📁', href: '/docs',    badge: '5', badgeColor: 'red' },
  ]},
  { section: { ar: 'الفريق', en: 'TEAM' }, items: [
    { id: 'team',    ar: 'الفنيون',    en: 'Technicians',  icon: '👷', href: '/team' },
    { id: 'reports', ar: 'التقارير',   en: 'Reports',      icon: '📈', href: '/reports' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const [active, setActive] = useState('dashboard')
  const { lang, setLang, t } = useLang()

  useEffect(() => {
    const match = navItems.flatMap(s => s.items).find(item => item.href === pathname)
    if (match) setActive(match.id)
  }, [pathname])

  return (
    <aside style={{
      width: '240px', flexShrink: 0, background: '#1a202c',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: '22px 18px 18px',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg,#e53e3e,#dd6b20)',
          borderRadius: '9px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px',
          boxShadow: '0 0 14px rgba(229,62,62,.4)',
        }}>🔔</div>
        <div>
          <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '17px', fontWeight: 700, letterSpacing: '3px', color: '#fff' }}>ATE</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.4)', letterSpacing: '1px' }}>
            {t('نظام إدارة الإنذارات', 'ALARM MGMT SYSTEM')}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {navItems.map(section => (
          <div key={section.section.ar}>
            <div style={{
              fontSize: '9px', color: 'rgba(255,255,255,.3)',
              letterSpacing: '2px', textTransform: 'uppercase',
              padding: '12px 18px 5px', fontFamily: 'Rajdhani,sans-serif',
            }}>
              {lang === 'ar' ? section.section.ar : section.section.en}
            </div>

            {section.items.map(item => (
              <a key={item.id} href={item.href} onClick={() => setActive(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 18px', cursor: 'pointer',
                color: active === item.id ? '#fff' : 'rgba(255,255,255,.55)',
                fontSize: '13px', margin: '1px 8px', borderRadius: '8px',
                border: active === item.id ? '1px solid rgba(229,62,62,.3)' : '1px solid transparent',
                background: active === item.id ? 'linear-gradient(135deg,rgba(229,62,62,.2),rgba(221,107,32,.12))' : 'transparent',
                fontWeight: active === item.id ? 700 : 400,
                textDecoration: 'none', transition: 'all .2s',
              }}>
                <span style={{ fontSize: '15px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{lang === 'ar' ? item.ar : item.en}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '9px', fontFamily: 'monospace',
                    padding: '2px 6px', borderRadius: '8px', fontWeight: 600,
                    background: item.badgeColor === 'red'    ? 'rgba(229,62,62,.25)'  :
                                item.badgeColor === 'blue'   ? 'rgba(49,130,206,.2)'  :
                                item.badgeColor === 'yellow' ? 'rgba(214,158,46,.2)'  :
                                'rgba(56,161,105,.2)',
                    color:      item.badgeColor === 'red'    ? '#fc8181' :
                                item.badgeColor === 'blue'   ? '#90cdf4' :
                                item.badgeColor === 'yellow' ? '#f6e05e' :
                                '#68d391',
                  }}>{item.badge}</span>
                )}
              </a>
            ))}
          </div>
        ))}
      </nav>

      {/* Language Toggle */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: '8px', overflow: 'hidden',
        }}>
          <button onClick={() => setLang('ar')} style={{
            flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
            background: lang === 'ar' ? 'rgba(229,62,62,.5)' : 'transparent',
            color: '#fff', fontSize: '12px', fontWeight: lang === 'ar' ? 700 : 400,
            fontFamily: 'Tajawal,sans-serif', transition: 'all .2s',
          }}>العربية</button>
          <button onClick={() => setLang('en')} style={{
            flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
            background: lang === 'en' ? 'rgba(229,62,62,.5)' : 'transparent',
            color: '#fff', fontSize: '12px', fontWeight: lang === 'en' ? 700 : 400,
            fontFamily: 'Tajawal,sans-serif', transition: 'all .2s',
          }}>English</button>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '9px 10px', background: 'rgba(255,255,255,.06)',
          borderRadius: '8px', border: '1px solid rgba(255,255,255,.08)',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#e53e3e,#dd6b20)',
            fontSize: '12px', fontWeight: 700, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>م</div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
              {t('محمد الأمير', 'Mohammed Al-Amir')}
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.4)' }}>
              {t('مدير النظام', 'System Admin')} · Admin
            </div>
          </div>
        </div>
      </div>

    </aside>
  )
}