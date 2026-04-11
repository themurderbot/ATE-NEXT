'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Request = {
  id: string
  request_code: string
  stage: string
  devices_count: number
  total_amount: number
  created_at: string
  clients?: { company_name: string }
  properties?: { property_name: string; district: string }
}

export default function RequestsPage() {
  const { t, dir } = useLang()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading]   = useState(true)

  const stageLabel: Record<string, string> = {
    new:              t('① طلب جديد',      '① New Request'),
    awaiting_payment: t('② بانتظار الدفع', '② Awaiting Payment'),
    scheduled:        t('③ مجدول',         '③ Scheduled'),
    installed:        t('④ تم التركيب',    '④ Installed'),
    certified:        t('⑤ شهادة صادرة',   '⑤ Certified'),
  }
  const stageShort: Record<string, string> = {
    new:              t('طلب جديد',      'New'),
    awaiting_payment: t('بانتظار الدفع', 'Awaiting Payment'),
    scheduled:        t('مجدول',         'Scheduled'),
    installed:        t('تم التركيب',    'Installed'),
    certified:        t('شهادة صادرة',   'Certified'),
  }
  const stageColor: Record<string, string> = {
    new: '#718096', awaiting_payment: '#3182ce',
    scheduled: '#d69e2e', installed: '#dd6b20', certified: '#38a169',
  }
  const stageBg: Record<string, string> = {
    new: 'rgba(113,128,150,.1)', awaiting_payment: 'rgba(49,130,206,.1)',
    scheduled: 'rgba(214,158,46,.1)', installed: 'rgba(221,107,32,.1)',
    certified: 'rgba(56,161,105,.1)',
  }
  const stages = ['new', 'awaiting_payment', 'scheduled', 'installed', 'certified']

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, clients(company_name), properties(property_name, district)')
      .order('created_at', { ascending: false })
    if (data) setRequests(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const tableHeaders = [
    t('رقم الطلب', 'Req #'),
    t('العميل', 'Client'),
    t('العقار', 'Property'),
    t('الأجهزة', 'Devices'),
    t('القيمة', 'Value'),
    t('التاريخ', 'Date'),
    t('المرحلة', 'Stage'),
    t('إجراءات', 'Actions'),
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="الطلبات الواردة" titleEn="Requests" />

      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a202c' }}>
              📋 {t('الطلبات الواردة', 'Incoming Requests')}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
              {requests.length} {t('طلب إجمالاً', 'total requests')}
            </div>
          </div>
          <button style={{ background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', fontWeight: 700, padding: '9px 18px', borderRadius: '9px', border: 'none', fontSize: '13px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
            ＋ {t('طلب جديد', 'New Request')}
          </button>
        </div>

        {/* Stage Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '20px' }}>
          {stages.map(stage => (
            <div key={stage} style={{ background: '#fff', borderRadius: '12px', padding: '14px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: stageColor[stage] }}>
                {requests.filter(r => r.stage === stage).length}
              </div>
              <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{stageShort[stage]}</div>
              <div style={{ height: '3px', background: stageColor[stage], borderRadius: '2px', marginTop: '8px', opacity: .5 }}></div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{t('سجل الطلبات', 'Requests Log')}</span>
            <span style={{ fontSize: '11px', color: '#a0aec0' }}>{requests.length} {t('طلب', 'requests')}</span>
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
                  {requests.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ebf8ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}
                    >
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', color: '#3182ce', fontSize: '11px' }}>{r.request_code || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{r.clients?.company_name || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#718096' }}>{r.properties?.property_name || '—'}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'center', fontWeight: 700, color: '#1a202c' }}>{r.devices_count}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#3182ce' }}>{Number(r.total_amount).toLocaleString()} {t('د', 'AED')}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: '#a0aec0' }}>{r.created_at?.split('T')[0]}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: stageBg[r.stage], color: stageColor[r.stage], fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', border: `1px solid ${stageColor[r.stage]}33`, whiteSpace: 'nowrap' }}>
                          {stageLabel[r.stage]}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #e2e5ea', background: 'transparent', fontSize: '11px', fontWeight: 700, color: '#4a5568', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                            {t('تفاصيل', 'Details')}
                          </button>
                          <button style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#38a169,#2f855a)', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                            {t('تقدّم', 'Advance')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: '10px 18px', borderTop: '1px solid #e2e5ea', fontSize: '11px', color: '#a0aec0' }}>
            {t('عرض', 'Showing')} {requests.length} {t('طلب', 'requests')}
          </div>
        </div>
      </div>
    </div>
  )
}