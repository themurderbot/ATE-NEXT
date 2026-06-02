'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Tech = {
  id: string; full_name: string; tech_code: string; level: number
  phone: string; email: string; join_date: string; is_active: boolean
}

const avatarColors = [
  'linear-gradient(135deg,#3182ce,#0099cc)',
  'linear-gradient(135deg,#d69e2e,#dd6b20)',
  'linear-gradient(135deg,#38a169,#0099cc)',
  'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  'linear-gradient(135deg,#e53e3e,#dd6b20)',
  'linear-gradient(135deg,#805ad5,#553c9a)',
]

export default function TeamPage() {
  const { t, dir } = useLang()
  const [techs, setTechs]         = useState<Tech[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [todayJobs, setTodayJobs] = useState<Record<string,number>>({})
  const [form, setForm] = useState({ full_name:'', phone:'', email:'', level:'1', tech_code:'' })

  const levelColors: Record<number,string> = { 1:'#718096', 2:'#3182ce', 3:'#38a169' }
  const levelLabel: Record<number,string>  = {
    1: t('مبتدئ','Junior'), 2: t('متقدم','Advanced'), 3: t('خبير','Expert')
  }

  async function load() {
    setLoading(true)
    const todayStr = new Date().toISOString().slice(0,10)
    const [{ data: td }, { data: sc }] = await Promise.all([
      supabase.from('technicians').select('*').order('full_name'),
      supabase.from('schedules').select('technician_name').eq('scheduled_date', todayStr),
    ])
    if (td) setTechs(td)
    // Count today's jobs per technician
    const counts: Record<string,number> = {}
    sc?.forEach(s => { if (s.technician_name) counts[s.technician_name] = (counts[s.technician_name]||0) + 1 })
    setTodayJobs(counts)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.full_name || !form.phone) return
    setSaving(true)
    const code = form.tech_code || `INST-${String(Math.floor(Math.random()*9000)+1000)}`
    const { error } = await supabase.from('technicians').insert([{
      full_name: form.full_name, phone: form.phone,
      email: form.email || null, level: parseInt(form.level),
      tech_code: code, is_active: true,
      join_date: new Date().toISOString().slice(0,10),
    }])
    if (!error) {
      setShowModal(false)
      setForm({ full_name:'', phone:'', email:'', level:'1', tech_code:'' })
      load()
    }
    setSaving(false)
  }

  return (
    <div dir={dir} style={{ fontFamily:'Tajawal, Arial, sans-serif', minHeight:'100vh', background:'#f7f8fc' }}>
      <Topbar title="فريق الفنيين" titleEn="Technicians" />
      <div style={{ padding:'24px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <div style={{ fontSize:'20px', fontWeight:900, color:'#1a202c' }}>👷 {t('إدارة فريق الفنيين','Technician Team')}</div>
            <div style={{ fontSize:'12px', color:'#718096', marginTop:'2px' }}>{techs.filter(t=>t.is_active).length} {t('فني نشط','active technicians')}</div>
          </div>
          <button onClick={()=>setShowModal(true)} style={{ background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontWeight:700, padding:'9px 18px', borderRadius:'9px', border:'none', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
            ＋ {t('فني جديد','New Technician')}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
          {[
            { label:t('فنيون نشطون','Active'),       value:techs.filter(t=>t.is_active).length,  color:'#38a169', icon:'👷' },
            { label:t('Level 3 — خبير','Expert'),     value:techs.filter(t=>t.level===3).length,  color:'#38a169', icon:'⭐' },
            { label:t('Level 2 — متقدم','Advanced'),  value:techs.filter(t=>t.level===2).length,  color:'#3182ce', icon:'🔧' },
            { label:t('مهام اليوم','Today\'s Jobs'),  value:Object.values(todayJobs).reduce((a,b)=>a+b,0), color:'#d69e2e', icon:'📅' },
          ].map((k,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea' }}>
              <div style={{ fontSize:'20px', marginBottom:'10px' }}>{k.icon}</div>
              <div style={{ fontSize:'28px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:k.color, lineHeight:1, marginBottom:'4px' }}>{k.value}</div>
              <div style={{ fontSize:'12px', color:'#718096' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Cards */}
        {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0' }}>⏳</div> : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
              {techs.map((tech,i) => {
                const todayCount = todayJobs[tech.full_name] || 0
                return (
                  <div key={tech.id} style={{ background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', opacity:tech.is_active?1:0.6 }}>
                    {/* Avatar + Status */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:avatarColors[i%avatarColors.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:'#fff' }}>
                        {tech.full_name.charAt(0)}
                      </div>
                      <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 8px', borderRadius:'20px', background:tech.is_active?'rgba(56,161,105,.1)':'rgba(113,128,150,.1)', color:tech.is_active?'#38a169':'#718096', border:`1px solid ${tech.is_active?'rgba(56,161,105,.2)':'rgba(113,128,150,.2)'}` }}>
                        {tech.is_active ? t('● نشط','● Active') : t('○ غير نشط','○ Inactive')}
                      </span>
                    </div>

                    {/* Name + Code */}
                    <div style={{ fontSize:'14px', fontWeight:700, color:'#1a202c', marginBottom:'2px' }}>{tech.full_name}</div>
                    <div style={{ fontSize:'10px', color:'#a0aec0', fontFamily:'IBM Plex Mono,monospace', marginBottom:'12px' }}>{tech.tech_code}</div>

                    {/* Stats */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px' }}>
                        <span style={{ color:'#718096' }}>{t('المستوى','Level')}</span>
                        <span style={{ fontWeight:700, color:levelColors[tech.level]||'#718096', background:`${levelColors[tech.level]||'#718096'}15`, padding:'1px 8px', borderRadius:'10px', fontSize:'10px' }}>
                          {levelLabel[tech.level]||`L${tech.level}`}
                        </span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px' }}>
                        <span style={{ color:'#718096' }}>{t('الهاتف','Phone')}</span>
                        <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:'#4a5568' }}>{tech.phone||'—'}</span>
                      </div>
                      {/* TODAY'S JOBS */}
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', padding:'6px 8px', background:todayCount>0?'rgba(214,158,46,.08)':'rgba(56,161,105,.05)', borderRadius:'7px', border:`1px solid ${todayCount>0?'rgba(214,158,46,.2)':'rgba(56,161,105,.15)'}` }}>
                        <span style={{ color:'#718096' }}>📅 {t('أجهزة اليوم','Today\'s Devices')}</span>
                        <span style={{ fontWeight:900, color:todayCount>0?'#d69e2e':'#38a169', fontFamily:'Rajdhani,sans-serif', fontSize:'14px' }}>{todayCount}</span>
                      </div>
                    </div>

                    {/* Level Bar */}
                    <div style={{ height:'4px', borderRadius:'3px', background:'#f0f2f5', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:'3px', background:avatarColors[i%avatarColors.length], width:`${(tech.level/3)*100}%`, transition:'width .5s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Table */}
            <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e5ea' }}>
                <span style={{ fontWeight:700, fontSize:'13px', color:'#1a202c' }}>📋 {t('سجل الفريق الكامل','Full Team Register')}</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f7fafc' }}>
                      {[t('الفني','Technician'),t('المعرّف','Code'),t('المستوى','Level'),t('الهاتف','Phone'),t('البريد','Email'),t('الانضمام','Joined'),t('أجهزة اليوم','Today'),t('الحالة','Status')].map(h => (
                        <th key={h} style={{ padding:'9px 14px', textAlign:'right', fontSize:'10px', color:'#a0aec0', letterSpacing:'1px', fontFamily:'IBM Plex Mono,monospace', borderBottom:'2px solid #e2e5ea', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {techs.map((tech,i) => {
                      const tc = todayJobs[tech.full_name] || 0
                      return (
                        <tr key={tech.id} style={{ borderBottom:'1px solid #f0f2f5', background:i%2===0?'#fff':'#fafbfc' }}
                          onMouseEnter={e=>(e.currentTarget.style.background='#ebf8ff')}
                          onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'#fff':'#fafbfc')}
                        >
                          <td style={{ padding:'11px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:avatarColors[i%avatarColors.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#fff', flexShrink:0 }}>{tech.full_name.charAt(0)}</div>
                              <div style={{ fontWeight:700, fontSize:'13px', color:'#1a202c' }}>{tech.full_name}</div>
                            </div>
                          </td>
                          <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', color:'#3182ce', fontSize:'10px' }}>{tech.tech_code}</td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{ background:tech.level===3?'rgba(56,161,105,.1)':tech.level===2?'rgba(49,130,206,.1)':'rgba(113,128,150,.1)', color:levelColors[tech.level]||'#718096', fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'20px' }}>
                              {levelLabel[tech.level]||`L${tech.level}`}
                            </span>
                          </td>
                          <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'11px', color:'#4a5568' }}>{tech.phone||'—'}</td>
                          <td style={{ padding:'11px 14px', fontSize:'11px', color:'#718096' }}>{tech.email||'—'}</td>
                          <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:'#a0aec0' }}>{tech.join_date||'—'}</td>
                          <td style={{ padding:'11px 14px', textAlign:'center' }}>
                            <span style={{ fontWeight:900, color:tc>0?'#d69e2e':'#38a169', fontFamily:'Rajdhani,sans-serif', fontSize:'16px' }}>{tc}</span>
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{ background:tech.is_active?'rgba(56,161,105,.1)':'rgba(113,128,150,.1)', color:tech.is_active?'#38a169':'#718096', fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'20px', border:`1px solid ${tech.is_active?'rgba(56,161,105,.2)':'rgba(113,128,150,.2)'}` }}>
                              {tech.is_active ? t('● نشط','● Active') : t('○ غير نشط','○ Inactive')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'460px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a202c' }}>👷 {t('إضافة فني جديد','New Technician')}</div>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#a0aec0' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الاسم الكامل *','Full Name *')}</label>
                <input value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} placeholder={t('محمد العمري','Mohammed')} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الهاتف *','Phone *')}</label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="05xxxxxxxx" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('المستوى','Level')}</label>
                <select value={form.level} onChange={e=>setForm(f=>({...f,level:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="1">{t('Level 1 — مبتدئ','Level 1 — Junior')}</option>
                  <option value="2">{t('Level 2 — متقدم','Level 2 — Advanced')}</option>
                  <option value="3">{t('Level 3 — خبير','Level 3 — Expert')}</option>
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('البريد الإلكتروني','Email')}</label>
                <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="tech@ate-platform.com" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 20px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>{t('إلغاء','Cancel')}</button>
              <button onClick={handleSave} disabled={saving||!form.full_name||!form.phone} style={{ padding:'9px 24px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'Tajawal,sans-serif', opacity:(saving||!form.full_name||!form.phone)?0.6:1 }}>
                {saving?'⏳':t('💾 إضافة','💾 Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}