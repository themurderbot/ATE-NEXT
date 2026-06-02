'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import { useLang } from '../lib/LangContext'

type Property = {
  id: string
  property_name: string
  address: string
  district: string
  city: string
  property_type: string
  status: string
  latitude: number | null
  longitude: number | null
  client_id: string
  clients?: { company_name: string }
}

export default function MapPage() {
  const { t, dir } = useLang()
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected]     = useState<Property | null>(null)
  const [loading, setLoading]       = useState(true)
  const [mapLoaded, setMapLoaded]   = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [coords, setCoords]         = useState({ lat: '', lng: '' })
  const [saving, setSaving]         = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('properties')
      .select('*, clients(company_name)')
      .order('created_at', { ascending: false })
    if (data) setProperties(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).L) { setMapLoaded(true); return }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Init map
  useEffect(() => {
    if (!mapLoaded || loading) return
    const L = (window as any).L
    const existingMap = (window as any)._ateMap
    if (existingMap) { existingMap.remove(); (window as any)._ateMap = null }

    const map = L.map('map-container').setView([24.7136, 46.6753], 10)
    ;(window as any)._ateMap = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    const withCoords = properties.filter(p => p.latitude && p.longitude)

    if (withCoords.length > 0) {
      const bounds: [number, number][] = []
      withCoords.forEach(p => {
        const color = p.status === 'active' ? '#38a169' : p.status === 'inactive' ? '#e53e3e' : '#d69e2e'
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:14px;height:14px;border-radius:50%;
            background:${color};border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,.3);
            cursor:pointer;
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
        const marker = L.marker([p.latitude, p.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:Tajawal,sans-serif;direction:rtl;min-width:160px">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">${p.property_name}</div>
              <div style="font-size:11px;color:#718096">${p.clients?.company_name || '—'}</div>
              <div style="font-size:11px;color:#718096;margin-top:2px">${p.address || '—'}</div>
            </div>
          `)
          .on('click', () => setSelected(p))
        bounds.push([p.latitude!, p.longitude!])
      })
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] })
    }

    // Click to add coords
    map.on('click', (e: any) => {
      if (editingId) {
        setCoords({ lat: e.latlng.lat.toFixed(6), lng: e.latlng.lng.toFixed(6) })
      }
    })

    return () => { map.remove(); (window as any)._ateMap = null }
  }, [mapLoaded, loading, properties])

  async function saveCoords(id: string) {
    if (!coords.lat || !coords.lng) return
    setSaving(true)
    await supabase.from('properties').update({
      latitude: parseFloat(coords.lat),
      longitude: parseFloat(coords.lng),
    }).eq('id', id)
    setEditingId(null)
    setCoords({ lat: '', lng: '' })
    load()
    setSaving(false)
  }

  const withCoords    = properties.filter(p => p.latitude && p.longitude)
  const withoutCoords = properties.filter(p => !p.latitude || !p.longitude)

  return (
    <div dir={dir} style={{ fontFamily: 'Tajawal, Arial, sans-serif', minHeight: '100vh', background: '#f7f8fc' }}>
      <Topbar title="خريطة العقارات" titleEn="Properties Map" />

      <div style={{ padding: '24px' }}>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: t('إجمالي العقارات', 'Total Properties'), value: properties.length, color: '#3182ce', icon: '🏢' },
            { label: t('مع إحداثيات',     'With Coordinates'),  value: withCoords.length,    color: '#38a169', icon: '📍' },
            { label: t('بدون إحداثيات',   'Missing Location'),  value: withoutCoords.length, color: '#d69e2e', icon: '⚠️' },
          ].map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Rajdhani,sans-serif', color: k.color }}>{k.value}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>{k.label}</div>
              </div>
              <div style={{ fontSize: '28px' }}>{k.icon}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>

          {/* Map */}
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #e2e5ea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px' }}>🗺️ {t('الخريطة التفاعلية', 'Interactive Map')}</span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#718096' }}>
                <span>🟢 {t('نشط', 'Active')}</span>
                <span>🔴 {t('غير نشط', 'Inactive')}</span>
                <span>🟡 {t('محتمل', 'Prospect')}</span>
              </div>
            </div>
            {loading ? (
              <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
                ⏳ {t('جارٍ التحميل...', 'Loading...')}
              </div>
            ) : (
              <div id="map-container" style={{ height: '500px', width: '100%' }} />
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Selected Property */}
            {selected && (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '2px solid #3182ce' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1a202c', marginBottom: '8px' }}>📍 {selected.property_name}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>{selected.clients?.company_name}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>{selected.address}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '12px' }}>{selected.city}</div>
                {selected.latitude && (
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#a0aec0' }}>
                    {selected.latitude.toFixed(4)}, {selected.longitude?.toFixed(4)}
                  </div>
                )}
                <button onClick={() => setSelected(null)} style={{ marginTop: '10px', padding: '5px 12px', border: '1px solid #e2e5ea', borderRadius: '6px', background: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                  ✕ {t('إغلاق', 'Close')}
                </button>
              </div>
            )}

            {/* Properties without coords */}
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,.08)', border: '1px solid #e2e5ea', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e5ea', fontWeight: 700, fontSize: '12px', color: '#1a202c' }}>
                ⚠️ {t('عقارات بدون موقع', 'Properties Missing Location')} ({withoutCoords.length})
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {withoutCoords.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#38a169', fontSize: '12px' }}>
                    ✅ {t('كل العقارات لها إحداثيات', 'All properties have coordinates')}
                  </div>
                ) : withoutCoords.map(p => (
                  <div key={p.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f0f2f5' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: '#1a202c', marginBottom: '2px' }}>{p.property_name}</div>
                    <div style={{ fontSize: '11px', color: '#718096', marginBottom: '6px' }}>{p.clients?.company_name}</div>

                    {editingId === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '10px', color: '#3182ce' }}>
                          {t('اضغط على الخريطة لتحديد الموقع أو أدخل يدوياً:', 'Click on map to select location or enter manually:')}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input value={coords.lat} onChange={e => setCoords(c => ({ ...c, lat: e.target.value }))}
                            placeholder="Lat" style={{ flex: 1, padding: '4px 6px', border: '1px solid #e2e5ea', borderRadius: '5px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }} />
                          <input value={coords.lng} onChange={e => setCoords(c => ({ ...c, lng: e.target.value }))}
                            placeholder="Lng" style={{ flex: 1, padding: '4px 6px', border: '1px solid #e2e5ea', borderRadius: '5px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => saveCoords(p.id)} disabled={saving} style={{ flex: 1, padding: '5px', border: 'none', borderRadius: '5px', background: '#38a169', color: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                            {saving ? '⏳' : t('حفظ', 'Save')}
                          </button>
                          <button onClick={() => { setEditingId(null); setCoords({ lat: '', lng: '' }) }} style={{ flex: 1, padding: '5px', border: '1px solid #e2e5ea', borderRadius: '5px', background: '#fff', fontSize: '11px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif' }}>
                            {t('إلغاء', 'Cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(p.id); setCoords({ lat: '', lng: '' }) }} style={{ padding: '4px 10px', border: '1px solid #bee3f8', borderRadius: '5px', background: '#ebf8ff', color: '#3182ce', fontSize: '11px', cursor: 'pointer', fontFamily: 'Tajawal,sans-serif', fontWeight: 700 }}>
                        📍 {t('إضافة موقع', 'Add Location')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}