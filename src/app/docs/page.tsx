import Topbar from '../components/Topbar'

export default function DocsPage() {
  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="المستندات" />
      <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#4a5568' }}>المستندات</div>
        <div style={{ fontSize: '13px', marginTop: '8px' }}>قريباً — رفع وإدارة المستندات</div>
      </div>
    </div>
  )
}