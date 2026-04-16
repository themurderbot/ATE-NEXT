import { supabase } from './supabase.js'

const clients = [
  { company_name: 'شركة النور للحماية', contact_name: 'أحمد السعيد', phone: '0501234567', email: 'client@alnoor.com', client_type: 'commercial', city: 'الرياض', district: 'حي العليا' },
  { company_name: 'فندق الخليج الكبير', contact_name: 'سالم الخليجي', phone: '0507654321', email: 'gm@gulf-hotel.com', client_type: 'commercial', city: 'الرياض', district: 'حي الملك فهد' },
  { company_name: 'مصنع الأمل الصناعي', contact_name: 'خالد الشمري', phone: '0512345678', email: 'factory@alamal.com', client_type: 'industrial', city: 'الرياض', district: 'المنطقة الصناعية' },
  { company_name: 'مجموعة الخليج العقارية', contact_name: 'فهد الخليج', phone: '0509876543', email: 'info@gulf-group.com', client_type: 'commercial', city: 'الرياض', district: 'حي السليمانية' }
]

const { data, error } = await supabase
  .from('clients')
  .insert(clients)
  .select()

if (error) {
  console.error('❌ خطأ:', error.message)
} else {
  console.log('✅ تم إضافة', data.length, 'عملاء')
  console.log(data)
}