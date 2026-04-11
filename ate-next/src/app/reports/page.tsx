import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'

export default async function ReportsPage() {
  const [
    { count: totalClients },
    { count: totalRequests },
    { count: certifiedRequests },
    { data: invoices },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('stage', 'certified'),
    supabase.from('invoices').select('amount, status'),
    supabase.from('requests')
      .select('stage, total_amount, created_at, clients(company_name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalRevenue  = (invoices || []).filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const pendingRevenue = (invoices || []).filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)
  const conversionRate = totalRequests ? Math.round(((certifiedRequests || 0) / totalRequests) * 100) : 0

  const stageData = [
    { label: 'طلب جديد',       stage: 'new',              color: '#718096' },
    { label: 'بانتظار الدفع',  stage: 'awaiting_payment', color: '#3182ce' },
    { label: 'مجدول',          stage: 'scheduled',         color: '#d69e2e' },
    { label: 'تم التركيب',     stage: 'installed',         color: '#dd6b20' },
    { label: 'شهادة صادرة',    stage: 'certified',         color: '#38a169' },
  ]

  const stageCountMap: Record<string, number> = {}
  ;(recentRequests || []).forEach(r => {
    stageCountMap[r.stage] = (stageCountMap[r.stage] || 0) + 1
  })

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="التقارير" titleEn="Reports" />
      <div style={{ padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#1a202c' }}>📈 التقارير والإحصائيات</div>
            <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>نظرة شاملة على أداء المنصة</div>
          </div>
          <button style={{ padding: '9px 18px', border: '1px solid #e2e5ea', borderRadius: '9px', background: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#4a5568', fontFamily: 'Tajawal,sans-serif' }}>
            ⬇ تصدير PDF
          </button>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'إجمالي العملاء',   value: totalClients || 0,    color: '#3182ce', icon: '👥', suffix: '' },
            { label: 'إجمالي الطلبات',   value: totalRequests || 0,   color: '#805ad5', icon: '📋', suffix: '' },
            { label: 'الإيرادات المحصّلة', value: totalRevenue,        color: '#38a169', icon: '💰', suffix: ' د' },
            { label: 'معدل الإنجاز',     value: conversionRate,       color: '#d69e2e', icon: '🎯', suffix: '%' },
          ].map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{k.icon}</div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: k.color, lineHeight: 1, marginBottom: '4px' }}>
                {typeof k.value === 'number' && k.suffix === ' د' ? k.value.toLocaleString() : k.value}{k.suffix}
              </div>
              <div style={{ fontSize: '12px', color: '#718096' }}>{k.label}</div>
              <div style={{ height: '3px', background: k.color, borderRadius: '2px', marginTop: '12px', opacity: .3 }}></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Pipeline Distribution */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a202c', marginBottom: '16px' }}>🔄 توزيع الطلبات حسب المرحلة</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stageData.map(s => {
                const count = stageCountMap[s.stage] || 0
                const max   = Math.max(...Object.values(stageCountMap), 1)
                const pct   = Math.round((count / max) * 100)
                return (
                  <div key={s.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                      <span style={{ color: '#4a5568' }}>{s.label}</span>
                      <span style={{ fontWeight: 700, color: s.color }}>{count}</span>
                    </div>
                    <div style={{ height: '8px', background: '#f0f2f5', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: '4px', transition: 'width .5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Revenue Summary */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a202c', marginBottom: '16px' }}>💰 ملخص الإيرادات</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'محصّل',       value: totalRevenue,   color: '#38a169', icon: '✅' },
                { label: 'مستحق',       value: pendingRevenue, color: '#d69e2e', icon: '⏳' },
                { label: 'الإجمالي',    value: totalRevenue + pendingRevenue, color: '#3182ce', icon: '📊' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: `${r.color}08`, borderRadius: '9px', border: `1px solid ${r.color}22` }}>
                  <span style={{ fontSize: '13px', color: '#4a5568' }}>{r.icon} {r.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: r.color }}>{r.value.toLocaleString()} د</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e5ea', fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>
            📋 آخر الطلبات
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7f8fc' }}>
                {['العميل', 'التاريخ', 'القيمة', 'المرحلة'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: '10px', color: '#a0aec0', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentRequests || []).map((r: any, i: number) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f0f2f5', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 700, fontSize: '13px', color: '#1a202c' }}>{r.clients?.company_name || '—'}</td>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: '11px', color: '#718096' }}>{r.created_at?.slice(0, 10)}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: '#3182ce', fontFamily: 'Rajdhani,sans-serif' }}>{Number(r.total_amount || 0).toLocaleString()} د</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '20px', background: '#f0f2f5', color: '#4a5568' }}>{r.stage}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}