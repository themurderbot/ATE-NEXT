'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Request = {
  id: string
  request_code: string
  stage: string
  total_amount: number
  devices_count: number
  created_at: string
  clients?: { company_name: string }
  properties?: { property_name: string }
}

export default function PipelinePage() {
  const { t, dir } = useLang()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading]   = useState(true)
  const [dragging, setDragging] = useState<string | null>(null)

  const STAGES = [
    { id: 'new',              label: t('طلب جديد',       'New Request'),      icon: '🆕', color: '#718096' },
    { id: 'awaiting_payment', label: t('بانتظار الدفع',  'Awaiting Payment'), icon: '💳', color: '#3182ce' },
    { id: 'scheduled',        label: t('مجدول',          'Scheduled'),        icon: '📅', color: '#d69e2e' },
    { id: 'installed',        label: t('تم التركيب',     'Installed'),        icon: '🔧', color: '#dd6b20' },
    { id: 'certified',        label: t('شهادة صادرة',    'Certified'),        icon: '✅', color: '#38a169' },
  ]

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, clients(company_name), properties(property_name)')
      .order('created_at', { ascending: false })
    if (data) setRequests(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function moveStage(id: string, newStage: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, stage: newStage } : r))
    await supabase.from('requests').update({ stage: newStage }).eq('id', id)
  }

  const totalValue = requests.reduce((s, r) => s + Number(r.total_amount || 0), 0)
  const certified  = requests.filter(r => r.stage === 'certified').length

  if (loading) return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="Pipeline" titleEn="Pipeline" />
      <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>⏳ {t('جارٍ التحميل...', 'Loading...')}</div>
    </div>
  )

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="Pipeline" titleEn="Pipeline" />

      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a202c' }}>
              🔄 {t('Pipeline الطلبات', 'Requests Pipeline')}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
              {requests.length} {t('طلب', 'requests')} · {totalValue.toLocaleString()} {t('د إجمالي', 'AED total')} · {certified} {t('شهادة صادرة', 'certified')}
            </div>
          </div>
          <a href="/requests" style={{ background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', fontWeight: 700, padding: '9px 18px', borderRadius: '9px', fontSize: '13px', textDecoration: 'none' }}>
            ＋ {t('طلب جديد', 'New Request')}
          </a>
        </div>

        {/* Kanban Board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', alignItems: 'start' }}>
          {STAGES.map(stage => {
            const cards = requests.filter(r => r.stage === stage.id)
            const stageValue = cards.reduce((s, r) => s + Number(r.total_amount || 0), 0)

            return (
              <div key={stage.id}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (dragging) moveStage(dragging, stage.id); setDragging(null) }}
                style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e5ea', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)', minHeight: '200px' }}
              >
                {/* Column Header */}
                <div style={{ padding: '12px 14px', borderBottom: `3px solid ${stage.color}`, background: `${stage.color}08` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a202c' }}>{stage.icon} {stage.label}</div>
                    <span style={{ background: stage.color, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>{cards.length}</span>
                  </div>
                  {stageValue > 0 && (
                    <div style={{ fontSize: '11px', color: stage.color, marginTop: '4px', fontWeight: 600 }}>
                      {stageValue.toLocaleString()} {t('د', 'AED')}
                    </div>
                  )}
                </div>

                {/* Cards */}
                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cards.map(r => (
                    <div key={r.id} draggable
                      onDragStart={() => setDragging(r.id)}
                      onDragEnd={() => setDragging(null)}
                      style={{ background: dragging === r.id ? '#ebf8ff' : '#f7f8fc', border: `1px solid ${dragging === r.id ? '#3182ce' : '#e2e5ea'}`, borderRadius: '8px', padding: '10px 12px', cursor: 'grab', transition: 'all .15s' }}
                    >
                      <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#3182ce', marginBottom: '4px' }}>{r.request_code}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a202c', marginBottom: '4px' }}>{r.clients?.company_name || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#718096', marginBottom: '8px' }}>{r.properties?.property_name || '—'}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: stage.color }}>{Number(r.total_amount || 0).toLocaleString()} {t('د', 'AED')}</span>
                        <span style={{ fontSize: '10px', color: '#a0aec0' }}>{r.devices_count} {t('جهاز', 'devices')}</span>
                      </div>
                      {/* Move Buttons */}
                      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                        {STAGES.filter(s => s.id !== stage.id).slice(0, 2).map(s => (
                          <button key={s.id} onClick={() => moveStage(r.id, s.id)} style={{ flex: 1, padding: '3px 6px', border: `1px solid ${s.color}44`, background: `${s.color}10`, color: s.color, borderRadius: '5px', fontSize: '9px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                            {s.icon} {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#cbd5e0', fontSize: '12px', border: '2px dashed #e2e5ea', borderRadius: '8px' }}>
                      {t('لا توجد طلبات', 'No requests')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}