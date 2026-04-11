'use client'
import { useLang } from '../lib/LangContext'

export default function Topbar({ title, titleEn }: { title: string; titleEn?: string }) {
  const { t, lang } = useLang()

  return (
    <div style={{
      background: '#fff',
      borderBottom: '1px solid #e2e5ea',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,.08)',
    }}>
      <div style={{ fontSize: '15px', fontWeight: 700, flex: 1 }}>
        <span style={{ color: '#a0aec0', fontWeight: 400, fontSize: '12px', marginLeft: '6px' }}>
          ATE CRM /
        </span>
        {titleEn && lang === 'en' ? titleEn : title}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: '#f0f2f5', border: '1px solid #e2e5ea',
        borderRadius: '8px', padding: '7px 12px', width: '220px',
      }}>
        <span style={{ color: '#a0aec0' }}>🔍</span>
        <input
          placeholder={t('بحث — عميل، عقار، شهادة...', 'Search — client, property, cert...')}
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            fontSize: '12px', fontFamily: 'Tajawal,sans-serif',
            color: '#1a202c', width: '100%',
          }}
        />
      </div>

      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: '#f0f2f5', border: '1px solid #e2e5ea',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '15px', position: 'relative',
      }}>
        🔔
        <div style={{
          position: 'absolute', top: '-3px', right: '-3px',
          width: '16px', height: '16px', background: '#e53e3e',
          borderRadius: '50%', fontSize: '9px', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, border: '2px solid #fff',
        }}>3</div>
      </div>

      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg,#e53e3e,#dd6b20)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer',
      }}>م</div>
    </div>
  )
}
