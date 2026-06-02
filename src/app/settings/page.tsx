'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type User = {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

const ROLES = ['admin', 'manager', 'operator', 'viewer']

const PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin:    { clients: true,  requests: true,  invoices: true,  payments: true,  certs: true,  reports: true,  schedule: true,  team: true,  settings: true,  delete: true  },
  manager:  { clients: true,  requests: true,  invoices: true,  payments: true,  certs: true,  reports: true,  schedule: true,  team: true,  settings: false, delete: false },
  operator: { clients: true,  requests: true,  invoices: false, payments: false, certs: true,  reports: false, schedule: true,  team: false, settings: false, delete: false },
  viewer:   { clients: false, requests: false, invoices: false, payments: false, certs: false, reports: true,  schedule: false, team: false, settings: false, delete: false },
}

const PERM_LABELS: Record<string, { ar: string; en: string }> = {
  clients:  { ar: 'إدارة العملاء',   en: 'Manage Clients'   },
  requests: { ar: 'إدارة الطلبات',   en: 'Manage Requests'  },
  invoices: { ar: 'إدارة الفواتير',  en: 'Manage Invoices'  },
  payments: { ar: 'إدارة المدفوعات', en: 'Manage Payments'  },
  certs:    { ar: 'إدارة الشهادات',  en: 'Manage Certs'     },
  reports:  { ar: 'عرض التقارير',    en: 'View Reports'     },
  schedule: { ar: 'إدارة الجدولة',   en: 'Manage Schedule'  },
  team:     { ar: 'إدارة الفريق',    en: 'Manage Team'      },
  settings: { ar: 'إعدادات النظام',  en: 'System Settings'  },
  delete:   { ar: 'حذف البيانات',    en: 'Delete Data'      },
}

