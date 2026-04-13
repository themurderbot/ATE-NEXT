'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Job = {
  id: string; request_code?: string; scheduled_date: string
  scheduled_time: string; status: string; technician_name: string
  job_type?: string; location?: string
  clients?: { company_name: string }
  properties?: { property_name: string }
}
type Tech = { id: string; full_name: string; tech_code: string; is_active: boolean }
type Request = { id: string; request_code: string; clients?: { company_name: string } }

const JOB_COLORS = ['#3182ce','#38a169','#d69e2e','#e53e3e','#805ad5','#dd6b20']
const JOB_TYPES: Record<string,string> = { install:'Install', maintenance:'Maint.', inspection:'Inspect', repair:'Repair' }

export default function SchedulePage() {
  const { t, dir } = useLang()
  const [jobs, setJobs]           = useState<Job[]>([])
  const [techs, setTechs]         = useState<Tech[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<'calendar' | 'list'>('calendar')
  const [calMonth, setCalMonth]   = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10))
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [requests, setRequests]   = useState<Request[]>([])
  const [form, setForm] = useState({ request_id:'', technician_id:'', scheduled_date:'', scheduled_time:'09:00', job_type:'install', notes:'' })

  const todayStr = new Date().toISOString().slice(0,10)

  async function load() {
    setLoading(true)
    const [{ data: sc }, { data: tc }] = await Promise.all([
      supabase.from('schedules').select('*, requests(request_code, clients(company_name), properties(property_name))').order('scheduled_date,scheduled_time', { ascending: true }).order('scheduled_date,scheduled_time', { ascending: true }),
      supabase.from('technicians').select('*').eq('is_active', true).order('full_name'),
    ])
    if (sc) setJobs(sc)
    if (tc) setTechs(tc)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function openModal() {
    const { data: rq } = await supabase.from('requests').select('id, request_code, clients(company_name)').in('stage',['new','awaiting_payment','scheduled']).order('created_at',{ascending:false})
    if (rq) setRequests(rq as any)
    setForm(f => ({ ...f, scheduled_date: selectedDate }))
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.scheduled_date) return
    setSaving(true)
    const tech = techs.find(t => t.id === form.technician_id)
    const { error } = await supabase.from('schedules').insert([{
      request_id: form.request_id || null,
      technician_id: form.technician_id || null,
      technician_name: tech?.full_name || null,
      scheduled_date: form.scheduled_date,
      scheduled_time: form.scheduled_time,
      job_type: form.job_type,
      status: 'scheduled', notes: form.notes,
    }])
    if (!error) {
      if (form.request_id) await supabase.from('requests').update({ stage:'scheduled' }).eq('id', form.request_id)
      setShowModal(false)
      setForm({ request_id:'', technician_id:'', scheduled_date:'', scheduled_time:'09:00', job_type:'install', notes:'' })
      load()
    }
    setSaving(false)
  }

  async function markComplete(id: string) {
    await supabase.from('schedules').update({ status:'completed' }).eq('id', id)
    load()
  }

  // Calendar
  const year = calMonth.getFullYear(), month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysCount = new Date(year, month + 1, 0).getDate()

  const todayJobs = jobs.filter(j => j.scheduled_date === selectedDate)
  const selectedDateJobs = jobs.filter(j => j.scheduled_date === selectedDate)

  // Techs with today's job count
  const techJobCount: Record<string,number> = {}
  jobs.filter(j => j.scheduled_date === todayStr).forEach(j => {
    if (j.technician_name) techJobCount[j.technician_name] = (techJobCount[j.technician_name]||0) + 1
  })

  function getTechStatus(techName: string) {
    const count = techJobCount[techName] || 0
    if (count === 0) return { label: t('متاح','Available'), color:'#38a169', bg:'rgba(56,161,105,.1)' }
    if (count >= 3) return { label: t('مشغول','Busy'), color:'#e53e3e', bg:'rgba(229,62,62,.1)' }
    return { label: t('في الطريق','On Route'), color:'#d69e2e', bg:'rgba(214,158,46,.1)' }
  }

  const avatarColors = ['#e53e3e','#3182ce','#38a169','#d69e2e','#805ad5','#dd6b20']

  return (
    <div dir={dir} style={{ fontFamily:'Tajawal, Arial, sans-serif', minHeight:'100vh', background:'#f7f8fc' }}>
      <Topbar title="جدولة التركيب والصيانة" titleEn="Installation & Maintenance Schedule" />
      <div style={{ padding:'24px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <div style={{ display:'flex', gap:'8px' }}>
            {(['calendar','list'] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} style={{ padding:'8px 16px', borderRadius:'8px', border:'none', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif', fontWeight:view===v?700:400, background:view===v?'#1a202c':'#fff', color:view===v?'#fff':'#718096', boxShadow:'0 1px 3px rgba(0,0,0,.08)' }}>
                {v==='calendar'?`📅 ${t('تقويم','Calendar')}`:`☰ ${t('قائمة','List')}`}
              </button>
            ))}
          </div>
          <button onClick={openModal} style={{ background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', border:'none', borderRadius:'9px', padding:'9px 20px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
            ＋ {t('+ Schedule Visit','+ Schedule Visit')}
          </button>
        </div>

        {/* Calendar View */}
        {view === 'calendar' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px' }}>
            {/* Calendar */}
            <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
              {/* Month Nav */}
              <div style={{ padding:'16px 20px', borderBottom:'1px solid #e2e5ea', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <button onClick={()=>setCalMonth(new Date(year, month-1, 1))} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e2e5ea', background:'#fff', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
                <div style={{ fontWeight:900, fontSize:'17px', color:'#1a202c' }}>
                  {calMonth.toLocaleString(dir==='rtl'?'ar-SA':'en-US', { month:'long' })} {year}
                </div>
                <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                  <button onClick={()=>{ setCalMonth(new Date()); setSelectedDate(todayStr) }} style={{ padding:'4px 12px', borderRadius:'6px', border:'1px solid #e2e5ea', background:'#fff', cursor:'pointer', fontSize:'12px', fontFamily:'Tajawal,sans-serif', fontWeight:700 }}>Today</button>
                  <button onClick={()=>setCalMonth(new Date(year, month+1, 1))} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e2e5ea', background:'#fff', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
                </div>
              </div>
              {/* Day Headers */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} style={{ padding:'10px 4px', textAlign:'center', fontSize:'11px', fontWeight:700, color:'#a0aec0', background:'#f7f8fc', borderBottom:'1px solid #e2e5ea' }}>{d}</div>
                ))}
              </div>
              {/* Days */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
                {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} style={{ minHeight:'90px', borderBottom:'1px solid #f0f2f5', borderRight:'1px solid #f0f2f5' }}/>)}
                {Array.from({length:daysCount}).map((_,i)=>{
                  const day = i+1
                  const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const dj = jobs.filter(j=>j.scheduled_date===ds)
                  const isToday = ds===todayStr
                  const isSelected = ds===selectedDate
                  return (
                    <div key={day} onClick={()=>setSelectedDate(ds)} style={{ minHeight:'90px', padding:'6px 8px', borderBottom:'1px solid #f0f2f5', borderRight:'1px solid #f0f2f5', cursor:'pointer', background:isSelected?'#ebf8ff':isToday?'#fffbeb':'#fff', transition:'background .1s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                        <span style={{ fontSize:'13px', fontWeight:isToday?900:500, color:isToday?'#dd6b20':isSelected?'#3182ce':'#1a202c', width:'24px', height:'24px', borderRadius:'50%', background:isToday?'#dd6b20':isSelected?'#3182ce10':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>{day}</span>
                        {dj.length>0 && <span style={{ fontSize:'9px', background:'#3182ce', color:'#fff', borderRadius:'10px', padding:'1px 5px', fontWeight:700 }}>{dj.length}</span>}
                      </div>
                      {dj.slice(0,3).map((j,ji)=>{
                        const techIdx = techs.findIndex(tc=>tc.full_name===j.technician_name)
                        const color = JOB_COLORS[techIdx % JOB_COLORS.length] || '#3182ce'
                        const type = j.job_type ? (JOB_TYPES[j.job_type]||j.job_type) : 'Visit'
                        return (
                          <div key={j.id} style={{ fontSize:'9px', background:color+'20', color:color, border:`1px solid ${color}33`, borderRadius:'3px', padding:'1px 5px', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>
                            {type} – {j.clients?.company_name || j.technician_name || '—'}
                          </div>
                        )
                      })}
                      {dj.length>3 && <div style={{ fontSize:'9px', color:'#a0aec0' }}>+{dj.length-3} more</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {/* Technicians */}
              <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e5ea', fontWeight:700, fontSize:'13px', color:'#1a202c' }}>
                  👷 {t('الفنيون المتاحون اليوم','Available Technicians')}
                </div>
                <div style={{ padding:'8px' }}>
                  {techs.slice(0,5).map((tech,i)=>{
                    const st = getTechStatus(tech.full_name)
                    return (
                      <div key={tech.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'8px', marginBottom:'4px', background:'#f7f8fc' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:`linear-gradient(135deg,${avatarColors[i%avatarColors.length]},${avatarColors[i%avatarColors.length]}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {tech.full_name.charAt(0)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:'#1a202c', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tech.full_name}</div>
                          <div style={{ fontSize:'10px', color:'#a0aec0' }}>{techJobCount[tech.full_name]||0} {t('زيارة','visits')}</div>
                        </div>
                        <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:st.bg, color:st.color, whiteSpace:'nowrap', border:`1px solid ${st.color}33` }}>{st.label}</span>
                      </div>
                    )
                  })}
                  {techs.length === 0 && <div style={{ padding:'20px', textAlign:'center', color:'#a0aec0', fontSize:'12px' }}>{t('لا يوجد فنيون','No technicians')}</div>}
                </div>
              </div>

              {/* Today's / Selected Jobs */}
              <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e5ea', fontWeight:700, fontSize:'13px', color:'#1a202c' }}>
                  📋 {selectedDate===todayStr ? t('زيارات اليوم','Today\'s Visits') : selectedDate}
                  <span style={{ fontSize:'11px', fontWeight:400, color:'#a0aec0', marginRight:'6px' }}>({selectedDateJobs.length})</span>
                </div>
                <div style={{ padding:'8px', maxHeight:'280px', overflowY:'auto' }}>
                  {selectedDateJobs.length===0 ? (
                    <div style={{ padding:'20px', textAlign:'center', color:'#a0aec0', fontSize:'12px' }}>{t('لا توجد زيارات','No visits')}</div>
                  ) : selectedDateJobs.map((j,i)=>{
                    const techIdx = techs.findIndex(tc=>tc.full_name===j.technician_name)
                    const color = JOB_COLORS[techIdx % JOB_COLORS.length] || '#3182ce'
                    return (
                      <div key={j.id} style={{ display:'flex', gap:'10px', padding:'10px', borderRadius:'8px', marginBottom:'6px', background:'#f7f8fc', borderRight:`3px solid ${color}` }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:'12px', fontWeight:700, color:'#1a202c', marginBottom:'2px' }}>{j.clients?.company_name || j.properties?.property_name || '—'}</div>
                          <div style={{ fontSize:'10px', color:'#718096' }}>م. {j.technician_name || t('غير محدد','Unassigned')}</div>
                        </div>
                        <div style={{ textAlign:'left', flexShrink:0 }}>
                          <div style={{ fontSize:'11px', fontWeight:700, color:color }}>{j.scheduled_time||'—'}</div>
                          <div style={{ fontSize:'9px', color:'#a0aec0' }}>{j.job_type ? (JOB_TYPES[j.job_type]||j.job_type) : 'Visit'}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0' }}>⏳</div>
            : jobs.length===0 ? (
              <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0', background:'#fff', borderRadius:'12px', border:'1px solid #e2e5ea' }}>{t('لا توجد مهام','No tasks')}</div>
            ) : jobs.map((job,i) => (
              <div key={job.id} style={{ background:'#fff', borderRadius:'12px', padding:'16px 20px', boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #e2e5ea', display:'flex', alignItems:'center', gap:'16px' }}>
                <div style={{ flexShrink:0, width:'54px', height:'54px', borderRadius:'10px', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                  <div style={{ fontSize:'18px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', lineHeight:1 }}>{job.scheduled_date ? new Date(job.scheduled_date+'T00:00').getDate() : i+1}</div>
                  <div style={{ fontSize:'9px', opacity:.8 }}>{job.scheduled_date ? new Date(job.scheduled_date+'T00:00').toLocaleString('en-GB',{month:'short'}) : '—'}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'14px', color:'#1a202c', marginBottom:'2px' }}>{(job as any).requests?.clients?.company_name||'—'}</div>
                  <div style={{ fontSize:'12px', color:'#718096' }}>{(job as any).requests?.properties?.property_name||'—'}</div>
                  {job.scheduled_time && <div style={{ fontSize:'11px', color:'#805ad5' }}>🕐 {job.scheduled_time} · {job.job_type||'Visit'}</div>}
                </div>
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:'11px', color:'#a0aec0' }}>{t('الفني','Tech')}</div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#1a202c' }}>{job.technician_name||'—'}</div>
                </div>
                <span style={{ fontSize:'11px', fontWeight:700, padding:'5px 12px', borderRadius:'20px', background:job.status==='completed'?'rgba(56,161,105,.1)':'rgba(49,130,206,.1)', color:job.status==='completed'?'#38a169':'#3182ce', flexShrink:0 }}>
                  {job.status==='completed'?t('✅ مكتمل','✅ Done'):t('📅 مجدول','📅 Scheduled')}
                </span>
                <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                  {job.status!=='completed' && (
                    <button onClick={()=>markComplete(job.id)} style={{ padding:'6px 12px', borderRadius:'7px', border:'none', background:'linear-gradient(135deg,#38a169,#2f855a)', fontSize:'11px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                      {t('إكمال ✓','Done ✓')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'500px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a202c' }}>📅 {t('جدولة زيارة','Schedule Visit')}</div>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#a0aec0' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الطلب','Request')}</label>
                <select value={form.request_id} onChange={e=>setForm(f=>({...f,request_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر طلب (اختياري)','Select Request (optional)')}</option>
                  {requests.map(r=><option key={r.id} value={r.id}>{r.request_code} — {(r.clients as any)?.company_name||''}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الفني *','Technician *')}</label>
                <select value={form.technician_id} onChange={e=>setForm(f=>({...f,technician_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر الفني','Select Technician')}</option>
                  {techs.map(tc=>{
                    const st = getTechStatus(tc.full_name)
                    return <option key={tc.id} value={tc.id}>{tc.full_name} — {st.label}</option>
                  })}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('نوع الزيارة','Job Type')}</label>
                <select value={form.job_type} onChange={e=>setForm(f=>({...f,job_type:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="install">{t('تركيب','Installation')}</option>
                  <option value="maintenance">{t('صيانة','Maintenance')}</option>
                  <option value="inspection">{t('فحص','Inspection')}</option>
                  <option value="repair">{t('إصلاح','Repair')}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الوقت','Time')}</label>
                <input type="time" value={form.scheduled_time} onChange={e=>setForm(f=>({...f,scheduled_time:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('التاريخ *','Date *')}</label>
                <input type="date" value={form.scheduled_date} onChange={e=>setForm(f=>({...f,scheduled_date:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('ملاحظات','Notes')}</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 20px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>{t('إلغاء','Cancel')}</button>
              <button onClick={handleSave} disabled={saving||!form.scheduled_date} style={{ padding:'9px 24px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'Tajawal,sans-serif', opacity:(saving||!form.scheduled_date)?0.6:1 }}>
                {saving?'⏳':t('💾 حفظ','💾 Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}