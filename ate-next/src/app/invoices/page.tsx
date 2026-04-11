'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Invoice = {
  id: string
  invoice_code: string
  amount: number
  status: string
  issue_date: string
  due_date: string
  clients?: { company_name: string }
  requests?: { request_code: string }
}

export default function InvoicesPage() {
  const { t, dir } = useLang()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)

  const statusLabel: Record<string, string> = {
    pending:   t('⏳ مستحقة',  '⏳ Pending'),
    paid:      t('✓ مدفوعة',   '✓ Paid'),
    overdue:   t('⚠ متأخرة',   '⚠ Overdue'),
    cancelled: t('ملغاة',      'Cancelled'),
  }
  const statusColor: Record<string, string> = {
    pending: '#d69e2e', paid: '#38a169', overdue: '#e53e3e', cancelled: '#718096',
  }
  const statusBg: Record<string, string> = {
    pending: 'rgba(214,158,46,.1)', paid: 'rgba(56,161,105,.1)',
    overdue: 'rgba(229,62,62,.1)', cancelled: 'rgba(113,128,150,.1)',
  }

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(company_name), requests(request_code)')
      .order('created_at', { ascending: false })
    if (data) setInvoices(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending   = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)
  const totalOverdue   = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0)

  const kpis = [
    {
      icon: '✅', color: '#38a169', bg: 'rgba(56,161,105,.1)',
      value: totalCollected,
      label: t('إجمالي المحصّل (درهم)', 'Total Collected (AED)'),
      note: t('▲ +40,000 هذا الشهر', '▲ +40,000 this month'),
      gradient: 'linear-gradient(90deg,#38a169,#0099cc)',
    },
    {
      icon: '⏳', color: '#d69e2e', bg: 'rgba(214,158,46,.1)',
      value: totalPending,
      label: t('مستحق التحصيل (درهم)', 'Pending Collection (AED)'),
      note: `${invoices.filter(i => i.status === 'pending').length} ${t('فاتورة', 'invoices')}`,
      gradient: 'linear-gradient(90deg,#d69e2e,#dd6b20)',
    },
    {
      icon: '⚠️', color: '#e53e3e', bg: 'rgba(229,62,62,.1)',
      value: totalOverdue,
      label: t('متأخر التحصيل (درهم)', 'Overdue (AED)'),
      note: `${invoices.filter(i => i.status === 'overdue').length} ${t('فاتورة', 'invoices')}`,
      gradient: 'linear-gradient(90deg,#e53e3e,#c53030)',
    },
  ]

  const tableHeaders = [
    t('رقم الفاتورة', 'Invoice #'),
    t('العميل', 'Client'),
    t('رقم الطلب', 'Request #'),
    t('القيمة', 'Amount'),
    t('تاريخ الإصدار', 'Issue Date'),
    t('تاريخ الاستحقاق', 'Due Date'),
    t('الحالة', 'Status'),
    t('إجراءات', 'Actions'),
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="الفواتير" titleEn="Invoices" />

      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a202c' }}>💰 {t('الفواتير', 'Invoices')}</div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
              {invoices.length} {t('فاتورة إجمالاً', 'total invoices')}
            </div>
          </div>
          <button style={{ background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', fontWeight: 700, padding: '9px 18px', borderRadius: '9px', border: 'none', fontSize: '13px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
            ＋ {t('فاتورة جديدة', 'New Invoice')}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{k.icon}</div>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', background: k.bg, color: k.color }}>{k.note}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: k.color, lineHeight: 1, marginBottom: '4px' }}>{k.value.toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>{k.label}</div>
              <div style={{ height: '3px', background: k.gradient, borderRadius: '2px', marginTop: '12px' }}></div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{t('سجل الفواتير', 'Invoices Log')}</span>
            <button style={{ padding: '5px 12px', borderRadius: '7px', border: '1px solid #e2e5ea', background: 'transparent', fontSize: '11px', fontWeight: 700, color: '#4a5568', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
              ⬇ {t('تصدير', 'Export')}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>⏳ {t('جارٍ التحميل...', 'Loading...')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7fafc' }}>
                    {tableHeaders.map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'right', fontSize: '10px', color: '#a0aec0', letterSpacing: '1px', fontFamily: 'IBM Plex Mono,monospace', borderBottom: '2px solid #e2e5ea', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#ebf8ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}
                    >
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', color: '#3182ce', fontSize: '11px' }}>{inv.invoice_code || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{inv.clients?.company_name || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: '#718096' }}>{inv.requests?.request_code || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, color: '#3182ce' }}>{Number(inv.amount).toLocaleString()} {t('د', 'AED')}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: '#718096' }}>{inv.issue_date || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: inv.status === 'pending' ? '#d69e2e' : '#718096' }}>{inv.due_date || '—'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: statusBg[inv.status], color: statusColor[inv.status], fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', border: `1px solid ${statusColor[inv.status]}33`, whiteSpace: 'nowrap' }}>
                          {statusLabel[inv.status]}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {inv.status === 'pending' && (
                            <button style={{ padding: '5px 10px', borderRadius: '7px', border: 'none', background: 'linear-gradient(135deg,#38a169,#2f855a)', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                              {t('تسجيل دفع', 'Record Payment')}
                            </button>
                          )}
                          <button style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #e2e5ea', background: 'transparent', fontSize: '11px', fontWeight: 700, color: '#4a5568', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: '10px 18px', borderTop: '1px solid #e2e5ea', fontSize: '11px', color: '#a0aec0' }}>
            {t('عرض', 'Showing')} {invoices.length} {t('فاتورة', 'invoices')}
          </div>
        </div>
      </div>
    </div>
  )
}