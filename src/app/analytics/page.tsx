'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gjjmscyiewrdqtritsea.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqam1zY3lpZXdyZHF0cml0c2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ1ODEsImV4cCI6MjA5MTMyMDU4MX0.If9a0bXAtuYaM0n08xHGFCKnPVIv86jqzB577C3I4UM'
)

type Stats = {
  totalClients: number
  totalDevices: number
  totalProperties: number
  activeAlerts: number
  totalAlerts: number
  totalCerts: number
  expiringCerts: number
  pendingInvoices: number
  totalRevenue: number
  alertsByType: Record<string, number>
  alertsLast7Days: { date: string; count: number }[]
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30')

  useEffect(() => { loadStats() }, [period])

  async function loadStats() {
    setLoading(true)
    try {
      const since = new Date()
      since.setDate(since.getDate() - parseInt(period))
      const sinceStr = since.toISOString()

      const [
        { count: totalClients },
        { count: totalDevices },
        { count: totalProperties },
        { count: activeAlerts },
        { count: totalAlerts },
        { count: totalCerts },
        { count: pendingInvoices },
        { data: alertsData },
        { data: invoicesData },
        { data: certsExpiring },
      ] = await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('alerts').select('*', { count: 'exact', head: true }).gte('created_at', sinceStr),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('alerts').select('alert_type, created_at').gte('created_at', sinceStr).limit(1000),
        supabase.from('invoices').select('amount, status').eq('status', 'paid'),
        supabase.from('certificates').select('id').lte('expiry_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).gte('expiry_date', new Date().toISOString().split('T')[0]),
      ])

      // Group alerts by type
      const alertsByType: Record<string, number> = {}
      alertsData?.forEach(a => {
        alertsByType[a.alert_type] = (alertsByType[a.alert_type] || 0) + 1
      })

      // Last 7 days alerts
      const last7Days: { date: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const count = alertsData?.filter(a => a.created_at.startsWith(dateStr)).length || 0
        last7Days.push({ date: dateStr, count })
      }

      const totalRevenue = invoicesData?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0

      setStats({
        totalClients: totalClients || 0,
        totalDevices: totalDevices || 0,
        totalProperties: totalProperties || 0,
        activeAlerts: activeAlerts || 0,
        totalAlerts: totalAlerts || 0,
        totalCerts: totalCerts || 0,
        expiringCerts: certsExpiring?.length || 0,
        pendingInvoices: pendingInvoices || 0,
        totalRevenue,
        alertsByType,
        alertsLast7Days: last7Days,
      })
    } catch (e) {
      console.error('analytics:', e)
    } finally {
      setLoading(false)
    }
  }

  const ALERT_COLORS: Record<string, string> = {
    fire: '#ff3040', smoke: '#ff6820', fault: '#ffc200',
    test: '#0a80ff', restore: '#00e676', offline: '#6090b0',
  }

  const ALERT_LABELS: Record<string, string> = {
    fire: 'حريق', smoke: 'دخان', fault: 'عطل',
    test: 'اختبار', restore: 'استعادة', offline: 'غير متصل',
  }

  if (loading || !stats) {
    return (
      <div dir="rtl" style={{ fontFamily:'Tajawal,sans-serif', padding:'40px', minHeight:'100vh', background:'#060c14', color:'#6090b0', textAlign:'center' }}>
        ⏳ جارٍ تحميل التقارير...
      </div>
    )
  }

  const maxDayCount = Math.max(...stats.alertsLast7Days.map(d => d.count), 1)
  const totalAlertsByType = Object.values(stats.alertsByType).reduce((a, b) => a + b, 0)

  return (
    <div dir="rtl" style={{ fontFamily:'Tajawal,sans-serif', padding:'24px', minHeight:'100vh', background:'#060c14', color:'#e0f0ff' }}>
      <div style={{ marginBottom:'24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:900 }}>📊 التقارير والإحصائيات</h1>
          <div style={{ fontSize:'12px', color:'#6090b0', marginTop:'4px' }}>
            نظرة شاملة على أداء النظام
          </div>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {[
            { v: '7' as const,  l: '7 أيام' },
            { v: '30' as const, l: '30 يوم' },
            { v: '90' as const, l: '90 يوم' },
          ].map(p => (
            <button key={p.v} onClick={() => setPeriod(p.v)} style={{
              padding:'8px 16px', borderRadius:'8px', cursor:'pointer',
              background: period === p.v ? 'linear-gradient(135deg,#0a80ff,#00d4ff)' : '#0e1f33',
              border: period === p.v ? 'none' : '1px solid #1a3050',
              color: period === p.v ? '#fff' : '#6090b0',
              fontSize:'12px', fontWeight:700, fontFamily:'Tajawal,sans-serif',
            }}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
        {[
          { icon:'👥', label:'إجمالي العملاء',     value: stats.totalClients,    color:'#0a80ff' },
          { icon:'📡', label:'الأجهزة المُركّبة',    value: stats.totalDevices,    color:'#00d4ff' },
          { icon:'🏢', label:'العقارات',            value: stats.totalProperties, color:'#8b5cf6' },
          { icon:'🚨', label:'إنذارات نشطة',        value: stats.activeAlerts,    color:'#ff3040' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#0e1f33', borderRadius:'12px', padding:'18px', border:`1px solid ${k.color}33` }}>
            <div style={{ fontSize:'22px', marginBottom:'8px' }}>{k.icon}</div>
            <div style={{ fontSize:'28px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:'11px', color:'#6090b0', marginTop:'4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'24px' }}>
        {[
          { icon:'📜', label:'إجمالي الشهادات',     value: stats.totalCerts,      color:'#00e676' },
          { icon:'⚠️', label:'شهادات تنتهي قريباً',  value: stats.expiringCerts,   color:'#ffc200' },
          { icon:'💳', label:'فواتير غير مدفوعة',   value: stats.pendingInvoices, color:'#ff6820' },
          { icon:'💰', label:'الإيرادات (مدفوعة)',  value: `${stats.totalRevenue.toLocaleString()} د.إ`, color:'#00e676' },
        ].map((k,i) => (
          <div key={i} style={{ background:'#0e1f33', borderRadius:'12px', padding:'14px 18px', border:`1px solid ${k.color}22`, display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ fontSize:'24px' }}>{k.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'18px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:k.color }}>{k.value}</div>
              <div style={{ fontSize:'10px', color:'#6090b0' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'14px' }}>
        {/* Alerts last 7 days */}
        <div style={{ background:'#0e1f33', borderRadius:'12px', padding:'18px', border:'1px solid #1a3050' }}>
          <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'18px' }}>📈 الإنذارات في آخر 7 أيام</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', height:'180px' }}>
            {stats.alertsLast7Days.map((d, i) => {
              const heightPct = (d.count / maxDayCount) * 100
              const date = new Date(d.date)
              const dayShort = date.toLocaleDateString('ar-EG', { weekday: 'short' })
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                  <div style={{ fontSize:'10px', color:'#0a80ff', fontFamily:'IBM Plex Mono,monospace' }}>{d.count}</div>
                  <div style={{
                    width:'100%', height: `${Math.max(heightPct, 5)}%`, minHeight:'8px',
                    background:'linear-gradient(180deg,#0a80ff,#00d4ff)',
                    borderRadius:'6px 6px 0 0', transition:'height 0.3s',
                  }}/>
                  <div style={{ fontSize:'9px', color:'#6090b0' }}>{dayShort}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alerts by type */}
        <div style={{ background:'#0e1f33', borderRadius:'12px', padding:'18px', border:'1px solid #1a3050' }}>
          <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'18px' }}>🎯 توزيع الإنذارات حسب النوع</div>
          {Object.keys(stats.alertsByType).length === 0 ? (
            <div style={{ padding:'30px', textAlign:'center', color:'#304560', fontSize:'12px' }}>لا توجد إنذارات في هذه الفترة</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {Object.entries(stats.alertsByType).map(([type, count]) => {
                const pct = totalAlertsByType > 0 ? (count / totalAlertsByType * 100) : 0
                const color = ALERT_COLORS[type] || '#6090b0'
                const label = ALERT_LABELS[type] || type
                return (
                  <div key={type}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'4px' }}>
                      <span style={{ color: '#e0f0ff' }}>{label}</span>
                      <span style={{ color, fontFamily:'IBM Plex Mono,monospace' }}>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height:'6px', background:'#060c14', borderRadius:'3px', overflow:'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height:'100%',
                        background: color, transition:'width 0.3s',
                      }}/>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}