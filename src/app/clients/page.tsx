'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Client = {
  id: string
  company_name: string
  contact_name: string
  phone: string
  email: string
  city: string
  client_type: string
  status: string
  created_at: string
}

export default function ClientsPage() {
  const { t, dir } = useLang()
  const [clients, setClients]           = useState<Client[]>([])
  const [filtered, setFiltered]         = useState<Client[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [filterType, setFilterType]     = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [form, setForm] = useState({
    company_name: '', contact_name: '', phone: '',
    email: '', city: '', client_type: 'commercial', status: 'active',
  })

  const typeLabel: Record<string, string> = {
    residential: t('سكني',   'Residential'),
    commercial:  t('تجاري',  'Commercial'),
    industrial:  t('صناعي',  'Industrial'),
    government:  t('حكومي',  'Government'),
  }
  const typeColor: Record<string, string> = {
    residential: '#3182ce', commercial: '#38a169',
    industrial: '#d69e2e', government: '#805ad5',
  }
  const statusLabel: Record<string, string> = {
    active:   t('نشط',          'Active'),
    inactive: t('غير نشط',      'Inactive'),
    prospect: t('عميل محتمل',   'Prospect'),
  }
  const statusColor: Record<string, string> = {
    active: '#38a169', inactive: '#a0aec0', prospect: '#d69e2e',
  }

  async function loadClients() {
    setLoading(true)
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (!error && data) setClients(data)
    setLoading(false)
  }

  useEffect(() => { loadClients() }, [])

  useEffect(() => {
    let result = clients
    if (search) result = result.filter(c =>
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
    )
    if (filterType !== 'all')   result = result.filter(c => c.client_type === filterType)
    if (filterStatus !== 'all') result = result.filter(c => c.status === filterStatus)
    setFiltered(result)
  }, [clients, search, filterType, filterStatus])

  async function handleSave() {
    if (!form.company_name || !form.phone) return
    setSaving(true)
    const { error } = await supabase.from('clients').insert([form])
    if (!error) {
      setShowModal(false)
      setForm({ company_name: '', contact_name: '', phone: '', email: '', city: '', client_type: 'commercial', status: 'active' })
      loadClients()
    }
    setSaving(false)
  }

  const total    = clients.length
  const active   = clients.filter(c => c.status === 'active').length
  const prospect = clients.filter(c => c.status === 'prospect').length
  const inactive = clients.filter(c => c.status === 'inactive').length

  const kpis = [
    { label: t('إجمالي العملاء', 'Total Clients'), value: total,    color: '#3182ce', icon: '👥', bg: '#ebf8ff' },
    { label: t('عملاء نشطون',   'Active Clients'), value: active,   color: '#38a169', icon: '✅', bg: '#f0fff4' },
    { label: t('عملاء محتملون', 'Prospects'),      value: prospect, color: '#d69e2e', icon: '🎯', bg: '#fffff0' },
    { label: t('غير نشطين',     'Inactive'),       value: inactive, color: '#a0aec0', icon: '💤', bg: '#f7fafc' },
  ]

  const tableHeaders = [
    t('الشركة', 'Company'), t('جهة الاتصال', 'Contact'),
    t('الهاتف', 'Phone'),   t('المدينة', 'City'),
    t('النوع', 'Type'),     t('الحالة', 'Status'),
    t('تاريخ الإضافة', 'Date Added'), '',
  ]

  const modalFields = [
    { label: t('اسم الشركة *', 'Company Name *'), key: 'company_name', placeholder: t('شركة النور للحماية', 'Al-Nour Protection Co.') },
    { label: t('جهة الاتصال', 'Contact Person'),  key: 'contact_name', placeholder: t('محمد العمري', 'Mohammed Al-Omari') },
    { label: t('الهاتف *', 'Phone *'),            key: 'phone',        placeholder: '0512345678' },
    { label: t('البريد الإلكتروني', 'Email'),     key: 'email',        placeholder: 'info@company.com' },
    { label: t('المدينة', 'City'),                key: 'city',         placeholder: t('الرياض', 'Riyadh') },
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="العملاء" titleEn="Clients" />

      <div style={{ padding: '24px' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{k.icon}</div>
                <span style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: k.color }}>{k.value}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#718096' }}>{k.label}</div>
              <div style={{ height: '3px', background: k.color, borderRadius: '2px', marginTop: '10px', opacity: 0.3 }}></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('ابحث عن عميل، رقم هاتف، مدينة...', 'Search client, phone, city...')}
              style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', outline: 'none', background: '#f7f8fc' }}
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '9px 14px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '12px', fontFamily: 'Tajawal, sans-serif', background: '#f7f8fc', outline: 'none' }}>
            <option value="all">{t('كل الأنواع', 'All Types')}</option>
            <option value="commercial">{t('تجاري', 'Commercial')}</option>
            <option value="residential">{t('سكني', 'Residential')}</option>
            <option value="industrial">{t('صناعي', 'Industrial')}</option>
            <option value="government">{t('حكومي', 'Government')}</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '9px 14px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '12px', fontFamily: 'Tajawal, sans-serif', background: '#f7f8fc', outline: 'none' }}>
            <option value="all">{t('كل الحالات', 'All Statuses')}</option>
            <option value="active">{t('نشط', 'Active')}</option>
            <option value="prospect">{t('محتمل', 'Prospect')}</option>
            <option value="inactive">{t('غير نشط', 'Inactive')}</option>
          </select>
          <div style={{ color: '#a0aec0', fontSize: '12px' }}>{filtered.length} {t('عميل', 'clients')}</div>
          <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            ＋ {t('عميل جديد', 'New Client')}
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0', fontSize: '14px' }}>⏳ {t('جارٍ التحميل...', 'Loading...')}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0', fontSize: '14px' }}>{t('لا توجد نتائج', 'No results found')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8fc', borderBottom: '1px solid #e2e5ea' }}>
                  {tableHeaders.map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', color: '#718096', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client, i) => (
                  <tr key={client.id}
                    style={{ borderBottom: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ebf8ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}
                  >
                    <td style={{ padding: '13px 16px' }}><div style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{client.company_name}</div></td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#4a5568' }}>{client.contact_name || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#2d3748' }}>{client.phone || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: '12px', color: '#4a5568' }}>{client.city || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: `${typeColor[client.client_type] || '#718096'}18`, color: typeColor[client.client_type] || '#718096', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', border: `1px solid ${typeColor[client.client_type] || '#718096'}33` }}>
                        {typeLabel[client.client_type] || client.client_type}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{ background: `${statusColor[client.status] || '#a0aec0'}18`, color: statusColor[client.status] || '#a0aec0', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', border: `1px solid ${statusColor[client.status] || '#a0aec0'}33` }}>
                        {statusLabel[client.status] || client.status}
                      </span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '11px', color: '#a0aec0', fontFamily: 'monospace' }}>
                      {new Date(client.created_at).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-GB')}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <a href={`/requests?client=${client.id}`} style={{ fontSize: '11px', color: '#3182ce', fontWeight: 700, textDecoration: 'none', padding: '4px 10px', border: '1px solid #bee3f8', borderRadius: '6px', background: '#ebf8ff' }}>
                        {t('طلباته ←', '→ Requests')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '500px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#1a202c' }}>➕ {t('إضافة عميل جديد', 'Add New Client')}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a0aec0' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {modalFields.map(field => (
                <div key={field.key} style={{ gridColumn: field.key === 'company_name' ? 'span 2' : 'span 1' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: '5px' }}>{field.label}</label>
                  <input value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: '5px' }}>{t('النوع', 'Type')}</label>
                <select value={form.client_type} onChange={e => setForm(f => ({ ...f, client_type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', outline: 'none' }}>
                  <option value="commercial">{t('تجاري', 'Commercial')}</option>
                  <option value="residential">{t('سكني', 'Residential')}</option>
                  <option value="industrial">{t('صناعي', 'Industrial')}</option>
                  <option value="government">{t('حكومي', 'Government')}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: '5px' }}>{t('الحالة', 'Status')}</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'Tajawal, sans-serif', outline: 'none' }}>
                  <option value="active">{t('نشط', 'Active')}</option>
                  <option value="prospect">{t('عميل محتمل', 'Prospect')}</option>
                  <option value="inactive">{t('غير نشط', 'Inactive')}</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', border: '1px solid #e2e5ea', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', opacity: saving ? 0.7 : 1 }}>
                {saving ? t('⏳ جارٍ الحفظ...', '⏳ Saving...') : t('💾 حفظ العميل', '💾 Save Client')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}