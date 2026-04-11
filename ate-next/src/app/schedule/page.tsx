'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Job = {
  id: string
  request_code: string
  scheduled_date: string
  scheduled_time: string
  status: string
  technician_name: string
  clients?: { company_name: string }
  properties?: { property_name: string }
}

export default function SchedulePage() {
  const { t, dir } = useLang()
  const [jobs, setJobs]             = useState<Job[]>([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState<'list' | 'calendar'>('list')
  const [filterDate, setFilterDate] = useState('')

  const statusLabel: Record<string, string> = {
    scheduled:   t('📅 مجدول',  '📅 Scheduled'),
    in_progress: t('🔧 جارٍ',   '🔧 In Progress'),
    completed:   t('✅ مكتمل',  '✅ Completed'),
    cancelled:   t('❌ ملغي',   '❌ Cancelled'),
  }
  const statusColor: Record<string, string> = {
    scheduled: '#3182ce', in_progress: '#d69e2e',
    completed: '#38a169', cancelled: '#e53e3e',
  }

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, clients(company_name), properties(property_name)')
      .eq('stage', 'scheduled')
      .order('created_at', { ascending: true })
    if (data) setJobs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const today     = jobs.filter(j => j.scheduled_date === new Date().toISOString().slice(0, 10))
  const upcoming  = jobs.filter(j => j.scheduled_date > new Date().toISOString().slice(0, 10))
  const completed = jobs.filter(j => j.status === 'completed')
  const filtered  = filterDate ? jobs.filter(j => j.scheduled_date === filterDate) : jobs

  const kpis = [
    { label: t('إجمالي المجدول', 'Total Scheduled'), value: jobs.length,      color: '#3182ce', icon: '📋' },
    { label: t('اليوم',          'Today'),           value: today.length,     color: '#d69e2e', icon: '📅' },
    { label: t('قادم',           'Upcoming'),        value: upcoming.length,  color: '#805ad5', icon: '🔜' },
    { label: t('مكتمل',          'Completed'),       value: completed.length, color: '#38a169', icon: '✅' },
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="الجدولة" titleEn="Schedule" />

      <div style={{ padding: '24px' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '24px' }}>{k.icon}</div>
                <span style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: k.color }}>{k.value}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#718096' }}>{k.label}</div>
              <div style={{ height: '3px', background: k.color, borderRadius: '2px', marginTop: '10px', opacity: .3 }}></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', background: '#fff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e5ea', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', outline: 'none', background: '#f7f8fc' }}
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} style={{ padding: '8px 14px', border: '1px solid #e2e5ea', borderRadius: '8px', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#718096', fontFamily: 'Tajawal,sans-serif' }}>
              ✕ {t('إلغاء الفلتر', 'Clear Filter')}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '12px', color: '#a0aec0' }}>{filtered.length} {t('مهمة', 'tasks')}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['list', 'calendar'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '7px 14px', borderRadius: '7px', border: 'none', fontSize: '12px',
                cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: view === v ? 700 : 400,
                background: view === v ? '#3182ce' : '#f7f8fc',
                color: view === v ? '#fff' : '#718096',
              }}>
                {v === 'list' ? `☰ ${t('قائمة', 'List')}` : `📅 ${t('تقويم', 'Calendar')}`}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>⏳ {t('جارٍ التحميل...', 'Loading...')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0', background: '#fff', borderRadius: '12px', border: '1px solid #e2e5ea' }}>
                {t('لا توجد مهام مجدولة', 'No scheduled tasks')}
              </div>
            ) : filtered.map((job, i) => (
              <div key={job.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1px solid #e2e5ea', display: 'flex', alignItems: 'center', gap: '16px' }}>

                {/* Date Badge */}
                <div style={{ flexShrink: 0, width: '54px', height: '54px', borderRadius: '10px', background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', lineHeight: 1 }}>
                    {job.scheduled_date ? new Date(job.scheduled_date).getDate() : i + 1}
                  </div>
                  <div style={{ fontSize: '9px', opacity: .8 }}>
                    {job.scheduled_date ? new Date(job.scheduled_date).toLocaleString(dir === 'rtl' ? 'ar-SA' : 'en-GB', { month: 'short' }) : '—'}
                  </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a202c' }}>{job.clients?.company_name || '—'}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3182ce', background: '#ebf8ff', padding: '1px 6px', borderRadius: '4px' }}>{job.request_code}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#718096' }}>{job.properties?.property_name || '—'}</div>
                </div>

                {/* Technician */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: '#a0aec0', marginBottom: '2px' }}>{t('الفني', 'Technician')}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a202c' }}>{job.technician_name || t('غير محدد', 'Unassigned')}</div>
                </div>

                {/* Status */}
                <span style={{ background: `${statusColor[job.status] || '#718096'}15`, color: statusColor[job.status] || '#718096', fontSize: '11px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', border: `1px solid ${statusColor[job.status] || '#718096'}33`, flexShrink: 0 }}>
                  {statusLabel[job.status] || t('📅 مجدول', '📅 Scheduled')}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #e2e5ea', background: '#fff', fontSize: '11px', fontWeight: 700, color: '#4a5568', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                    {t('تفاصيل', 'Details')}
                  </button>
                  <button style={{ padding: '6px 12px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#38a169,#2f855a)', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                    {t('إكمال ✓', 'Complete ✓')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}