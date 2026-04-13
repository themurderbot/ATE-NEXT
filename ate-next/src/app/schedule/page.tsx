'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Job = {
  id: string; request_code: string; scheduled_date: string
  scheduled_time: string; status: string; technician_name: string
  clients?: { company_name: string }
  properties?: { property_name: string }
}
type Request = { id: string; request_code: string; clients?: { company_name: string } }
type Tech = { id: string; full_name: string; tech_code: string }

export default function SchedulePage() {
  const { t, dir } = useLang()
  const [jobs, setJobs]             = useState<Job[]>([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState<'list' | 'calendar'>('list')
  const [filterDate, setFilterDate] = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [requests, setRequests]     = useState<Request[]>([])
  const [techs, setTechs]           = useState<Tech[]>([])
  const [form, setForm] = useState({ request_id:'', technician_id:'', scheduled_date:'', scheduled_time:'09:00', notes:'' })

  const statusLabel: Record<string,string> = {
    scheduled: t('📅 مجدول','📅 Scheduled'), in_progress: t('🔧 جارٍ','🔧 In Progress'),
    completed: t('✅ مكتمل','✅ Completed'),  cancelled:   t('❌ ملغي','❌ Cancelled'),
  }
  const statusColor: Record<string,string> = {
    scheduled:'#3182ce', in_progress:'#d69e2e', completed:'#38a169', cancelled:'#e53e3e',
  }

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('schedules').select('*, clients(company_name), properties(property_name)').order('scheduled_date', { ascending: true })
    if (data) setJobs(data)
    else {
      // fallback to requests with stage=scheduled
      const { data: rd } = await supabase.from('requests').select('*, clients(company_name), properties(property_name)').eq('stage','scheduled').order('created_at',{ascending:true})
      if (rd) setJobs(rd as any)
    }
    setLoading(false)
  }

  async function openModal() {
    const [{ data: rq }, { data: tc }] = await Promise.all([
      supabase.from('requests').select('id, request_code, clients(company_name)').in('stage',['new','awaiting_payment','scheduled']).order('created_at',{ascending:false}),
      supabase.from('technicians').select('id, full_name, tech_code').eq('is_active',true).order('full_name'),
    ])
    if (rq) setRequests(rq as any)
    if (tc) setTechs(tc)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.request_id || !form.scheduled_date) return
    setSaving(true)
    const tech = techs.find(t => t.id === form.technician_id)
    const { error } = await supabase.from('schedules').insert([{
      request_id: form.request_id,
      technician_id: form.technician_id || null,
      technician_name: tech?.full_name || null,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time,
      status: 'scheduled',
      notes: form.notes,
    }])
    if (!error) {
      // update request stage to scheduled
      await supabase.from('requests').update({ stage:'scheduled' }).eq('id', form.request_id)
      setShowModal(false)
      setForm({ request_id:'', technician_id:'', scheduled_date:'', scheduled_time:'09:00', notes:'' })
      load()
    }
    setSaving(false)
  }

  async function markComplete(id: string) {
    await supabase.from('schedules').update({ status:'completed' }).eq('id', id)
    load()
  }

  useEffect(() => { load() }, [])

  const todayStr  = new Date().toISOString().slice(0,10)
  const todayJobs = jobs.filter(j => j.scheduled_date === todayStr)
  const upcoming  = jobs.filter(j => j.scheduled_date > todayStr)
  const completed = jobs.filter(j => j.status === 'completed')
  const filtered  = filterDate ? jobs.filter(j => j.scheduled_date === filterDate) : jobs

  // Calendar helpers
  const [calMonth, setCalMonth] = useState(new Date())
  function getDaysInMonth(d: Date) {
    const year = d.getFullYear(), month = d.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysCount = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysCount }
  }
  const { firstDay, daysCount } = getDaysInMonth(calMonth)

  return (
    <div dir={dir} style={{ fontFamily:'Tajawal, Arial, sans-serif', minHeight:'100vh', background:'#f7f8fc' }}>
      <Topbar title="الجدولة" titleEn="Schedule" />
      <div style={{ padding:'24px' }}>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
          {[
            { label:t('إجمالي المجدول','Total'), value:jobs.length,        color:'#3182ce', icon:'📋' },
            { label:t('اليوم','Today'),           value:todayJobs.length,   color:'#d69e2e', icon:'📅' },
            { label:t('قادم','Upcoming'),          value:upcoming.length,    color:'#805ad5', icon:'🔜' },
            { label:t('مكتمل','Completed'),        value:completed.length,   color:'#38a169', icon:'✅' },
          ].map((k,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <div style={{ fontSize:'24px' }}>{k.icon}</div>
                <span style={{ fontSize:'28px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:k.color }}>{k.value}</span>
              </div>
              <div style={{ fontSize:'12px', color:'#718096' }}>{k.label}</div>
              <div style={{ height:'3px', background:k.color, borderRadius:'2px', marginTop:'10px', opacity:.3 }}></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'16px', background:'#fff', padding:'14px 18px', borderRadius:'12px', border:'1px solid #e2e5ea', boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
          <button onClick={openModal} style={{ background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', border:'none', borderRadius:'8px', padding:'8px 16px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
            ＋ {t('جدولة جديدة','New Schedule')}
          </button>
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{ padding:'8px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', background:'#f7f8fc' }} />
          {filterDate && <button onClick={()=>setFilterDate('')} style={{ padding:'8px 14px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'12px', cursor:'pointer', color:'#718096', fontFamily:'Tajawal,sans-serif' }}>✕ {t('مسح','Clear')}</button>}
          <div style={{ flex:1 }} />
          <div style={{ fontSize:'12px', color:'#a0aec0' }}>{filtered.length} {t('مهمة','tasks')}</div>
          <div style={{ display:'flex', gap:'4px' }}>
            {(['list','calendar'] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} style={{ padding:'7px 14px', borderRadius:'7px', border:'none', fontSize:'12px', cursor:'pointer', fontFamily:'Tajawal,sans-serif', fontWeight:view===v?700:400, background:view===v?'#3182ce':'#f7f8fc', color:view===v?'#fff':'#718096' }}>
                {v==='list'?`☰ ${t('قائمة','List')}`:` 📅 ${t('تقويم','Calendar')}`}
              </button>
            ))}
          </div>
        </div>

        {/* List View */}
        {view === 'list' && (
          loading ? <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0' }}>⏳</div> : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {filtered.length === 0 ? (
                <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0', background:'#fff', borderRadius:'12px', border:'1px solid #e2e5ea' }}>
                  {t('لا توجد مهام مجدولة','No scheduled tasks')}
                </div>
              ) : filtered.map((job, i) => (
                <div key={job.id} style={{ background:'#fff', borderRadius:'12px', padding:'16px 20px', boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #e2e5ea', display:'flex', alignItems:'center', gap:'16px' }}>
                  <div style={{ flexShrink:0, width:'54px', height:'54px', borderRadius:'10px', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                    <div style={{ fontSize:'18px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', lineHeight:1 }}>{job.scheduled_date ? new Date(job.scheduled_date+'T00:00').getDate() : i+1}</div>
                    <div style={{ fontSize:'9px', opacity:.8 }}>{job.scheduled_date ? new Date(job.scheduled_date+'T00:00').toLocaleString(dir==='rtl'?'ar-SA':'en-GB',{month:'short'}) : '—'}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                      <span style={{ fontWeight:700, fontSize:'14px', color:'#1a202c' }}>{job.clients?.company_name||'—'}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#3182ce', background:'#ebf8ff', padding:'1px 6px', borderRadius:'4px' }}>{job.request_code}</span>
                    </div>
                    <div style={{ fontSize:'12px', color:'#718096' }}>{job.properties?.property_name||'—'}</div>
                    {job.scheduled_time && <div style={{ fontSize:'11px', color:'#805ad5', marginTop:'2px' }}>🕐 {job.scheduled_time}</div>}
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ fontSize:'11px', color:'#a0aec0', marginBottom:'2px' }}>{t('الفني','Technician')}</div>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#1a202c' }}>{job.technician_name||t('غير محدد','Unassigned')}</div>
                  </div>
                  <span style={{ background:`${statusColor[job.status]||'#718096'}15`, color:statusColor[job.status]||'#718096', fontSize:'11px', fontWeight:700, padding:'5px 12px', borderRadius:'20px', border:`1px solid ${statusColor[job.status]||'#718096'}33`, flexShrink:0 }}>
                    {statusLabel[job.status]||t('📅 مجدول','📅 Scheduled')}
                  </span>
                  <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                    <button style={{ padding:'6px 12px', borderRadius:'7px', border:'1px solid #e2e5ea', background:'#fff', fontSize:'11px', fontWeight:700, color:'#4a5568', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>{t('تفاصيل','Details')}</button>
                    {job.status !== 'completed' && (
                      <button onClick={()=>markComplete(job.id)} style={{ padding:'6px 12px', borderRadius:'7px', border:'none', background:'linear-gradient(135deg,#38a169,#2f855a)', fontSize:'11px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                        {t('إكمال ✓','Complete ✓')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
            {/* Calendar Header */}
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #e2e5ea', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()-1, 1))} style={{ padding:'6px 12px', border:'1px solid #e2e5ea', borderRadius:'7px', background:'#fff', cursor:'pointer', fontSize:'14px' }}>←</button>
              <div style={{ fontWeight:700, fontSize:'16px', color:'#1a202c' }}>
                {calMonth.toLocaleString(dir==='rtl'?'ar-SA':'en-US', { month:'long', year:'numeric' })}
              </div>
              <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 1))} style={{ padding:'6px 12px', border:'1px solid #e2e5ea', borderRadius:'7px', background:'#fff', cursor:'pointer', fontSize:'14px' }}>→</button>
            </div>
            {/* Day Headers */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid #e2e5ea' }}>
              {(dir==='rtl'?['أحد','اثن','ثلا','أرب','خمي','جمع','سبت']:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map(d => (
                <div key={d} style={{ padding:'10px', textAlign:'center', fontSize:'11px', fontWeight:700, color:'#718096', background:'#f7f8fc' }}>{d}</div>
              ))}
            </div>
            {/* Days Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
              {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} style={{ minHeight:'80px', borderBottom:'1px solid #f0f2f5', borderRight:'1px solid #f0f2f5' }} />)}
              {Array.from({length: daysCount}).map((_,i) => {
                const day = i+1
                const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const dayJobs = jobs.filter(j => j.scheduled_date === dateStr)
                const isToday = dateStr === todayStr
                return (
                  <div key={day} onClick={()=>setFilterDate(dateStr)} style={{ minHeight:'80px', padding:'6px', borderBottom:'1px solid #f0f2f5', borderRight:'1px solid #f0f2f5', cursor:'pointer', background:isToday?'#ebf8ff':filterDate===dateStr?'#bee3f8':'#fff', transition:'background .15s' }}
                    onMouseEnter={e=>{if(!isToday&&filterDate!==dateStr)(e.currentTarget as HTMLElement).style.background='#f7f8fc'}}
                    onMouseLeave={e=>{if(!isToday&&filterDate!==dateStr)(e.currentTarget as HTMLElement).style.background='#fff'}}
                  >
                    <div style={{ fontSize:'13px', fontWeight:isToday?900:400, color:isToday?'#3182ce':'#1a202c', marginBottom:'4px' }}>{day}</div>
                    {dayJobs.slice(0,2).map(j => (
                      <div key={j.id} style={{ fontSize:'9px', background:'#3182ce', color:'#fff', borderRadius:'3px', padding:'1px 5px', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {j.clients?.company_name||j.request_code}
                      </div>
                    ))}
                    {dayJobs.length > 2 && <div style={{ fontSize:'9px', color:'#718096' }}>+{dayJobs.length-2} {t('أخرى','more')}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'500px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a202c' }}>📅 {t('جدولة جديدة','New Schedule')}</div>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#a0aec0' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الطلب *','Request *')}</label>
                <select value={form.request_id} onChange={e=>setForm(f=>({...f,request_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر الطلب','Select Request')}</option>
                  {requests.map(r=><option key={r.id} value={r.id}>{r.request_code} — {(r.clients as any)?.company_name||''}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الفني','Technician')}</label>
                <select value={form.technician_id} onChange={e=>setForm(f=>({...f,technician_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر الفني','Select Technician')}</option>
                  {techs.map(tc=><option key={tc.id} value={tc.id}>{tc.full_name} ({tc.tech_code})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('التاريخ *','Date *')}</label>
                <input type="date" value={form.scheduled_date} onChange={e=>setForm(f=>({...f,scheduled_date:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الوقت','Time')}</label>
                <input type="time" value={form.scheduled_time} onChange={e=>setForm(f=>({...f,scheduled_time:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('ملاحظات','Notes')}</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 20px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>{t('إلغاء','Cancel')}</button>
              <button onClick={handleSave} disabled={saving||!form.request_id||!form.scheduled_date} style={{ padding:'9px 24px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'Tajawal,sans-serif', opacity:(saving||!form.request_id||!form.scheduled_date)?0.6:1 }}>
                {saving ? '⏳' : t('💾 حفظ','💾 Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}