import { supabase } from './supabase.js'

// ══════════════════════════════════════════════
// CRM BRIDGE — يُحدِّث HTML بالبيانات الحقيقية
// ══════════════════════════════════════════════

// ── جلب وعرض العملاء ──
export async function loadClientsTable() {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('❌', error.message); return; }

  const tbody = document.getElementById('clients-tbody')
  if (!tbody) return

  tbody.innerHTML = clients.map((c, i) => `
    <tr onclick="openClientDetail('${c.id}')">
      <td style="font-family:var(--fm);color:var(--blue);font-size:11px">${c.client_code || '—'}</td>
      <td>
        <div style="font-weight:700">${c.company_name}</div>
        <div style="font-size:10px;color:var(--text2)">${c.contact_name}</div>
      </td>
      <td style="font-family:var(--fm);font-size:11px">${c.phone}</td>
      <td style="text-align:center;font-weight:700">—</td>
      <td><span class="badge badge-gray">— معلق</span></td>
      <td style="font-family:var(--fm);font-size:10px;color:var(--text3)">${c.created_at?.split('T')[0]}</td>
      <td><span class="badge badge-${c.status === 'active' ? 'green' : 'yellow'}">● ${c.status === 'active' ? 'نشط' : 'معلق'}</span></td>
      <td onclick="event.stopPropagation()" style="display:flex;gap:5px">
        <button class="btn btn-outline btn-sm" onclick="openClientDetail('${c.id}')">عرض</button>
        <button class="btn btn-primary btn-sm" onclick="openModal('modal-new-cert')">شهادة</button>
      </td>
    </tr>
  `).join('')

  // تحديث العداد
  const counter = document.querySelector('.crm-topbar-title span')
  if (counter) counter.textContent = `${clients.length} عميل`
}

// ── جلب وعرض الطلبات ──
export async function loadRequestsTable() {
  const { data: requests, error } = await supabase
    .from('requests')
    .select(`*, clients(company_name, phone)`)
    .order('created_at', { ascending: false })

  if (error) { console.error('❌', error.message); return; }

  const stageColors = {
    new: 'gray', awaiting_payment: 'blue',
    scheduled: 'yellow', installed: 'orange', certified: 'green'
  }
  const stageLabels = {
    new: '① طلب جديد', awaiting_payment: '② بانتظار الدفع',
    scheduled: '③ مجدول للتركيب', installed: '④ تم التركيب',
    certified: '⑤ شهادة صادرة'
  }

  // تحديث عدادات المراحل
  const stages = ['new','awaiting_payment','scheduled','installed','certified']
  stages.forEach(stage => {
    const count = requests.filter(r => r.stage === stage).length
    const el = document.getElementById(`stage-count-${stage}`)
    if (el) el.textContent = count
  })
}

// ── جلب إحصائيات Dashboard ──
export async function loadDashboard() {
  const [
    { count: totalClients },
    { count: pendingRequests },
    { count: pendingDocs },
    { count: scheduledToday }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('stage', 'new'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('schedules').select('*', { count: 'exact', head: true })
      .eq('scheduled_date', new Date().toISOString().split('T')[0])
  ])

  // تحديث KPIs
  const kpis = {
    'kpi-total-clients': totalClients || 0,
    'kpi-pending-requests': pendingRequests || 0,
    'kpi-pending-docs': pendingDocs || 0,
    'kpi-today-visits': scheduledToday || 0
  }

  Object.entries(kpis).forEach(([id, val]) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val
  })
}

// ── إضافة عميل جديد ──
export async function submitNewClient(formData) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      company_name: formData.company_name,
      contact_name: formData.contact_name,
      phone: formData.phone,
      email: formData.email,
      client_type: formData.client_type,
      city: formData.city,
      district: formData.district
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── إضافة طلب جديد ──
export async function submitNewRequest(formData) {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      client_id: formData.client_id,
      property_id: formData.property_id,
      devices_count: formData.devices_count || 1,
      unit_price: 10000,
      notes: formData.notes
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Real-time — استقبال التحديثات لحظياً ──
export function subscribeToAlerts(onAlert) {
  return supabase
    .channel('alerts-channel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'alerts'
    }, payload => {
      console.log('🚨 إنذار جديد:', payload.new)
      onAlert(payload.new)
    })
    .subscribe()
}

export function subscribeToDevices(onUpdate) {
  return supabase
    .channel('devices-channel')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'devices'
    }, payload => {
      onUpdate(payload.new)
    })
    .subscribe()
}