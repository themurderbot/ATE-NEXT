'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Tech = {
  id: string
  full_name: string
  tech_code: string
  level: number
  phone: string
  email: string
  join_date: string
  is_active: boolean
}

const avatarColors = [
  'linear-gradient(135deg,#3182ce,#0099cc)',
  'linear-gradient(135deg,#d69e2e,#dd6b20)',
  'linear-gradient(135deg,#38a169,#0099cc)',
  'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  'linear-gradient(135deg,#e53e3e,#dd6b20)',
]

export default function TeamPage() {
  const { t, dir } = useLang()
  const [techs, setTechs]     = useState<Tech[]>([])
  const [loading, setLoading] = useState(true)

  const levelColors: Record<number, string> = {
    1: '#718096', 2: '#3182ce', 3: '#38a169',
  }

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('technicians')
      .select('*')
      .eq('is_active', true)
      .order('full_name')
    if (data) setTechs(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const kpis = [
    { label: t('فنيون نشطون', 'Active Technicians'), value: techs.length,                         color: '#38a169', gradient: 'linear-gradient(90deg,#38a169,#0099cc)', icon: '👷' },
    { label: t('Level 3 — خبير', 'Level 3 — Expert'), value: techs.filter(t => t.level === 3).length, color: '#38a169', gradient: 'linear-gradient(90deg,#38a169,#2f855a)', icon: '⭐' },
    { label: t('Level 2 — متقدم', 'Level 2 — Advanced'), value: techs.filter(t => t.level === 2).length, color: '#3182ce', gradient: 'linear-gradient(90deg,#3182ce,#2b6cb0)', icon: '🔧' },
    { label: t('Level 1 — مبتدئ', 'Level 1 — Junior'), value: techs.filter(t => t.level === 1).length, color: '#718096', gradient: 'linear-gradient(90deg,#718096,#4a5568)', icon: '🔨' },
  ]

  const tableHeaders = [
    t('الفني', 'Technician'),
    t('المعرّف', 'Code'),
    t('المستوى', 'Level'),
    t('الهاتف', 'Phone'),
    t('البريد', 'Email'),
    t('تاريخ الانضمام', 'Join Date'),
    t('الحالة', 'Status'),
  ]

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="فريق الفنيين" titleEn="Technicians" />

      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a202c' }}>
              👷 {t('إدارة فريق الفنيين', 'Technician Team Management')}
            </div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
              {techs.length} {t('فنيون نشطون', 'active technicians')}
            </div>
          </div>
          <button style={{ background: 'linear-gradient(135deg,#3182ce,#2b6cb0)', color: '#fff', fontWeight: 700, padding: '9px 18px', borderRadius: '9px', border: 'none', fontSize: '13px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
            ＋ {t('فني جديد', 'New Technician')}
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
              <div style={{ fontSize: '20px', marginBottom: '10px' }}>{k.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: k.color, lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>{k.label}</div>
              <div style={{ height: '3px', background: k.gradient, borderRadius: '2px', marginTop: '12px' }}></div>
            </div>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>⏳ {t('جارٍ التحميل...', 'Loading...')}</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
              {techs.map((tech, i) => (
                <div key={tech.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', transition: 'all .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {tech.full_name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: 'rgba(56,161,105,.1)', color: '#38a169', border: '1px solid rgba(56,161,105,.2)' }}>
                      ● {t('نشط', 'Active')}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a202c', marginBottom: '2px' }}>{tech.full_name}</div>
                  <div style={{ fontSize: '10px', color: '#a0aec0', fontFamily: 'IBM Plex Mono,monospace', marginBottom: '12px' }}>
                    {tech.tech_code} · Level {tech.level}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#718096' }}>{t('المستوى', 'Level')}</span>
                      <span style={{ fontWeight: 700, color: levelColors[tech.level] || '#718096' }}>Level {tech.level}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#718096' }}>{t('الهاتف', 'Phone')}</span>
                      <span style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px' }}>{tech.phone}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#718096' }}>{t('تاريخ الانضمام', 'Joined')}</span>
                      <span style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px' }}>{tech.join_date || '—'}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f2f5' }}>
                    <div style={{ height: '5px', borderRadius: '3px', background: '#f0f2f5', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '3px', background: avatarColors[i % avatarColors.length], width: `${(tech.level / 3) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e5ea' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>📋 {t('سجل الفريق الكامل', 'Full Team Register')}</span>
              </div>
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
                    {techs.map((tech, i) => (
                      <tr key={tech.id} style={{ borderBottom: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#ebf8ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc')}
                      >
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: avatarColors[i % avatarColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {tech.full_name.charAt(0)}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{tech.full_name}</div>
                          </div>
                        </td>
                        <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', color: '#3182ce', fontSize: '10px' }}>{tech.tech_code}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            background: tech.level === 3 ? 'rgba(56,161,105,.1)' : tech.level === 2 ? 'rgba(49,130,206,.1)' : 'rgba(113,128,150,.1)',
                            color: tech.level === 3 ? '#276749' : tech.level === 2 ? '#2b6cb0' : '#4a5568',
                            fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px',
                            border: `1px solid ${tech.level === 3 ? 'rgba(56,161,105,.2)' : tech.level === 2 ? 'rgba(49,130,206,.2)' : 'rgba(113,128,150,.2)'}`,
                          }}>Level {tech.level}</span>
                        </td>
                        <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '11px', color: '#4a5568' }}>{tech.phone}</td>
                        <td style={{ padding: '11px 14px', fontSize: '11px', color: '#718096' }}>{tech.email || '—'}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'IBM Plex Mono,monospace', fontSize: '10px', color: '#a0aec0' }}>{tech.join_date || '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ background: 'rgba(56,161,105,.1)', color: '#38a169', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', border: '1px solid rgba(56,161,105,.2)' }}>
                            ● {t('نشط', 'Active')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}