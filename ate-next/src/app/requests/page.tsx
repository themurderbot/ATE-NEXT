'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Request = {
  id: string; request_code: string; stage: string
  devices_count: number; total_amount: number; created_at: string
  clients?: { company_name: string }
  properties?: { property_name: string; district: string }
}
type Client = { id: string; company_name: string }
type Property = { id: string; property_name: string }

export default function RequestsPage() {
  const { t, dir } = useLang()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [clients, setClients]   = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [form, setForm] = useState({ client_id:'', property_id:'', devices_count:'', total_amount:'', notes:'', stage:'new' })

  const stageLabel: Record<string,string> = {
    new: t('① طلب جديد','① New'), awaiting_payment: t('② بانتظار الدفع','② Awaiting Payment'),
    scheduled: t('③ مجدول','③ Scheduled'), installed: t('④ تم التركيب','④ Installed'), certified: t('⑤ شهادة صادرة','⑤ Certified'),
  }
  const stageShort: Record<string,string> = {
    new: t('طلب جديد','New'), awaiting_payment: t('بانتظار الدفع','Awaiting Payment'),
    scheduled: t('مجدول','Scheduled'), installed: t('تم التركيب','Installed'), certified: t('شهادة صادرة','Certified'),
  }
  const stageColor: Record<string,string> = { new:'#718096', awaiting_payment:'#3182ce', scheduled:'#d69e2e', installed:'#dd6b20', certified:'#38a169' }
  const stageBg: Record<string,string> = { new:'rgba(113,128,150,.1)', awaiting_payment:'rgba(49,130,206,.1)', scheduled:'rgba(214,158,46,.1)', installed:'rgba(221,107,32,.1)', certified:'rgba(56,161,105,.1)' }
  const stages = ['new','awaiting_payment','scheduled','installed','certified']

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('requests').select('*, clients(company_name), properties(property_name, district)').order('created_at', { ascending: false })
    if (data) setRequests(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function openModal() {
    const [{ data: cl }, { data: pr }] = await Promise.all([
      supabase.from('clients').select('id, company_name').order('company_name'),
      supabase.from('properties').select('id, property_name').order('property_name'),
    ])
    if (cl) setClients(cl)
    if (pr) setProperties(pr)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.client_id || !form.devices_count) return
    setSaving(true)
    const code = `REQ-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`
    const { error } = await supabase.from('requests').insert([{
      request_code: code, client_id: form.client_id,
      property_id: form.property_id || null,
      devices_count: parseInt(form.devices_count) || 0,
      total_amount: parseFloat(form.total_amount) || 0,
      stage: form.stage, notes: form.notes,
    }])
    if (!error) {
      setShowModal(false)
      setForm({ client_id:'', property_id:'', devices_count:'', total_amount:'', notes:'', stage:'new' })
      load()
    }
    setSaving(false)
  }

  async function advanceStage(r: Request) {
    const order = ['new','awaiting_payment','scheduled','installed','certified']
    const idx = order.indexOf(r.stage)
    if (idx < order.length - 1) {
      await supabase.from('requests').update({ stage: order[idx+1] }).eq('id', r.id)
      load()
    }
  }

  return (
    <div dir={dir} style={{ fontFamily:'Tajawal, Arial, sans-serif', minHeight:'100vh', background:'#f7f8fc' }}>
      <Topbar title="الطلبات الواردة" titleEn="Requests" />
      <div style={{ padding:'24px' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <div style={{ fontSize:'20px', fontWeight:900, color:'#1a202c' }}>📋 {t('الطلبات الواردة','Incoming Requests')}</div>
            <div style={{ fontSize:'12px', color:'#718096', marginTop:'2px' }}>{requests.length} {t('طلب إجمالاً','total requests')}</div>
          </div>
          <button onClick={openModal} style={{ background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontWeight:700, padding:'9px 18px', borderRadius:'9px', border:'none', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
            ＋ {t('طلب جديد','New Request')}
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px', marginBottom:'20px' }}>
          {stages.map(stage => (
            <div key={stage} style={{ background:'#fff', borderRadius:'12px', padding:'14px', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea' }}>
              <div style={{ fontSize:'22px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:stageColor[stage] }}>{requests.filter(r=>r.stage===stage).length}</div>
              <div style={{ fontSize:'11px', color:'#718096', marginTop:'2px' }}>{stageShort[stage]}</div>
              <div style={{ height:'3px', background:stageColor[stage], borderRadius:'2px', marginTop:'8px', opacity:.5 }}></div>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e5ea', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:'13px', color:'#1a202c' }}>{t('سجل الطلبات','Requests Log')}</span>
            <span style={{ fontSize:'11px', color:'#a0aec0' }}>{requests.length} {t('طلب','requests')}</span>
          </div>
          {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0' }}>⏳</div> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f7fafc' }}>
                    {[t('رقم الطلب','Req #'),t('العميل','Client'),t('العقار','Property'),t('الأجهزة','Devices'),t('القيمة','Value'),t('التاريخ','Date'),t('المرحلة','Stage'),t('إجراءات','Actions')].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'right', fontSize:'10px', color:'#a0aec0', letterSpacing:'1px', fontFamily:'IBM Plex Mono,monospace', borderBottom:'2px solid #e2e5ea', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom:'1px solid #f0f2f5', background: i%2===0?'#fff':'#fafbfc' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#ebf8ff')}
                      onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'#fff':'#fafbfc')}
                    >
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', color:'#3182ce', fontSize:'11px' }}>{r.request_code||'—'}</td>
                      <td style={{ padding:'11px 14px', fontWeight:700, fontSize:'13px', color:'#1a202c' }}>{r.clients?.company_name||'—'}</td>
                      <td style={{ padding:'11px 14px', fontSize:'12px', color:'#718096' }}>{r.properties?.property_name||'—'}</td>
                      <td style={{ padding:'11px 14px', textAlign:'center', fontWeight:700, color:'#1a202c' }}>{r.devices_count}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'Rajdhani,sans-serif', fontWeight:700, color:'#3182ce' }}>{Number(r.total_amount).toLocaleString()} {t('د','AED')}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:'#a0aec0' }}>{r.created_at?.split('T')[0]}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ background:stageBg[r.stage], color:stageColor[r.stage], fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'20px', border:`1px solid ${stageColor[r.stage]}33`, whiteSpace:'nowrap' }}>
                          {stageLabel[r.stage]}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', gap:'5px' }}>
                          <button style={{ padding:'5px 10px', borderRadius:'7px', border:'1px solid #e2e5ea', background:'transparent', fontSize:'11px', fontWeight:700, color:'#4a5568', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                            {t('تفاصيل','Details')}
                          </button>
                          {r.stage !== 'certified' && (
                            <button onClick={() => advanceStage(r)} style={{ padding:'5px 10px', borderRadius:'7px', border:'none', background:'linear-gradient(135deg,#38a169,#2f855a)', fontSize:'11px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                              {t('تقدّم ←','Advance →')}
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
            {t('عرض','Showing')} {requests.length} {t('طلب','requests')}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'520px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a202c' }}>📋 {t('إضافة طلب جديد','New Request')}</div>
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
                  {properties.map(p=><option key={p.id} value={p.id}>{p.property_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('عدد الأجهزة *','Devices *')}</label>
                <input type="number" value={form.devices_count} onChange={e=>setForm(f=>({...f,devices_count:e.target.value}))} placeholder="0" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('القيمة الإجمالية','Total Amount')}</label>
                <input type="number" value={form.total_amount} onChange={e=>setForm(f=>({...f,total_amount:e.target.value}))} placeholder="0.00" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('المرحلة','Stage')}</label>
                <select value={form.stage} onChange={e=>setForm(f=>({...f,stage:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  {stages.map(s=><option key={s} value={s}>{stageShort[s]}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('ملاحظات','Notes')}</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} placeholder={t('ملاحظات إضافية...','Additional notes...')} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 20px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>{t('إلغاء','Cancel')}</button>
              <button onClick={handleSave} disabled={saving||!form.client_id||!form.devices_count} style={{ padding:'9px 24px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'Tajawal,sans-serif', opacity:(saving||!form.client_id||!form.devices_count)?0.6:1 }}>
                {saving ? '⏳' : t('💾 حفظ الطلب','💾 Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}