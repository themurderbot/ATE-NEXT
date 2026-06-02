'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Cert = {
  id: string; cert_ref: string; status: string
  issue_date: string; expiry_date: string; device_serial: string
  clients?: { company_name: string }
  properties?: { property_name: string }
  technicians?: { full_name: string; tech_code: string }
}
type Client   = { id: string; company_name: string }
type Property = { id: string; property_name: string }
type Tech     = { id: string; full_name: string; tech_code: string }
type Request  = { id: string; request_code: string }

export default function CertsPage() {
  const { t, dir } = useLang()
  const [certs, setCerts]     = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [props, setProps]     = useState<Property[]>([])
  const [techs, setTechs]     = useState<Tech[]>([])
  const [reqs, setReqs]       = useState<Request[]>([])
  const [form, setForm] = useState({
    client_id:'', property_id:'', request_id:'', technician_id:'',
    device_serial:'', issue_date: new Date().toISOString().slice(0,10),
    expiry_date:'', validity_years:'1',
  })

  const statusLabel: Record<string,string> = {
    active: t('● سارية','● Active'), expiring_soon: t('⚠ تنتهي قريباً','⚠ Expiring Soon'),
    expired: t('✕ منتهية','✕ Expired'), renewed: t('↺ مجددة','↺ Renewed'),
  }
  const statusColor: Record<string,string> = { active:'#38a169', expiring_soon:'#d69e2e', expired:'#e53e3e', renewed:'#3182ce' }
  const statusBg: Record<string,string> = { active:'rgba(56,161,105,.1)', expiring_soon:'rgba(214,158,46,.1)', expired:'rgba(229,62,62,.1)', renewed:'rgba(49,130,206,.1)' }

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('certificates').select('*, clients(company_name), properties(property_name), technicians(full_name, tech_code)').order('created_at', { ascending: false })
    if (data) setCerts(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function openModal() {
    const [{ data: cl }, { data: pr }, { data: tc }, { data: rq }] = await Promise.all([
      supabase.from('clients').select('id, company_name').order('company_name'),
      supabase.from('properties').select('id, property_name').order('property_name'),
      supabase.from('technicians').select('id, full_name, tech_code').eq('is_active', true).order('full_name'),
      supabase.from('requests').select('id, request_code').eq('stage','installed').order('created_at',{ascending:false}),
    ])
    if (cl) setClients(cl)
    if (pr) setProps(pr)
    if (tc) setTechs(tc)
    if (rq) setReqs(rq)
    setShowModal(true)
  }

  function calcExpiry(issueDate: string, years: string) {
    if (!issueDate) return ''
    const d = new Date(issueDate)
    d.setFullYear(d.getFullYear() + parseInt(years || '1'))
    return d.toISOString().slice(0,10)
  }

  async function handleSave() {
    if (!form.client_id || !form.device_serial || !form.issue_date) return
    setSaving(true)
    const code = `ATE-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`
    const expiry = form.expiry_date || calcExpiry(form.issue_date, form.validity_years)
    const { error } = await supabase.from('certificates').insert([{
      cert_ref: code,
      client_id: form.client_id,
      property_id: form.property_id || null,
      request_id: form.request_id || null,
      technician_id: form.technician_id || null,
      device_serial: form.device_serial,
      issue_date: form.issue_date,
      expiry_date: expiry,
      status: 'active',
    }])
    if (!error) {
      if (form.request_id) await supabase.from('requests').update({ stage:'certified' }).eq('id', form.request_id)
      setShowModal(false)
      setForm({ client_id:'', property_id:'', request_id:'', technician_id:'', device_serial:'', issue_date: new Date().toISOString().slice(0,10), expiry_date:'', validity_years:'1' })
      load()
    }
    setSaving(false)
  }

  async function renewCert(cert: Cert) {
    const newExpiry = calcExpiry(new Date().toISOString().slice(0,10), '1')
    const code = `ATE-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`
    await supabase.from('certificates').update({ status:'renewed' }).eq('id', cert.id)
    await supabase.from('certificates').insert([{
      cert_ref: code,
      client_id: (cert as any).client_id,
      property_id: (cert as any).property_id,
      device_serial: cert.device_serial,
      issue_date: new Date().toISOString().slice(0,10),
      expiry_date: newExpiry, status:'active',
    }])
    load()
  }

  return (
    <div dir={dir} style={{ fontFamily:'Tajawal, Arial, sans-serif', minHeight:'100vh', background:'#f7f8fc' }}>
      <Topbar title="الشهادات" titleEn="Certificates" />
      <div style={{ padding:'24px' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <div style={{ fontSize:'20px', fontWeight:900, color:'#1a202c' }}>📜 {t('إصدار وإدارة الشهادات','Certificate Management')}</div>
            <div style={{ fontSize:'12px', color:'#718096', marginTop:'2px' }}>{certs.length} {t('شهادة إجمالاً','total certificates')}</div>
          </div>
          <button onClick={openModal} style={{ background:'linear-gradient(135deg,#b7791f,#d69e2e)', color:'#fff', fontWeight:700, padding:'9px 18px', borderRadius:'9px', border:'none', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
            ＋ {t('إصدار شهادة جديدة','Issue New Certificate')}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
          {[
            { label:t('إجمالي','Total'),       value:certs.length,                                         color:'#3182ce', icon:'📜' },
            { label:t('سارية','Active'),        value:certs.filter(c=>c.status==='active').length,          color:'#38a169', icon:'✅' },
            { label:t('تنتهي قريباً','Expiring'),value:certs.filter(c=>c.status==='expiring_soon').length, color:'#d69e2e', icon:'⚠️' },
            { label:t('منتهية','Expired'),      value:certs.filter(c=>c.status==='expired').length,         color:'#e53e3e', icon:'✕' },
          ].map((k,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea' }}>
              <div style={{ fontSize:'20px', marginBottom:'10px' }}>{k.icon}</div>
              <div style={{ fontSize:'28px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:k.color, lineHeight:1, marginBottom:'4px' }}>{k.value}</div>
              <div style={{ fontSize:'12px', color:'#718096' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e5ea', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:'13px', color:'#1a202c' }}>{t('سجل الشهادات الصادرة','Issued Certificates')}</span>
            <span style={{ fontSize:'11px', color:'#a0aec0' }}>{certs.length} {t('شهادة','certs')}</span>
          </div>
          {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0' }}>⏳</div> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f7fafc' }}>
                    {[t('رقم الشهادة','Cert #'),t('العميل','Client'),t('العقار','Property'),t('S/N الجهاز','Device S/N'),t('تاريخ الإصدار','Issue'),t('تاريخ الانتهاء','Expiry'),t('الفني','Tech'),t('الحالة','Status'),t('إجراءات','Actions')].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'right', fontSize:'10px', color:'#a0aec0', letterSpacing:'1px', fontFamily:'IBM Plex Mono,monospace', borderBottom:'2px solid #e2e5ea', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {certs.map((c,i) => (
                    <tr key={c.id} style={{ borderBottom:'1px solid #f0f2f5', background:i%2===0?'#fff':'#fafbfc' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#fffff0')}
                      onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'#fff':'#fafbfc')}
                    >
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', color:'#b7791f', fontSize:'11px', fontWeight:700 }}>{c.cert_ref||'—'}</td>
                      <td style={{ padding:'11px 14px', fontWeight:700, fontSize:'13px', color:'#1a202c' }}>{c.clients?.company_name||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:'#718096' }}>{c.properties?.property_name||'—'}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:'#4a5568' }}>{c.device_serial||'—'}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:'#718096' }}>{c.issue_date||'—'}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:c.status==='expired'?'#e53e3e':c.status==='expiring_soon'?'#d69e2e':'#38a169' }}>{c.expiry_date||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'11px', color:'#4a5568' }}>{c.technicians?.full_name||'—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ background:statusBg[c.status], color:statusColor[c.status], fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'20px', border:`1px solid ${statusColor[c.status]}33`, whiteSpace:'nowrap' }}>
                          {statusLabel[c.status]}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', gap:'5px' }}>
                          <button style={{ padding:'5px 10px', borderRadius:'7px', border:'1px solid #e2e5ea', background:'transparent', fontSize:'11px', fontWeight:700, color:'#4a5568', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>PDF</button>
                          {(c.status==='expiring_soon'||c.status==='expired') && (
                            <button onClick={()=>renewCert(c)} style={{ padding:'5px 10px', borderRadius:'7px', border:'none', background:'linear-gradient(135deg,#d69e2e,#b7791f)', fontSize:'11px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                              {t('تجديد','Renew')}
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
          <div style={{ padding:'10px 18px', borderTop:'1px solid #e2e5ea', fontSize:'11px', color:'#a0aec0' }}>
            {t('عرض','Showing')} {certs.length} {t('شهادة','certificates')}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'540px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a202c' }}>📜 {t('إصدار شهادة جديدة','Issue New Certificate')}</div>
              <button onClick={()=>setShowModal(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#a0aec0' }}>✕</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('العميل *','Client *')}</label>
                <select value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر العميل','Select Client')}</option>
                  {clients.map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('العقار','Property')}</label>
                <select value={form.property_id} onChange={e=>setForm(f=>({...f,property_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر العقار','Select Property')}</option>
                  {props.map(p=><option key={p.id} value={p.id}>{p.property_name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الطلب المرتبط','Linked Request')}</label>
                <select value={form.request_id} onChange={e=>setForm(f=>({...f,request_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر الطلب (اختياري)','Select Request (optional)')}</option>
                  {reqs.map(r=><option key={r.id} value={r.id}>{r.request_code}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('رقم الجهاز S/N *','Device Serial *')}</label>
                <input value={form.device_serial} onChange={e=>setForm(f=>({...f,device_serial:e.target.value}))} placeholder="FP-A304-001" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('تاريخ الإصدار *','Issue Date *')}</label>
                <input type="date" value={form.issue_date} onChange={e=>{ setForm(f=>({...f, issue_date:e.target.value, expiry_date:calcExpiry(e.target.value,form.validity_years)})) }} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('مدة الصلاحية','Validity')}</label>
                <select value={form.validity_years} onChange={e=>setForm(f=>({...f, validity_years:e.target.value, expiry_date:calcExpiry(f.issue_date,e.target.value)}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="1">{t('سنة واحدة','1 Year')}</option>
                  <option value="2">{t('سنتان','2 Years')}</option>
                  <option value="3">{t('3 سنوات','3 Years')}</option>
                  <option value="5">{t('5 سنوات','5 Years')}</option>
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('تاريخ الانتهاء','Expiry Date')}</label>
                <input type="date" value={form.expiry_date} onChange={e=>setForm(f=>({...f,expiry_date:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'monospace', outline:'none', boxSizing:'border-box', background:'#f0fff4' }} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('الفني المُركِّب','Installing Technician')}</label>
                <select value={form.technician_id} onChange={e=>setForm(f=>({...f,technician_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر الفني','Select Technician')}</option>
                  {techs.map(tc=><option key={tc.id} value={tc.id}>{tc.full_name} ({tc.tech_code})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 20px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>{t('إلغاء','Cancel')}</button>
              <button onClick={handleSave} disabled={saving||!form.client_id||!form.device_serial||!form.issue_date} style={{ padding:'9px 24px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#b7791f,#d69e2e)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'Tajawal,sans-serif', opacity:(saving||!form.client_id||!form.device_serial)?0.6:1 }}>
                {saving?'⏳':t('📜 إصدار الشهادة','📜 Issue Certificate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}