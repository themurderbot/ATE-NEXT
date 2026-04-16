// ═══════════════════════════════════════════════════════
// SIA DC-09 Receiver — ATE Platform
// يستقبل رسائل SIA DC-09 من لوحات الإنذار عبر TCP
// ويحفظها في Supabase → تظهر في ate-system.html
// ═══════════════════════════════════════════════════════

import net from 'net'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = 'https://gjjmscyiewrdqtritsea.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqam1zY3lpZXdyZHF0cml0c2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ1ODEsImV4cCI6MjA5MTMyMDU4MX0.If9a0bXAtuYaM0n08xHGFCKnPVIv86jqzB577C3I4UM'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const PORT = process.env.SIA_PORT || 9999

// ═══ SIA DC-09 Event Codes ═══
const SIA_EVENTS = {
  // Fire
  'FA': { type: 'fire',    severity: 'high',   label: 'Fire Alarm' },
  'FR': { type: 'restore', severity: 'low',    label: 'Fire Restore' },
  'FT': { type: 'test',    severity: 'low',    label: 'Fire Test' },
  // Smoke
  'SA': { type: 'smoke',   severity: 'high',   label: 'Smoke Alarm' },
  'SR': { type: 'restore', severity: 'low',    label: 'Smoke Restore' },
  // Fault
  'TA': { type: 'fault',   severity: 'medium', label: 'Tamper Alarm' },
  'TR': { type: 'restore', severity: 'low',    label: 'Tamper Restore' },
  'YT': { type: 'fault',   severity: 'medium', label: 'Communication Fault' },
  'YR': { type: 'restore', severity: 'low',    label: 'Communication Restore' },
  // Power
  'AT': { type: 'fault',   severity: 'medium', label: 'AC Power Failure' },
  'AR': { type: 'restore', severity: 'low',    label: 'AC Power Restore' },
  'BT': { type: 'fault',   severity: 'medium', label: 'Battery Trouble' },
  'BR': { type: 'restore', severity: 'low',    label: 'Battery Restore' },
  // System
  'OP': { type: 'test',    severity: 'low',    label: 'Opening' },
  'CL': { type: 'restore', severity: 'low',    label: 'Closing' },
  'RP': { type: 'test',    severity: 'low',    label: 'Automatic Test' },
}

// ═══ Parse SIA DC-09 Message ═══
// Format: [LEN][SEQ][ID]["SIA-DCS"[EVENT][ACCOUNT][ZONE]]
function parseSIAMessage(raw) {
  try {
    const str = raw.toString('ascii')
    console.log(`📨 Raw SIA: ${str.trim()}`)

    // Extract content between quotes or parse raw
    const match = str.match(/"([^"]+)"/)
    const content = match ? match[1] : str

    // Try to extract event code, account, zone
    // SIA format: #account|Nri[zone]event/
    const siaMatch = content.match(/([A-Z]{2})\s*(\d+)\s*L(\d+)/) ||
                     content.match(/#(\w+)\|N\w+\[(\d+)\]([A-Z]{2})/)

    let eventCode = 'FA'
    let account   = 'UNKNOWN'
    let zone      = '01'

    if (siaMatch) {
      if (content.includes('#')) {
        account   = siaMatch[1]
        zone      = siaMatch[2]
        eventCode = siaMatch[3]
      } else {
        eventCode = siaMatch[1]
        account   = siaMatch[2]
        zone      = siaMatch[3]
      }
    } else {
      // Try simpler parse
      const codes = Object.keys(SIA_EVENTS)
      for (const code of codes) {
        if (content.includes(code)) {
          eventCode = code
          break
        }
      }
      // Extract numbers for account/zone
      const nums = content.match(/\d+/g)
      if (nums && nums.length >= 1) account = nums[0]
      if (nums && nums.length >= 2) zone    = nums[1]
    }

    const event = SIA_EVENTS[eventCode] || { type: 'fault', severity: 'medium', label: eventCode }

    return {
      protocol:   'SIA DC-09',
      event_code: eventCode,
      alert_type: event.type,
      severity:   event.severity,
      label:      event.label,
      account_id: account,
      zone_id:    `Z-${zone.padStart(2, '0')}`,
      device_id:  `SIA-${account}`,
      raw_message: str.trim(),
    }
  } catch (err) {
    console.error('❌ Parse error:', err.message)
    return null
  }
}

