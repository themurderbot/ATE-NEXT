'use client'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Topbar from './components/Topbar'
import { useLang } from './lib/LangContext'

export default function Dashboard() {
  const { t, lang, dir } = useLang()
  const [totalClients, setTotalClients]   = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)
  const [pendingInvoices, setPendingInvoices] = useState(0)
  const [activeCerts, setActiveCerts]     = useState(0)
  const [expiringSoon, setExpiringSoon]   = useState(0)
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [recentCerts, setRecentCerts]     = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [
        { count: c1 }, { count: c2 }, { count: c3 },
        { count: c4 }, { count: c5 },
        { data: rr }, { data: rc },
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('requests').select('*', { count: 'exact', head: true }).eq('stage', 'new'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'expiring_soon'),
        supabase.from('requests').select('*, clients(company_name), properties(property_name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('certificates').select('*, clients(company_name)').eq('status', 'expiring_soon').limit(3),
      ])
      setTotalClients(c1 || 0)
      setPendingRequests(c2 || 0)
      setPendingInvoices(c3 || 0)
      setActiveCerts(c4 || 0)
      setExpiringSoon(c5 || 0)
      setRecentRequests(rr || [])
      setRecentCerts(rc || [])
    }
    load()
  }, [])

  const stageLabel: Record<string, string> = {
    new:              t('① طلب جديد',       '① New Request'),
    awaiting_payment: t('② بانتظار الدفع',  '② Awaiting Payment'),
    scheduled:        t('③ مجدول',          '③ Scheduled'),
    installed:        t('④ تم التركيب',     '④ Installed'),
    certified:        t('⑤ شهادة صادرة',    '⑤ Certified'),
  }

  const stageColor: Record<string, string> = {
    new: '#718096', awaiting_payment: '#3182ce',
    scheduled: '#d69e2e', installed: '#dd6b20', certified: '#38a169',
  }

  const kpis = [
    { label: t('إجمالي العملاء',  'Total Clients'),   value: totalClients,    color: '#38a169', gradient: 'linear-gradient(90deg,#38a169,#0099cc)', icon: '👥', change: t('▲ +12 هذا الشهر', '▲ +12 this month'), changeColor: '#38a169', href: '/clients' },
    { label: t('طلبات جديدة',     'New Requests'),    value: pendingRequests, color: '#e53e3e', gradient: 'linear-gradient(90deg,#e53e3e,#dd6b20)', icon: '📋', change: t('بانتظار المعالجة', 'Pending review'),   changeColor: '#e53e3e', href: '/requests' },
    { label: t('فواتير مستحقة',   'Pending Invoices'),value: pendingInvoices, color: '#d69e2e', gradient: 'linear-gradient(90deg,#d69e2e,#dd6b20)', icon: '💰', change: t('بانتظار التحصيل', 'Awaiting payment'),  changeColor: '#d69e2e', href: '/invoices' },
    { label: t('شهادات سارية',    'Active Certs'),    value: activeCerts,     color: '#3182ce', gradient: 'linear-gradient(90deg,#3182ce,#805ad5)', icon: '📜', change: `${expiringSoon} ${t('تنتهي قريباً', 'expiring soon')}`, changeColor: '#d69e2e', href: '/certs' },
  ]

  const quickLinks = [
    { label: t('العملاء',  'Clients'),  icon: '👥', href: '/clients',  color: '#3182ce' },
    { label: t('الطلبات',  'Requests'), icon: '📋', href: '/requests', color: '#e53e3e' },
    { label: t('الفواتير', 'Invoices'), icon: '💰', href: '/invoices', color: '#d69e2e' },
    { label: t('الشهادات', 'Certs'),    icon: '📜', href: '/certs',    color: '#b7791f' },
    { label: t('الفنيون',  'Team'),     icon: '👷', href: '/team',     color: '#38a169' },
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>

      <Topbar title="لوحة التحكم" titleEn="Dashboard" />

      <div style={{ padding: '24px' }}>

        {/* GREETING */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a202c' }}>
              {t('مرحباً، محمد 👋', 'Welcome, Mohammed 👋')}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
              {t('إليك ملخص النظام اليوم', "Here's your system summary today")}
            </div>
          </div>
          <a href="/requests" style={{
            background: 'linear-gradient(135deg,#3182ce,#2b6cb0)',
            color: '#fff', fontWeight: 700, padding: '9px 18px',
            borderRadius: '9px', border: 'none', fontSize: '13px',
            cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
          }}>
            {t('＋ طلب جديد', '＋ New Request')}
          </a>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
          {kpis.map((kpi, i) => (
            <a key={i} href={kpi.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#fff', borderRadius: '12px', padding: '18px',
                boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea',
                cursor: 'pointer', transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{kpi.icon}</div>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: `${kpi.changeColor}15`, color: kpi.changeColor }}>{kpi.change}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: kpi.color, lineHeight: 1, marginBottom: '4px' }}>{kpi.value}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>{kpi.label}</div>
                <div style={{ height: '3px', background: kpi.gradient, borderRadius: '2px', marginTop: '12px' }}></div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* RECENT REQUESTS */}
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>📋 {t('آخر الطلبات', 'Recent Requests')}</span>
              <a href="/requests" style={{ fontSize: '11px', color: '#3182ce', fontWeight: 700, textDecoration: 'none' }}>{t('عرض الكل ←', '→ View All')}</a>
            </div>
            <div>
              {recentRequests.map((r: any) => (
                <div key={r.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#1a202c' }}>{r.clients?.company_name || '—'}</div>
                    <div style={{ fontSize: '10px', color: '#a0aec0', fontFamily: 'IBM Plex Mono,monospace', marginTop: '1px' }}>{r.request_code}</div>
                  </div>
                  <span style={{
                    background: `${stageColor[r.stage]}15`, color: stageColor[r.stage],
                    fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
                    border: `1px solid ${stageColor[r.stage]}33`, whiteSpace: 'nowrap',
                  }}>{stageLabel[r.stage]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* EXPIRING CERTS */}
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>⚠️ {t('شهادات تنتهي قريباً', 'Expiring Certs')}</span>
              <a href="/certs" style={{ fontSize: '11px', color: '#3182ce', fontWeight: 700, textDecoration: 'none' }}>{t('إدارة الشهادات ←', '→ Manage Certs')}</a>
            </div>
            <div>
              {recentCerts.length > 0 ? recentCerts.map((c: any) => (
                <div key={c.id} style={{ padding: '12px 18px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#1a202c' }}>{c.clients?.company_name || '—'}</div>
                    <div style={{ fontSize: '10px', color: '#a0aec0', fontFamily: 'IBM Plex Mono,monospace', marginTop: '1px' }}>
                      {c.cert_ref} · {t('تنتهي', 'Expires')} {c.expiry_date}
                    </div>
                  </div>
                  <a href="/certs" style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#d69e2e,#b7791f)', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                    {t('تجديد', 'Renew')}
                  </a>
                </div>
              )) : (
                <div style={{ padding: '30px', textAlign: 'center', color: '#a0aec0', fontSize: '12px' }}>
                  ✅ {t('لا توجد شهادات تنتهي قريباً', 'No expiring certs')}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* QUICK LINKS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
          {quickLinks.map((link, i) => (
            <a key={i} href={link.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', textAlign: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{link.icon}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: link.color }}>{link.label}</div>
              </div>
            </a>
          ))}
        </div>

      </div>
    </div>
  )
}