export default function SettingsPage() {
  const { t, dir } = useLang()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'system' | 'notifications'>('users')
  const [form, setForm] = useState({ email: '', full_name: '', role: 'operator', password: '' })

  const roleLabel: Record<string, string> = {
    admin: t('مدير النظام', 'System Admin'), manager: t('مدير', 'Manager'),
    operator: t('مشغّل', 'Operator'), viewer: t('مشاهد', 'Viewer'),
  }
  const roleColor: Record<string, string> = {
    admin: '#e53e3e', manager: '#3182ce', operator: '#d69e2e', viewer: '#718096',
  }

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }
  useEffect(() => { loadUsers() }, [])

  async function handleSave() {
    if (!form.email || !form.full_name || !form.password) return
    setSaving(true)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email: form.email, password: form.password, email_confirm: true })
    if (!authError && authData.user) {
      await supabase.from('users').insert([{ id: authData.user.id, email: form.email, full_name: form.full_name, role: form.role, is_active: true }])
      setShowModal(false)
      setForm({ email: '', full_name: '', role: 'operator', password: '' })
      loadUsers()
    }
    setSaving(false)
  }

  async function toggleActive(user: User) {
    await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id)
    loadUsers()
  }

  async function changeRole(userId: string, role: string) {
    await supabase.from('users').update({ role }).eq('id', userId)
    loadUsers()
  }

  const tabs = [
    { id: 'users',         label: t('المستخدمون', 'Users'),        icon: '👥' },
    { id: 'permissions',   label: t('الصلاحيات',  'Permissions'),  icon: '🔐' },
    { id: 'system',        label: t('النظام',      'System'),       icon: '⚙️' },
    { id: 'notifications', label: t('الإشعارات',  'Notifications'),icon: '🔔' },
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="الإعدادات" titleEn="Settings" />
      <div style={{ padding: '24px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#fff', padding: '6px', borderRadius: '12px', border: '1px solid #e2e5ea', width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#3182ce' : 'transparent', color: activeTab === tab.id ? '#fff' : '#718096', fontWeight: activeTab === tab.id ? 700 : 400, fontSize: '13px', fontFamily: 'Tajawal, sans-serif', transition: 'all .2s' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#1a202c' }}>👥 {t('إدارة المستخدمين', 'User Management')}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>{users.length} {t('مستخدم', 'users')}</div>
              </div>
              <button onClick={() => setShowModal(true)} style={{ background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', border: 'none', borderRadius: '9px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                ＋ {t('مستخدم جديد', 'New User')}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {ROLES.map(role => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4a5568' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: roleColor[role], display: 'inline-block' }}></span>
                  {roleLabel[role]}
                </div>
              ))}
            </div>
            {loading ? <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>⏳</div>
            : users.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0', background: '#fff', borderRadius: '12px', border: '1px solid #e2e5ea' }}>{t('لا يوجد مستخدمون', 'No users')}</div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                {users.map((user, i) => {
                  const colors = ['#e53e3e','#3182ce','#38a169','#d69e2e','#805ad5','#dd6b20']
                  const ac = colors[i % colors.length]
                  return (
                    <div key={user.id} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', opacity: user.is_active ? 1 : 0.6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `linear-gradient(135deg,${ac},${ac}99)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{user.full_name?.charAt(0) || '?'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#718096', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '10px', color: '#718096', display: 'block', marginBottom: '4px' }}>{t('الصلاحية', 'Role')}</label>
                        <select value={user.role} onChange={e => changeRole(user.id, e.target.value)} style={{ width: '100%', padding: '7px 10px', border: `1px solid ${roleColor[user.role] || '#e2e5ea'}`, borderRadius: '7px', fontSize: '12px', fontFamily: 'Tajawal,sans-serif', outline: 'none', background: `${roleColor[user.role] || '#718096'}10`, color: roleColor[user.role] || '#718096', fontWeight: 700 }}>
                          {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: user.is_active ? '#38a169' : '#a0aec0', fontWeight: 700 }}>{user.is_active ? t('● نشط', '● Active') : t('○ غير نشط', '○ Inactive')}</span>
                        <button onClick={() => toggleActive(user)} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', background: user.is_active ? 'rgba(229,62,62,.1)' : 'rgba(56,161,105,.1)', color: user.is_active ? '#e53e3e' : '#38a169' }}>
                          {user.is_active ? t('تعطيل', 'Disable') : t('تفعيل', 'Enable')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1a202c', marginBottom: '6px' }}>🔐 {t('مصفوفة الصلاحيات', 'Permissions Matrix')}</div>
            <div style={{ fontSize: '12px', color: '#718096', marginBottom: '20px' }}>{t('صلاحيات كل دور في النظام', 'System permissions per role')}</div>
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f7f8fc' }}>
                    <th style={{ padding: '14px 18px', textAlign: 'right', fontSize: '12px', color: '#718096', fontWeight: 600, borderBottom: '2px solid #e2e5ea', width: '35%' }}>{t('الصلاحية', 'Permission')}</th>
                    {ROLES.map(role => (
                      <th key={role} style={{ padding: '14px 18px', textAlign: 'center', fontSize: '12px', fontWeight: 700, borderBottom: '2px solid #e2e5ea', color: roleColor[role] }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: roleColor[role], display: 'inline-block' }}></span>
                          {roleLabel[role]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(PERM_LABELS).map((perm, i) => (
                    <tr key={perm} style={{ borderBottom: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '13px 18px', fontSize: '13px', color: '#1a202c', fontWeight: 500 }}>
                        {dir === 'rtl' ? PERM_LABELS[perm].ar : PERM_LABELS[perm].en}
                      </td>
                      {ROLES.map(role => (
                        <td key={role} style={{ padding: '13px 18px', textAlign: 'center' }}>
                          {PERMISSIONS[role][perm]
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(56,161,105,.15)', color: '#38a169', fontSize: '14px', fontWeight: 700 }}>✓</span>
                            : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(160,174,192,.1)', color: '#cbd5e0', fontSize: '14px' }}>✕</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px', padding: '14px 18px', background: '#ebf8ff', borderRadius: '10px', border: '1px solid #bee3f8', fontSize: '12px', color: '#2b6cb0' }}>
              ℹ️ {t('لتغيير صلاحيات مستخدم، اذهب لتبويب "المستخدمون" وغيّر دوره.', 'To change a user\'s permissions, go to the "Users" tab and change their role.')}
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#1a202c', marginBottom: '20px' }}>⚙️ {t('إعدادات النظام', 'System Settings')}</div>
            {[
              { label: t('اسم الشركة', 'Company Name'),        value: 'ATE Platform',             key: 'company_name' },
              { label: t('رقم الدعم', 'Support Number'),        value: '920XXXXXX',                key: 'support_number' },
              { label: t('البريد الرسمي', 'Official Email'),    value: 'support@ate-platform.com', key: 'email' },
              { label: t('المنطقة الزمنية', 'Timezone'),        value: 'Asia/Dubai (GMT+4)',       key: 'timezone' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: '6px' }}>{field.label}</label>
                <input defaultValue={field.value} style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'Tajawal,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button style={{ background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
              💾 {t('حفظ', 'Save')}
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
            <div style={{ fontSize: '16px', fontWeight: 900, color: '#1a202c', marginBottom: '20px' }}>🔔 {t('إعدادات الإشعارات', 'Notification Settings')}</div>
            {[
              { label: t('إشعارات الحريق',       'Fire Alerts'),        on: true  },
              { label: t('إشعارات الأعطال',      'Fault Alerts'),       on: true  },
              { label: t('انتهاء الشهادات',      'Certificate Expiry'), on: true  },
              { label: t('الفواتير المستحقة',    'Pending Invoices'),   on: false },
              { label: t('تقارير يومية بالبريد', 'Daily Email Reports'),on: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f2f5' }}>
                <span style={{ fontSize: '13px', color: '#1a202c', fontWeight: 500 }}>{item.label}</span>
                <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: item.on ? '#38a169' : '#e2e5ea', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '2px', right: item.on ? '2px' : 'auto', left: item.on ? 'auto' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#1a202c' }}>➕ {t('إضافة مستخدم', 'Add User')}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#a0aec0' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: t('الاسم *', 'Name *'),    key: 'full_name', type: 'text',     placeholder: t('محمد العمري', 'Mohammed') },
                { label: t('البريد *', 'Email *'),  key: 'email',     type: 'email',    placeholder: 'user@ate-platform.com' },
                { label: t('المرور *', 'Password *'),key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: '5px' }}>{field.label}</label>
                  <input type={field.type} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'Tajawal,sans-serif', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#4a5568', display: 'block', marginBottom: '5px' }}>{t('الصلاحية', 'Role')}</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e5ea', borderRadius: '8px', fontSize: '13px', fontFamily: 'Tajawal,sans-serif', outline: 'none' }}>
                  {ROLES.map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', border: '1px solid #e2e5ea', borderRadius: '8px', background: '#fff', fontSize: '13px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>{t('إلغاء', 'Cancel')}</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 24px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal,sans-serif', opacity: saving ? 0.7 : 1 }}>
                {saving ? '⏳' : t('💾 إضافة', '💾 Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}