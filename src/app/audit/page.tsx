'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://gjjmscyiewrdqtritsea.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqam1zY3lpZXdyZHF0cml0c2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ1ODEsImV4cCI6MjA5MTMyMDU4MX0.If9a0bXAtuYaM0n08xHGFCKnPVIv86jqzB577C3I4UM'
)

const ACTION_LABELS: Record<string, { ar: string; icon: string; color: string }> = {
  alert_created:           { ar: 'إنذار جديد',         icon: '🚨', color: '#ff3040' },
  alert_status_changed:    { ar: 'تغيير حالة الإنذار',  icon: '🔄', color: '#ffc200' },
  alert_acknowledged:      { ar: 'تأكيد الإنذار',       icon: '✅', color: '#0a80ff' },
  alert_resolved:          { ar: 'إغلاق الإنذار',       icon: '☑️', color: '#00e676' },
  civil_defense_notified:  { ar: 'إبلاغ الدفاع المدني', icon: '📲', color: '#25D366' },
  document_uploaded:       { ar: 'رفع مستند',           icon: '📤', color: '#0a80ff' },
  document_accepted:       { ar: 'قبول مستند',          icon: '✅', color: '#00e676' },
  document_rejected:       { ar: 'رفض مستند',           icon: '❌', color: '#ff3040' },
  document_status_changed: { ar: 'تغيير حالة المستند',  icon: '🔄', color: '#ffc200' },
}

export default function AuditPage() {
  const [logs, setLogs]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<string>('all')

  useEffect(() => { loadLogs() }, [filter])

  async function loadLogs() {
    setLoading(true)
    let q = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200)
    if (filter !== 'all') q = q.eq('action', filter)
    const { data, error } = await q
    if (error) console.error(error)
    setLogs(data || [])
    setLoading(false)
  }

  return (
    <div dir="rtl" style={{ fontFamily:'Tajawal,sans-serif', padding:'24px', minHeight:'100vh', background:'#060c14', color:'#e0f0ff' }}>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:900 }}>📋 سجل العمليات</h1>
        <div style={{ fontSize:'12px', color:'#6090b0', marginTop:'4px' }}>
          سجل كامل لكل العمليات الحساسة في النظام
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom:'16px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
        {['all', 'alert_created', 'civil_defense_notified', 'document_uploaded', 'document_accepted', 'document_rejected'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            style={{
              padding:'6px 14px', borderRadius:'8px', cursor:'pointer',
              background: filter === f ? 'linear-gradient(135deg,#0a80ff,#00d4ff)' : '#0e1f33',
              border: filter === f ? 'none' : '1px solid #1a3050',
              color: filter === f ? '#fff' : '#6090b0',
              fontSize:'12px', fontWeight:700, fontFamily:'Tajawal,sans-serif',
            }}>
            {f === 'all' ? 'الكل' : ACTION_LABELS[f]?.ar || f}
          </button>
        ))}
      </div>

      {/* Logs */}
      {loading ? (
        <div style={{ padding:'40px', textAlign:'center', color:'#6090b0' }}>جارٍ التحميل...</div>
      ) : logs.length === 0 ? (
        <div style={{ padding:'40px', textAlign:'center', color:'#304560' }}>📭 لا توجد سجلات</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {logs.map(log => {
            const meta = ACTION_LABELS[log.action] || { ar: log.action, icon: '•', color: '#6090b0' }
            const time = new Date(log.created_at).toLocaleString('ar-EG')
            const summary =
              log.new_values?.alert_type     ? `النوع: ${log.new_values.alert_type}` :
              log.new_values?.document_type  ? `النوع: ${log.new_values.document_type}` :
              log.entity_type === 'alerts'    ? 'إنذار' :
              log.entity_type === 'client_documents' ? 'مستند' : ''

            return (
              <div key={log.id} style={{
                background:'#0e1f33', border:`1px solid ${meta.color}33`, borderRadius:'10px',
                padding:'12px 16px', display:'flex', alignItems:'center', gap:'14px',
              }}>
                <div style={{
                  width:'40px', height:'40px', borderRadius:'10px',
                  background:`${meta.color}20`, border:`1px solid ${meta.color}33`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0,
                }}>{meta.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'14px', color: meta.color }}>{meta.ar}</div>
                  <div style={{ fontSize:'11px', color:'#6090b0', marginTop:'2px' }}>
                    {summary} {log.user_email && `· ${log.user_email}`}
                  </div>
                </div>
                <div style={{ fontSize:'10px', color:'#304560', fontFamily:'IBM Plex Mono,monospace', whiteSpace:'nowrap' }}>
                  {time}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}