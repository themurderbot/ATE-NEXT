import { supabase } from './supabase.js'

// جلب الشهادات الموجودة
const { data: certs } = await supabase
  .from('certificates')
  .select('id, client_id, property_id, device_serial')
  .limit(3)

console.log('شهادات:', certs?.length)

// إضافة الأجهزة
const devices = certs.map((c, i) => ({
  serial_number: c.device_serial,
  certificate_id: c.id,
  property_id: c.property_id,
  client_id: c.client_id,
  protocol: 'MQTT',
  mqtt_topic: `ate/devices/${c.device_serial}/alert`,
  mqtt_client_id: `ate-device-${i+1}`,
  connection_status: 'offline',
  model: 'ATE-FP-2026',
  manufacturer: 'ATE Systems',
}))

const { data, error } = await supabase
  .from('devices')
  .insert(devices)
  .select()

if (error) console.error('❌', error.message)
else console.log('✅ أجهزة مضافة:', data.length)
data?.forEach(d => console.log(`   ${d.serial_number} → ${d.mqtt_topic}`))