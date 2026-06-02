'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Invoice = {
  id: string; invoice_code: string; amount: number; status: string
  issue_date: string; due_date: string; vat_amount?: number; subtotal?: number
  notes?: string
  clients?: { company_name: string; phone?: string; email?: string; city?: string }
  requests?: { request_code: string }
}
type Client = { id: string; company_name: string }
type Request = { id: string; request_code: string; total_amount: number }

export default function InvoicesPage() {
  const { t, dir } = useLang()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPDF, setShowPDF]   = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [saving, setSaving]     = useState(false)
  const [clients, setClients]   = useState<Client[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [form, setForm] = useState({ client_id:'', request_id:'', amount:'', vat_rate:'15', due_date:'', notes:'' })

  const statusLabel: Record<string,string> = {
    pending: t('⏳ مستحقة','⏳ Pending'), paid: t('✓ مدفوعة','✓ Paid'),
    overdue: t('⚠ متأخرة','⚠ Overdue'), cancelled: t('ملغاة','Cancelled'),
  }
  const statusColor: Record<string,string> = { pending:'#d69e2e', paid:'#38a169', overdue:'#e53e3e', cancelled:'#718096' }
  const statusBg: Record<string,string> = { pending:'rgba(214,158,46,.1)', paid:'rgba(56,161,105,.1)', overdue:'rgba(229,62,62,.1)', cancelled:'rgba(113,128,150,.1)' }

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('invoices').select('*, clients(company_name,phone,email,city), requests(request_code)').order('created_at', { ascending: false })
    if (data) setInvoices(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function openModal() {
    const [{ data: cl }, { data: rq }] = await Promise.all([
      supabase.from('clients').select('id, company_name').order('company_name'),
      supabase.from('requests').select('id, request_code, total_amount').order('created_at', { ascending: false }),
    ])
    if (cl) setClients(cl)
    if (rq) setRequests(rq)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.client_id || !form.amount) return
    setSaving(true)
    const subtotal = parseFloat(form.amount) || 0
    const vatRate  = parseFloat(form.vat_rate) || 0
    const vatAmt   = subtotal * (vatRate / 100)
    const total    = subtotal + vatAmt
    const code = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('invoices').insert([{
      invoice_code: code, client_id: form.client_id,
      request_id: form.request_id || null,
      subtotal, vat_amount: vatAmt, amount: total,
      status: 'pending', issue_date: today,
      due_date: form.due_date || null, notes: form.notes,
    }])
    if (!error) {
      setShowModal(false)
      setForm({ client_id:'', request_id:'', amount:'', vat_rate:'15', due_date:'', notes:'' })
      load()
    }
    setSaving(false)
  }

  async function markPaid(id: string) {
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', id)
    load()
  }

  function openPDF(inv: Invoice) { setSelectedInvoice(inv); setShowPDF(true) }

  function printPDF() { window.print() }

  const totalCollected = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.amount),0)
  const totalPending   = invoices.filter(i=>i.status==='pending').reduce((s,i)=>s+Number(i.amount),0)
  const totalOverdue   = invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+Number(i.amount),0)

  return (
    <div dir={dir} style={{ fontFamily:'Tajawal, Arial, sans-serif', minHeight:'100vh', background:'#f7f8fc' }}>
      <Topbar title="الفواتير" titleEn="Invoices" />
      <div style={{ padding:'24px' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
          <div>
            <div style={{ fontSize:'20px', fontWeight:900, color:'#1a202c' }}>💰 {t('الفواتير','Invoices')}</div>
            <div style={{ fontSize:'12px', color:'#718096', marginTop:'2px' }}>{invoices.length} {t('فاتورة إجمالاً','total invoices')}</div>
          </div>
          <button onClick={openModal} style={{ background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontWeight:700, padding:'9px 18px', borderRadius:'9px', border:'none', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
            ＋ {t('فاتورة جديدة','New Invoice')}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'20px' }}>
          {[
            { icon:'✅', color:'#38a169', bg:'rgba(56,161,105,.1)', value:totalCollected, label:t('إجمالي المحصّل','Total Collected'), gradient:'linear-gradient(90deg,#38a169,#0099cc)' },
            { icon:'⏳', color:'#d69e2e', bg:'rgba(214,158,46,.1)', value:totalPending,   label:t('مستحق التحصيل','Pending'),          gradient:'linear-gradient(90deg,#d69e2e,#dd6b20)' },
            { icon:'⚠️', color:'#e53e3e', bg:'rgba(229,62,62,.1)',  value:totalOverdue,   label:t('متأخر التحصيل','Overdue'),           gradient:'linear-gradient(90deg,#e53e3e,#c53030)' },
          ].map((k,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea' }}>
              <div style={{ fontSize:'28px', marginBottom:'8px' }}>{k.icon}</div>
              <div style={{ fontSize:'24px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:k.color }}>{k.value.toLocaleString()} {t('د','AED')}</div>
              <div style={{ fontSize:'12px', color:'#718096' }}>{k.label}</div>
              <div style={{ height:'3px', background:k.gradient, borderRadius:'2px', marginTop:'10px' }}></div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid #e2e5ea', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:'13px', color:'#1a202c' }}>{t('سجل الفواتير','Invoices Log')}</span>
          </div>
          {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0' }}>⏳</div> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f7fafc' }}>
                    {[t('رقم الفاتورة','Invoice #'),t('العميل','Client'),t('الطلب','Request'),t('القيمة','Amount'),t('تاريخ الإصدار','Issue'),t('الاستحقاق','Due'),t('الحالة','Status'),t('إجراءات','Actions')].map(h => (
                      <th key={h} style={{ padding:'9px 14px', textAlign:'right', fontSize:'10px', color:'#a0aec0', letterSpacing:'1px', fontFamily:'IBM Plex Mono,monospace', borderBottom:'2px solid #e2e5ea', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv,i) => (
                    <tr key={inv.id} style={{ borderBottom:'1px solid #f0f2f5', background:i%2===0?'#fff':'#fafbfc' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#ebf8ff')}
                      onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'#fff':'#fafbfc')}
                    >
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', color:'#3182ce', fontSize:'11px' }}>{inv.invoice_code||'—'}</td>
                      <td style={{ padding:'11px 14px', fontWeight:700, fontSize:'13px', color:'#1a202c' }}>{inv.clients?.company_name||'—'}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:'#718096' }}>{inv.requests?.request_code||'—'}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'Rajdhani,sans-serif', fontWeight:700, color:'#3182ce' }}>{Number(inv.amount).toLocaleString()} {t('د','AED')}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:'#718096' }}>{inv.issue_date||'—'}</td>
                      <td style={{ padding:'11px 14px', fontFamily:'IBM Plex Mono,monospace', fontSize:'10px', color:inv.status==='pending'?'#d69e2e':'#718096' }}>{inv.due_date||'—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ background:statusBg[inv.status], color:statusColor[inv.status], fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'20px', border:`1px solid ${statusColor[inv.status]}33`, whiteSpace:'nowrap' }}>
                          {statusLabel[inv.status]}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', gap:'5px' }}>
                          {inv.status==='pending' && (
                            <button onClick={()=>markPaid(inv.id)} style={{ padding:'5px 10px', borderRadius:'7px', border:'none', background:'linear-gradient(135deg,#38a169,#2f855a)', fontSize:'11px', fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                              {t('تسجيل دفع','Record Payment')}
                            </button>
                          )}
                          <button onClick={()=>openPDF(inv)} style={{ padding:'5px 10px', borderRadius:'7px', border:'1px solid #e2e5ea', background:'transparent', fontSize:'11px', fontWeight:700, color:'#4a5568', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                            📄 PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Invoice Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'520px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a202c' }}>💰 {t('فاتورة جديدة','New Invoice')}</div>
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
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('رقم الطلب','Request')}</label>
                <select value={form.request_id} onChange={e=>{ const r=requests.find(x=>x.id===e.target.value); setForm(f=>({...f,request_id:e.target.value,amount:r?String(r.total_amount):''})) }} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">{t('اختر الطلب','Select Request')}</option>
                  {requests.map(r=><option key={r.id} value={r.id}>{r.request_code} — {Number(r.total_amount).toLocaleString()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('المبلغ قبل الضريبة *','Subtotal *')}</label>
                <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('نسبة الضريبة %','VAT %')}</label>
                <input type="number" value={form.vat_rate} onChange={e=>setForm(f=>({...f,vat_rate:e.target.value}))} placeholder="15" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              {form.amount && (
                <div style={{ gridColumn:'span 2', background:'#f0fff4', borderRadius:'8px', padding:'12px', border:'1px solid #c6f6d5' }}>
                  <div style={{ fontSize:'12px', color:'#276749' }}>
                    {t('المجموع:','Total:')} <strong>{(parseFloat(form.amount||'0') * (1 + parseFloat(form.vat_rate||'0')/100)).toLocaleString('en', {minimumFractionDigits:2})} {t('د','AED')}</strong>
                    {' '} ({t('ضريبة','VAT')}: {(parseFloat(form.amount||'0') * parseFloat(form.vat_rate||'0')/100).toLocaleString('en', {minimumFractionDigits:2})})
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('تاريخ الاستحقاق','Due Date')}</label>
                <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>{t('ملاحظات','Notes')}</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowModal(false)} style={{ padding:'9px 20px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>{t('إلغاء','Cancel')}</button>
              <button onClick={handleSave} disabled={saving||!form.client_id||!form.amount} style={{ padding:'9px 24px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'Tajawal,sans-serif', opacity:(saving||!form.client_id||!form.amount)?0.6:1 }}>
                {saving ? '⏳' : t('💾 حفظ الفاتورة','💾 Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPDF && selectedInvoice && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowPDF(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', width:'700px', maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.4)' }}>
            {/* PDF Actions */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e5ea', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f7f8fc' }}>
              <span style={{ fontWeight:700, fontSize:'14px', color:'#1a202c' }}>📄 {t('معاينة الفاتورة','Invoice Preview')}</span>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={printPDF} style={{ padding:'8px 16px', borderRadius:'8px', border:'none', background:'linear-gradient(135deg,#3182ce,#2b6cb0)', color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>
                  🖨️ {t('طباعة / PDF','Print / PDF')}
                </button>
                <button onClick={()=>setShowPDF(false)} style={{ padding:'8px 16px', borderRadius:'8px', border:'1px solid #e2e5ea', background:'#fff', fontSize:'12px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>✕</button>
              </div>
            </div>

            {/* Invoice Content */}
            <div id="invoice-print" style={{ padding:'40px', fontFamily:'Tajawal, Arial, sans-serif', direction:'rtl' }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px', paddingBottom:'20px', borderBottom:'3px solid #3182ce' }}>
                <div>
                  <div style={{ fontSize:'32px', fontWeight:900, color:'#1a202c', fontFamily:'Rajdhani,sans-serif', letterSpacing:'2px' }}>ATE</div>
                  <div style={{ fontSize:'12px', color:'#718096' }}>نظام إدارة أجهزة الإنذار</div>
                  <div style={{ fontSize:'11px', color:'#718096' }}>support@ate-platform.com · 920XXXXXX</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize:'24px', fontWeight:900, color:'#3182ce' }}>INVOICE</div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#1a202c', fontFamily:'monospace' }}>{selectedInvoice.invoice_code}</div>
                  <div style={{ fontSize:'12px', color:'#718096', marginTop:'4px' }}>{t('تاريخ الإصدار:','Issue Date:')} {selectedInvoice.issue_date || new Date().toISOString().split('T')[0]}</div>
                  {selectedInvoice.due_date && <div style={{ fontSize:'12px', color:'#e53e3e', marginTop:'2px' }}>{t('تاريخ الاستحقاق:','Due Date:')} {selectedInvoice.due_date}</div>}
                </div>
              </div>

              {/* Client Info */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'28px' }}>
                <div style={{ background:'#f7f8fc', borderRadius:'10px', padding:'16px' }}>
                  <div style={{ fontSize:'10px', color:'#718096', fontWeight:700, marginBottom:'8px', letterSpacing:'1px' }}>{t('فاتورة إلى','BILL TO')}</div>
                  <div style={{ fontSize:'15px', fontWeight:900, color:'#1a202c', marginBottom:'4px' }}>{selectedInvoice.clients?.company_name || '—'}</div>
                  {selectedInvoice.clients?.phone && <div style={{ fontSize:'12px', color:'#718096' }}>📞 {selectedInvoice.clients.phone}</div>}
                  {selectedInvoice.clients?.email && <div style={{ fontSize:'12px', color:'#718096' }}>✉️ {selectedInvoice.clients.email}</div>}
                  {selectedInvoice.clients?.city  && <div style={{ fontSize:'12px', color:'#718096' }}>📍 {selectedInvoice.clients.city}</div>}
                </div>
                <div style={{ background:'#f7f8fc', borderRadius:'10px', padding:'16px' }}>
                  <div style={{ fontSize:'10px', color:'#718096', fontWeight:700, marginBottom:'8px', letterSpacing:'1px' }}>{t('تفاصيل','DETAILS')}</div>
                  {selectedInvoice.requests?.request_code && <div style={{ fontSize:'12px', color:'#1a202c', marginBottom:'4px' }}>{t('رقم الطلب:','Request:')} <strong>{selectedInvoice.requests.request_code}</strong></div>}
                  <div style={{ fontSize:'12px', color:'#1a202c', marginBottom:'4px' }}>{t('رقم الفاتورة:','Invoice #:')} <strong>{selectedInvoice.invoice_code}</strong></div>
                  <div style={{ display:'inline-block', marginTop:'8px', background:statusBg[selectedInvoice.status], color:statusColor[selectedInvoice.status], padding:'3px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:700, border:`1px solid ${statusColor[selectedInvoice.status]}33` }}>
                    {statusLabel[selectedInvoice.status]}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'24px' }}>
                <thead>
                  <tr style={{ background:'#3182ce', color:'#fff' }}>
                    <th style={{ padding:'12px 16px', textAlign:'right', fontSize:'12px', fontWeight:700 }}>{t('الوصف','Description')}</th>
                    <th style={{ padding:'12px 16px', textAlign:'center', fontSize:'12px', fontWeight:700 }}>{t('الكمية','Qty')}</th>
                    <th style={{ padding:'12px 16px', textAlign:'left', fontSize:'12px', fontWeight:700 }}>{t('المبلغ','Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom:'1px solid #e2e5ea' }}>
                    <td style={{ padding:'14px 16px', fontSize:'13px', color:'#1a202c' }}>{t('خدمات تركيب وصيانة أجهزة الإنذار','Fire Alarm Installation & Maintenance Services')}</td>
                    <td style={{ padding:'14px 16px', textAlign:'center', fontSize:'13px', color:'#1a202c' }}>1</td>
                    <td style={{ padding:'14px 16px', textAlign:'left', fontSize:'13px', color:'#1a202c', fontFamily:'Rajdhani,sans-serif', fontWeight:700 }}>
                      {(selectedInvoice.subtotal || Number(selectedInvoice.amount)).toLocaleString('en', {minimumFractionDigits:2})} {t('د','AED')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{ width:'280px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #e2e5ea', fontSize:'13px', color:'#718096' }}>
                    <span>{t('المجموع الفرعي','Subtotal')}</span>
                    <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700 }}>{(selectedInvoice.subtotal || Number(selectedInvoice.amount)).toLocaleString('en', {minimumFractionDigits:2})} {t('د','AED')}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #e2e5ea', fontSize:'13px', color:'#718096' }}>
                    <span>{t('ضريبة القيمة المضافة (15%)','VAT (15%)')}</span>
                    <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700 }}>{(selectedInvoice.vat_amount || 0).toLocaleString('en', {minimumFractionDigits:2})} {t('د','AED')}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', background:'#3182ce', borderRadius:'8px', marginTop:'8px' }}>
                    <span style={{ fontSize:'14px', fontWeight:900, color:'#fff' }}>{t('الإجمالي','TOTAL')}</span>
                    <span style={{ fontSize:'16px', fontWeight:900, color:'#fff', fontFamily:'Rajdhani,sans-serif' }}>{Number(selectedInvoice.amount).toLocaleString('en', {minimumFractionDigits:2})} {t('د','AED')}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div style={{ marginTop:'24px', padding:'14px', background:'#fffbeb', borderRadius:'8px', border:'1px solid #fef3c7' }}>
                  <div style={{ fontSize:'11px', fontWeight:700, color:'#92400e', marginBottom:'4px' }}>{t('ملاحظات','Notes')}</div>
                  <div style={{ fontSize:'12px', color:'#92400e' }}>{selectedInvoice.notes}</div>
                </div>
              )}

              <div style={{ marginTop:'32px', paddingTop:'16px', borderTop:'1px solid #e2e5ea', textAlign:'center', fontSize:'11px', color:'#a0aec0' }}>
                {t('شكراً لتعاملكم معنا · ATE Platform · نظام إدارة أجهزة الإنذار','Thank you for your business · ATE Platform')}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@media print { body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  )
}