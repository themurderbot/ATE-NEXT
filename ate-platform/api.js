import { supabase } from './supabase.js'

// ══════════════════════════════
// CLIENTS — العملاء
// ══════════════════════════════

// جلب كل العملاء
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// إضافة عميل جديد
export async function addClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// تحديث عميل
export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// حذف عميل
export async function deleteClient(id) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}

// ══════════════════════════════
// REQUESTS — الطلبات
// ══════════════════════════════

export async function getRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      clients ( company_name, phone ),
      properties ( property_name, district )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function addRequest(request) {
  const { data, error } = await supabase
    .from('requests')
    .insert(request)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateRequestStage(id, stage) {
  const { data, error } = await supabase
    .from('requests')
    .update({ stage })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ══════════════════════════════
// INVOICES — الفواتير
// ══════════════════════════════

export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients ( company_name ),
      requests ( request_code )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function addInvoice(invoice) {
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function markInvoicePaid(id) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'paid' })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ══════════════════════════════
// CERTIFICATES — الشهادات
// ══════════════════════════════

export async function getCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select(`
      *,
      clients ( company_name ),
      properties ( property_name ),
      technicians ( full_name )
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function addCertificate(cert) {
  const { data, error } = await supabase
    .from('certificates')
    .insert(cert)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ══════════════════════════════
// TECHNICIANS — الفنيون
// ══════════════════════════════

export async function getTechnicians() {
  const { data, error } = await supabase
    .from('technicians')
    .select('*')
    .eq('is_active', true)
    .order('full_name')
  
  if (error) throw error
  return data
}

// ══════════════════════════════
// SCHEDULES — الجدولة
// ══════════════════════════════

export async function getSchedules() {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      technicians ( full_name, tech_code ),
      properties ( property_name, district ),
      requests ( request_code )
    `)
    .order('scheduled_date', { ascending: true })
  
  if (error) throw error
  return data
}

export async function addSchedule(schedule) {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ══════════════════════════════
// DOCUMENTS — المستندات
// ══════════════════════════════

export async function getDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      clients ( company_name ),
      properties ( property_name )
    `)
    .order('uploaded_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function updateDocumentStatus(id, status, rejection_reason = null) {
  const { data, error } = await supabase
    .from('documents')
    .update({ 
      status, 
      rejection_reason,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// ══════════════════════════════
// DASHBOARD — إحصائيات
// ══════════════════════════════

export async function getDashboardStats() {
  const [
    { count: totalClients },
    { count: pendingRequests },
    { count: pendingDocs },
    { data: expiringCerts }
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('stage', 'new'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('certificates').select('cert_ref, expiry_date, status')
      .eq('status', 'expiring_soon')
      .limit(5)
  ])

  return {
    totalClients,
    pendingRequests,
    pendingDocs,
    expiringCerts
  }
}