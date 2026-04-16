import { supabase } from './supabase.js'

// جلب البيانات الموجودة
const { data: clients } = await supabase.from('clients').select('id, company_name').limit(4)
const { data: properties } = await supabase.from('properties').select('id, property_name, client_id').limit(4)
const { data: requests } = await supabase.from('requests').select('id, client_id, property_id').limit(4)

console.log('✅ clients:', clients?.length)
console.log('✅ properties:', properties?.length)
console.log('✅ requests:', requests?.length)

// جلب الفنيين الموجودين
const { data: techs, error: techErr } = await supabase
  .from('technicians')
  .select('id, full_name')
  .limit(3)

if (techErr) console.error('❌ فنيون:', techErr.message)
else console.log('✅ فنيون:', techs.length)

// إضافة شهادات
const today = new Date()
const nextYear = new Date(today)
nextYear.setFullYear(nextYear.getFullYear() + 1)

const certs = requests?.slice(0,3).map((r, i) => ({
  request_id: r.id,
  client_id: r.client_id,
  property_id: r.property_id,
  device_serial: `FP-2026-A${300 + i}`,
  cert_type: 'installation',
  install_date: today.toISOString().split('T')[0],
  issue_date: today.toISOString().split('T')[0],
  expiry_date: nextYear.toISOString().split('T')[0],
  technician_id: techs?.[i % techs.length]?.id,
  status: i === 0 ? 'expiring_soon' : 'active'
}))

const { data: certsData, error: certErr } = await supabase
  .from('certificates')
  .insert(certs)
  .select()

if (certErr) console.error('❌ شهادات:', certErr.message)
else console.log('✅ شهادات:', certsData.length)

// إضافة جدولة
const { data: schedules, error: schErr } = await supabase
  .from('schedules')
  .insert([
    { request_id: requests[0].id, property_id: requests[0].property_id, technician_id: techs[0].id, visit_type: 'installation', scheduled_date: '2026-04-15', scheduled_time: '09:00', status: 'scheduled' },
    { request_id: requests[1].id, property_id: requests[1].property_id, technician_id: techs[1].id, visit_type: 'installation', scheduled_date: '2026-04-16', scheduled_time: '11:00', status: 'scheduled' },
    { request_id: requests[2].id, property_id: requests[2].property_id, technician_id: techs[2].id, visit_type: 'maintenance', scheduled_date: '2026-04-17', scheduled_time: '14:00', status: 'scheduled' },
  ])
  .select()

if (schErr) console.error('❌ جدولة:', schErr.message)
else console.log('✅ جدولة:', schedules.length)

console.log('\n🎉 كل البيانات جاهزة!')