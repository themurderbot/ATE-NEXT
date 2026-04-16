import { supabase } from './supabase.js'

// أولاً — جلب IDs العملاء الموجودين
const { data: clients } = await supabase
  .from('clients')
  .select('id, company_name')
  .limit(4)

console.log('العملاء:', clients.map(c => c.company_name))

// إضافة عقارات لكل عميل
const properties = clients.map((c, i) => ({
  client_id: c.id,
  property_name: `مبنى ${['A','B','C','D'][i]}`,
  property_type: 'commercial',
  city: 'الرياض',
  district: ['حي العليا','حي الملك فهد','حي السليمانية','المنطقة الصناعية'][i],
  floors: [8, 10, 5, 3][i]
}))

const { data: props, error: propErr } = await supabase
  .from('properties')
  .insert(properties)
  .select()

if (propErr) { console.error('❌ عقارات:', propErr.message); process.exit(1) }
console.log('✅ تم إضافة', props.length, 'عقار')

// إضافة طلبات
const requests = [
  { client_id: clients[0].id, property_id: props[0].id, stage: 'new', devices_count: 1, unit_price: 10000 },
  { client_id: clients[1].id, property_id: props[1].id, stage: 'awaiting_payment', devices_count: 1, unit_price: 10000 },
  { client_id: clients[2].id, property_id: props[2].id, stage: 'scheduled', devices_count: 1, unit_price: 10000 },
  { client_id: clients[3].id, property_id: props[3].id, stage: 'installed', devices_count: 1, unit_price: 10000 },
  { client_id: clients[0].id, property_id: props[0].id, stage: 'certified', devices_count: 1, unit_price: 10000 },
]

const { data: reqs, error: reqErr } = await supabase
  .from('requests')
  .insert(requests)
  .select()

if (reqErr) { console.error('❌ طلبات:', reqErr.message); process.exit(1) }
console.log('✅ تم إضافة', reqs.length, 'طلب')

// إضافة فواتير
const invoices = reqs.slice(0,4).map((r, i) => ({
  request_id: r.id,
  client_id: r.client_id,
  amount: 10000,
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
  status: ['pending','pending','paid','paid'][i]
}))

const { data: invs, error: invErr } = await supabase
  .from('invoices')
  .insert(invoices)
  .select()

if (invErr) { console.error('❌ فواتير:', invErr.message); process.exit(1) }
console.log('✅ تم إضافة', invs.length, 'فاتورة')

console.log('\n🎉 البيانات التجريبية جاهزة!')