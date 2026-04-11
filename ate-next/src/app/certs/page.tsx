'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Cert = {
  id: string
  cert_ref: string
  status: string
  issue_date: string
  expiry_date: string
  device_serial: string
  clients?: { company_name: string }
  properties?: { property_name: string }
  technicians?: { full_name: string; tech_code: string }
}

export default function CertsPage() {
  const { t, dir } = useLang()
  const [certs, setCerts]   = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)

  const statusLabel: Record<string, string> = {
    active:        t('● سارية',          '● Active'),
    expiring_soon: t('⚠ تنتهي قريباً',  '⚠ Expiring Soon'),
    expired:       t('✕ منتهية',         '✕ Expired'),
    renewed:       t('↺ مجددة',          '↺ Renewed'),
  }
  const statusColor: Record<string, string> = {
    active: '#38a169', expiring_soon: '#d69e2e', expired: '#e53e3e', renewed: '#3182ce',
  }
  const statusBg: Record<string, string> = {
    active: 'rgba(56,161,105,.1)', expiring_soon: 'rgba(214,158,46,.1)',
    expired: 'rgba(229,62,62,.1)', renewed: 'rgba(49,130,206,.1)',
  }

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('certificates')
      .select('*, clients(company_name), properties(property_name), technicians(full_name, tech_code)')
      .order('created_at', { ascending: false })
    if (data) setCerts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const kpis = [
    { label: t('إجمالي الشهادات', 'Total Certs'),    value: certs.length,                                    color: '#3182ce', gradient: 'linear-gradient(90deg,#3182ce,#805ad5)', icon: '📜' },
    { label: t('سارية',           'Active'),          value: certs.filter(c => c.status === 'active').length, color: '#38a169', gradient: 'linear-gradient(90deg,#38a169,#0099cc)', icon: '✅' },
    { label: t('تنتهي قريباً',    'Expiring Soon'),   value: certs.filter(c => c.status === 'expiring_soon').length, color: '#d69e2e', gradient: 'linear-gradient(90deg,#d69e2e,#dd6b20)', icon: '⚠️' },
    { label: t('منتهية',          'Expired'),         value: certs.filter(c => c.status === 'expired').length, color: '#e53e3e', gradient: 'linear-gradient(90deg,#e53e3e,#c53030)', icon: '✕' },
  ]

  const tableHeaders = [
    t('رقم الشهادة', 'Cert #'),
    t('العميل', 'Client'),
    t('العقار', 'Property'),
    t('S/N الجهاز', 'Device S/N'),
    t('تاريخ الإصدار', 'Issue Date'),
    t('تاريخ الانتهاء', 'Expiry Date'),
    t('الفني', 'Technician'),
    t('الحالة', 'Status'),
    t('إجراءات', 'Actions'),
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="الشهادات" titleEn="Certificates" />

      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a202c' }}>
              📜 {t('إصدار وإدارة الشهادات', 'Certificate Management')}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
              {certs.length} {t('شهادة إجمالاً', 'total certificates')}
            </div>
          </div>
          <button style={{ background: 'linear-gradient(135deg,#b7791f,#d69e2e)', color: '#fff', fontWeight: 700, padding: '9px 18px', borderRadius: '9px', border: 'none', fontSize: '13px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
            ＋ {t('إصدار شهادة جديدة', 'Issue New Certificate')}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
              <div style={{ fontSize: '20px', marginBottom: '10px' }}>{k.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: k.color, lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>{k.label}</div>
              <div style={{ height: '3px', background: k.gradient, borderRadius: '2px', marginTop: '12px' }}></div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{t('سجل الشهادات الصادرة', 'Issued Certificates')}</span>
            <span style={{ fontSize: '11px', color: '#a0aec0' }}>{certs.length} {t('شهادة', 'certs')}</span>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>⏳ {t('جارٍ التحميل...', 'Loading...')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7fafc' }}>
                    {tableHeaders.map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'right', fontSize: '10px', color: '#a0aec0', letterSpacing: '1px', fontFamily: 'IBM Plex Mono,monospace', borderBottom: '2px solid #e2e5ea', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {certs.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fffff0')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}
                    >
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', color: '#b7791f', fontSize: '11px', fontWeight: 700 }}>{c.cert_ref || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{c.clients?.company_name || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#718096' }}>{c.properties?.property_name || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: '#4a5568' }}>{c.device_serial || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: '#718096' }}>{c.issue_date || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: c.status === 'expired' ? '#e53e3e' : c.status === 'expiring_soon' ? '#d69e2e' : '#38a169' }}>{c.expiry_date || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '11px', color: '#4a5568' }}>{c.technicians?.full_name || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: statusBg[c.status], color: statusColor[c.status], fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', border: `1px solid ${statusColor[c.status]}33`, whiteSpace: 'nowrap' }}>
                          {statusLabel[c.status]}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #e2e5ea', background: 'transparent', fontSize: '11px', fontWeight: 700, color: '#4a5568', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>PDF</button>
                          {(c.status === 'expiring_soon' || c.status === 'expired') && (
                            <button style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#d69e2e,#b7791f)', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                              {t('تجديد', 'Renew')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: '10px 18px', borderTop: '1px solid #e2e5ea', fontSize: '11px', color: '#a0aec0' }}>
            {t('عرض', 'Showing')} {certs.length} {t('شهادة', 'certificates')}
          </div>
        </div>
      </div>
    </div>
  )
}