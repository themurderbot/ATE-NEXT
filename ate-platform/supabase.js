import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gjjmscyiewrdqtritsea.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqam1zY3lpZXdyZHF0cml0c2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDQ1ODEsImV4cCI6MjA5MTMyMDU4MX0.If9a0bXAtuYaM0n08xHGFCKnPVIv86jqzB577C3I4UM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)