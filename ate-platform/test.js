import { supabase } from './supabase.js'

const { data, error } = await supabase
  .from('clients')
  .select('*')

if (error) {
  console.error('❌ خطأ:', error.message)
} else {
  console.log('✅ العملاء:', data)
}