// ═══ Build ACK Response ═══
function buildACK(seq) {
  // SIA DC-09 ACK format
  return `\x06${seq || '0000'}\r\n`
}

// ═══ Save to Supabase ═══
async function saveAlert(parsed, remoteAddr) {
  try {
    const { data, error } = await supabase.from('alerts').insert([{
      alert_type:  parsed.alert_type,
      severity:    parsed.severity,
      protocol:    parsed.protocol,
      device_id:   parsed.device_id,
      zone_id:     parsed.zone_id,
      raw_payload: { raw: parsed.raw_message, event_code: parsed.event_code, account: parsed.account_id },
      source_ip:   remoteAddr,
      created_at:  new Date().toISOString(),
    }])

    if (error) {
      console.error('❌ Supabase error:', error.message)
    } else {
      console.log(`✅ Alert saved → ${parsed.alert_type.toUpperCase()} | Zone: ${parsed.zone_id} | Account: ${parsed.account_id}`)
    }
  } catch (err) {
    console.error('❌ Save error:', err.message)
  }
}

// ═══ TCP Server ═══
const server = net.createServer((socket) => {
  const remoteAddr = `${socket.remoteAddress}:${socket.remotePort}`
  console.log(`🔌 New connection from ${remoteAddr}`)

  let buffer = Buffer.alloc(0)

  socket.on('data', async (data) => {
    buffer = Buffer.concat([buffer, data])

    // Process complete messages (ended with \r\n or \n)
    while (buffer.includes('\n')) {
      const idx = buffer.indexOf('\n')
      const msg = buffer.slice(0, idx + 1)
      buffer    = buffer.slice(idx + 1)

      const msgStr = msg.toString().trim()
      if (!msgStr || msgStr === '\x06') continue // Skip ACKs

      // Parse
      const parsed = parseSIAMessage(msg)
      if (!parsed) continue

      console.log(`📡 SIA Event: ${parsed.event_code} | Type: ${parsed.alert_type} | Zone: ${parsed.zone_id}`)

      // Send ACK
      const ack = buildACK('0001')
      socket.write(ack)
      console.log(`📤 ACK sent`)

      // Save to Supabase
      await saveAlert(parsed, remoteAddr)
    }
  })

  socket.on('error', (err) => {
    console.error(`❌ Socket error (${remoteAddr}):`, err.message)
  })

  socket.on('close', () => {
    console.log(`🔌 Disconnected: ${remoteAddr}`)
  })

  socket.setTimeout(60000)
  socket.on('timeout', () => {
    console.log(`⏱ Timeout: ${remoteAddr}`)
    socket.destroy()
  })
})

server.on('error', (err) => {
  console.error('❌ Server error:', err.message)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════╗
║       ATE — SIA DC-09 Receiver           ║
║       نظام استقبال إنذارات SIA           ║
╠══════════════════════════════════════════╣
║  Port    : ${PORT}                           ║
║  Protocol: SIA DC-09 (TCP)               ║
║  DB      : Supabase → alerts table       ║
╚══════════════════════════════════════════╝
  `)
})

// ═══ Simulator — اختبار الاستقبال ═══
// شغّل: node sia-receiver.js --test
if (process.argv.includes('--test')) {
  setTimeout(() => {
    console.log('\n🧪 Running test simulation...')
    const client = net.createConnection({ port: PORT, host: '127.0.0.1' }, () => {
      const testMessages = [
        '"SIA-DCS"0001L01FA0001\r\n',  // Fire Alarm Zone 1
        '"SIA-DCS"0002L02SA0002\r\n',  // Smoke Alarm Zone 2
        '"SIA-DCS"0003L03AT0001\r\n',  // AC Failure
        '"SIA-DCS"0004L01FR0001\r\n',  // Fire Restore
      ]
      let i = 0
      const send = () => {
        if (i >= testMessages.length) { client.destroy(); return }
        console.log(`\n🚀 Test ${i+1}: ${testMessages[i].trim()}`)
        client.write(testMessages[i])
        i++
        setTimeout(send, 1500)
      }
      send()
    })
    client.on('data', d => console.log(`📥 ACK: ${d.toString().trim()}`))
    client.on('error', e => console.error('Test error:', e.message))
  }, 1000)
}