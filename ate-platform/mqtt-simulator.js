import mqtt from 'mqtt'
import { createClient } from '@supabase/supabase-js'

// ══ Supabase ══
const supabase = createClient(
  'https://gjjmscyiewrdqtritsea.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqam1zY3lpZXdyZHF0cml0c2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ1ODEsImV4cCI6MjA5MTMyMDU4MX0.If9a0bXAtuYaM0n08xHGFCKnPVIv86jqzB577C3I4UM'
)

// ══ EMQX Connection ══
const client = mqtt.connect('mqtts://wbed1e72.ala.eu-central-1.emqxsl.com:8883', {
  username: 'ate-device',
  password: 'ATE@2026',
  clientId: 'ate-simulator-001',
  rejectUnauthorized: false,
})

// الأجهزة التجريبية
const devices = [
  { serial: 'FP-2026-A300', property: 'مبنى A', zone: 'Z-01' },
  { serial: 'FP-2026-A301', property: 'مبنى B', zone: 'Z-03' },
  { serial: 'FP-2026-A302', property: 'مبنى C', zone: 'Z-07' },
]

const alertTypes = ['fire', 'smoke', 'fault', 'test', 'offline', 'restore']
const severities = ['low', 'medium', 'high', 'critical']

client.on('connect', () => {
  console.log('✅ متصل بـ EMQX Broker')
  console.log('🚀 بدء إرسال رسائل MQTT...\n')
  startSimulation()
})

client.on('error', (err) => {
  console.error('❌ خطأ في الاتصال:', err.message)
})

async function sendAlert(device, alertType) {
  const payload = {
    serial: device.serial,
    property: device.property,
    zone: device.zone,
    alert_type: alertType,
    severity: alertType === 'fire' ? 'critical' :
              alertType === 'smoke' ? 'high' :
              alertType === 'fault' ? 'medium' : 'low',
    timestamp: new Date().toISOString(),
    battery: Math.floor(Math.random() * 40) + 60, // 60-100%
    signal: Math.floor(Math.random() * 30) + 70,  // 70-100 dBm
  }

  // ① نشر على MQTT
  const topic = `ate/devices/${device.serial}/alert`
  client.publish(topic, JSON.stringify(payload), { qos: 1 })
  console.log(`📡 MQTT → ${topic}`)
  console.log(`   Type: ${alertType} | Zone: ${device.zone} | Device: ${device.serial}`)

  // ② حفظ في Supabase
  const { data: devices_db } = await supabase
    .from('devices')
    .select('id, property_id, client_id')
    .eq('serial_number', device.serial)
    .single()

  if (devices_db) {
    const { error } = await supabase.from('alerts').insert({
      device_id: devices_db.id,
      property_id: devices_db.property_id,
      client_id: devices_db.client_id,
      alert_type: alertType,
      zone_id: device.zone,
      severity: payload.severity,
      source_protocol: 'MQTT',
      raw_message: JSON.stringify(payload),
      mqtt_payload: payload,
    })

    if (error) console.error('   ❌ Supabase error:', error.message)
    else console.log(`   ✅ حُفظ في Supabase\n`)
  } else {
    console.log(`   ⚠️ الجهاز غير موجود في DB — تخطي الحفظ\n`)
  }
}

function startSimulation() {
  let count = 0

  // إرسال كل 5 ثوانٍ
  const interval = setInterval(async () => {
    const device = devices[count % devices.length]
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]

    await sendAlert(device, alertType)
    count++

    // توقف بعد 10 رسائل
    if (count >= 10) {
      clearInterval(interval)
      console.log('\n🎉 الـ Simulation انتهى — 10 رسائل أُرسلت!')
      console.log('📊 تحقق من Supabase → alerts table')
      client.end()
    }
  }, 5000)

  // إرسال أول رسالة فوراً
  sendAlert(devices[0], 'fire')
}