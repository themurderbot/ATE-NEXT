'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'

type Payment = {
  id: string
  invoice_id: string
  amount: number
  method: string
  paid_at: string
  notes: string
  invoices?: { invoice_code: string; clients?: { company_name: string } }
}

const methodLabel: Record<string, string> = {
  cash: '💵 نقد', bank_transfer: '🏦 تحويل بنكي',
  check: '📄 شيك', card: '💳 بطاقة',
}
const methodColor: Record<string, string> = {
  cash: '#38a169', bank_transfer: '#3182ce', check: '#d69e2e', card: '#805ad5',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [invoices, setInvoices]   = useState<any[]>([])
  const [form, setForm] = useState({ invoice_id: '', amount: '', method: 'bank_transfer', notes: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('payments')
      .select('*, invoices(invoice_code, clients(company_name))')
      .order('paid_at', { ascending: false })
    if (data) setPayments(data)
    setLoading(false)
  }

  async function loadInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_code, amount, clients(company_name)')
      .eq('status', 'pending')
    if (data) setInvoices(data)
  }

  useEffect(() => { load(); loadInvoices() }, [])

  async function handleSave() {
    if (!form.invoice_id || !form.amount) return
    setSaving(true)
    await supabase.from('payments').insert([{
      invoice_id: form.invoice_id,
      amount: Number(form.amount),
      method: form.method,
      notes: form.notes,
      paid_at: new Date().toISOString(),
    }])
    await supabase.from('invoices').update({ status: 'paid' }).eq('id', form.invoice_id)
    setShowModal(false)
    setForm({ invoice_id: '', amount: '', method: 'bank_transfer', notes: '' })
    load()
    setSaving(false)
  }

  const totalToday  = payments.filter(p => p.paid_at?.startsWith(new Date().toISOString().slice(0,10))).reduce((s,p) => s + Number(p.amount), 0)
  const totalMonth  = payments.filter(p => p.paid_at?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,p) => s + Number(p.amount), 0)
  const totalAll    = payments.reduce((s,p) => s + Number(p.amount), 0)

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="المدفوعات" titleEn="Payments" />
      <div style={{ padding: '24px' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي المحصّل', value: totalAll,   color: '#38a169', icon: '💰', note: 'كل الوقت' },
            { label: 'هذا الشهر',      value: totalMonth, color: '#3182ce', icon: '📅', note: new Date().toLocaleString('ar-SA',{month:'long'}) },
            { label: 'اليوم',          value: totalToday, color: '#805ad5', icon: '⚡', note: 'آخر 24 ساعة' },
          ].map((k,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'12px', padding:'18px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'9px', background:`${k.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>{k.icon}</div>
                <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'6px', background:`${k.color}15`, color:k.color }}>{k.note}</span>
              </div>
              <div style={{ fontSize:'28px', fontWeight:700, fontFamily:'Rajdhani,sans-serif', color:k.color, lineHeight:1, marginBottom:'4px' }}>{k.value.toLocaleString()} د</div>
              <div style={{ fontSize:'12px', color:'#718096' }}>{k.label}</div>
              <div style={{ height:'3px', background:k.color, borderRadius:'2px', marginTop:'10px', opacity:.3 }}></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:'#1a202c' }}>سجل المدفوعات ({payments.length})</div>
          <button onClick={() => setShowModal(true)} style={{
            background:'linear-gradient(135deg,#38a169,#2f855a)',
            color:'#fff', border:'none', borderRadius:'9px',
            padding:'9px 18px', fontSize:'13px', fontWeight:700,
            cursor:'pointer', fontFamily:'Tajawal,sans-serif',
          }}>＋ تسجيل دفعة</button>
        </div>

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.08)', border:'1px solid #e2e5ea', overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:'60px', textAlign:'center', color:'#a0aec0' }}>⏳ جارٍ التحميل...</div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f7f8fc', borderBottom:'2px solid #e2e5ea' }}>
                  {['التاريخ','العميل','رقم الفاتورة','المبلغ','طريقة الدفع','ملاحظات'].map(h => (
                    <th key={h} style={{ padding:'11px 16px', textAlign:'right', fontSize:'10px', color:'#a0aec0', fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p,i) => (
                  <tr key={p.id} style={{ borderBottom:'1px solid #f0f2f5', background: i%2===0?'#fff':'#fafbfc' }}>
                    <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'11px', color:'#718096' }}>
                      {p.paid_at ? new Date(p.paid_at).toLocaleDateString('ar-SA') : '—'}
                    </td>
                    <td style={{ padding:'12px 16px', fontWeight:700, fontSize:'13px', color:'#1a202c' }}>
                      {p.invoices?.clients?.company_name || '—'}
                    </td>
                    <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:'11px', color:'#3182ce' }}>
                      {p.invoices?.invoice_code || '—'}
                    </td>
                    <td style={{ padding:'12px 16px', fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'15px', color:'#38a169' }}>
                      {Number(p.amount).toLocaleString()} د
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{
                        background:`${methodColor[p.method]||'#718096'}15`,
                        color: methodColor[p.method]||'#718096',
                        fontSize:'10px', fontWeight:700,
                        padding:'3px 9px', borderRadius:'20px',
                        border:`1px solid ${methodColor[p.method]||'#718096'}33`,
                      }}>{methodLabel[p.method]||p.method}</span>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:'12px', color:'#718096' }}>{p.notes||'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e => { if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px', width:'440px', maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'17px', fontWeight:900, color:'#1a202c' }}>💰 تسجيل دفعة جديدة</div>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#a0aec0' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>الفاتورة *</label>
                <select value={form.invoice_id} onChange={e => setForm(f=>({...f, invoice_id:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="">اختر فاتورة...</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_code} — {inv.clients?.company_name} ({Number(inv.amount).toLocaleString()} د)</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>المبلغ *</label>
                <input value={form.amount} onChange={e => setForm(f=>({...f, amount:e.target.value}))} placeholder="0" type="number" style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>طريقة الدفع</label>
                <select value={form.method} onChange={e => setForm(f=>({...f, method:e.target.value}))} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none' }}>
                  <option value="bank_transfer">🏦 تحويل بنكي</option>
                  <option value="cash">💵 نقد</option>
                  <option value="check">📄 شيك</option>
                  <option value="card">💳 بطاقة</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:'11px', fontWeight:700, color:'#4a5568', display:'block', marginBottom:'5px' }}>ملاحظات</label>
                <input value={form.notes} onChange={e => setForm(f=>({...f, notes:e.target.value}))} placeholder="أي ملاحظات..." style={{ width:'100%', padding:'9px 12px', border:'1px solid #e2e5ea', borderRadius:'8px', fontSize:'13px', fontFamily:'Tajawal,sans-serif', outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding:'9px 20px', border:'1px solid #e2e5ea', borderRadius:'8px', background:'#fff', fontSize:'13px', cursor:'pointer', fontFamily:'Tajawal,sans-serif' }}>إلغاء</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'9px 24px', border:'none', borderRadius:'8px', background:'linear-gradient(135deg,#38a169,#2f855a)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'Tajawal,sans-serif', opacity:saving?.7:1 }}>
                {saving ? '⏳ جارٍ الحفظ...' : '💾 تسجيل الدفعة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}