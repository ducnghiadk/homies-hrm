import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ncxwnldazjtlgipdsuws.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeHdubGRhemp0bGdpcGRzdXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjE0MzEsImV4cCI6MjA5NTg5NzQzMX0.l60xIsxuczlkrdC4uIk-tM25khgJ5-AtdcWP1eQPo4I'

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('--- Checking cua_hang ---')
  const { data: stores, error: sErr } = await supabase.from('cua_hang').select('id, ten, ma_cua_hang')
  console.log('Stores:', stores, 'Error:', sErr)

  console.log('\n--- Checking ca_lam ---')
  const { data: shifts, error: shErr } = await supabase.from('ca_lam').select('id, ten, ma_ca, gio_bat_dau, gio_ket_thuc')
  console.log('Shifts:', shifts, 'Error:', shErr)

  console.log('\n--- Checking nhan_vien ---')
  const { data: employees, error: eErr } = await supabase.from('nhan_vien').select('id, ma_nhan_vien, ho_ten, so_dien_thoai, cua_hang_id, vai_tro')
  console.log(`Employees count: ${employees?.length}`, employees, 'Error:', eErr)

  console.log('\n--- Checking lich_phan_ca ---')
  const { count, error: lErr } = await supabase.from('lich_phan_ca').select('*', { count: 'exact', head: true })
  console.log(`Lich phan ca count: ${count}`, 'Error:', lErr)

  // Check 1 record of lich_phan_ca to see columns
  const { data: sampleShift } = await supabase.from('lich_phan_ca').select('*').limit(1)
  console.log('Sample lich_phan_ca:', sampleShift)
}

main().catch(console.error)
