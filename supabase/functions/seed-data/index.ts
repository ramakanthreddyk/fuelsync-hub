
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if data already exists
    const { data: existingUsers } = await supabase.from('users').select('id').limit(1)
    if (existingUsers && existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'Data already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting data seeding...')

    // 1. Create plans
    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .insert([
        {
          name: 'Free',
          price_monthly: 0,
          max_pumps: 2,
          max_nozzles: 4,
          max_employees: 2,
          max_ocr_monthly: 10,
          allow_manual_entry: true,
          edit_fuel_type: false,
          export_reports: false,
          features: { basic_reports: true },
          is_active: true
        },
        {
          name: 'Basic',
          price_monthly: 999,
          max_pumps: 5,
          max_nozzles: 10,
          max_employees: 5,
          max_ocr_monthly: 50,
          allow_manual_entry: true,
          edit_fuel_type: true,
          export_reports: true,
          features: { basic_reports: true, analytics: true },
          is_active: true
        },
        {
          name: 'Premium',
          price_monthly: 2999,
          max_pumps: 20,
          max_nozzles: 50,
          max_employees: 20,
          max_ocr_monthly: 200,
          allow_manual_entry: true,
          edit_fuel_type: true,
          export_reports: true,
          features: { basic_reports: true, analytics: true, advanced_reports: true },
          is_active: true
        }
      ])
      .select()

    if (plansError) throw plansError
    console.log('Plans created:', plansData.length)

    // 2. Create super admin
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert([{
        name: 'Super Admin',
        email: 'admin@fuelsync.com',
        phone: '+91-9999999999',
        password: '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', // admin123
        role: 'superadmin',
        is_active: true
      }])
      .select()

    if (adminError) throw adminError
    console.log('Admin created')

    // 3. Create owners
    const { data: ownersData, error: ownersError } = await supabase
      .from('users')
      .insert([
        {
          name: 'Rajesh Kumar',
          email: 'rajesh@fuelsync.com',
          phone: '+91-9876543210',
          password: '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', // owner123
          role: 'owner',
          is_active: true
        },
        {
          name: 'Priya Sharma',
          email: 'priya@fuelsync.com',
          phone: '+91-9876543211',
          password: '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', // owner123
          role: 'owner',
          is_active: true
        }
      ])
      .select()

    if (ownersError) throw ownersError
    console.log('Owners created:', ownersData.length)

    // 4. Create stations
    const { data: stationsData, error: stationsError } = await supabase
      .from('stations')
      .insert([
        {
          name: 'Rajesh Fuel Center',
          brand: 'IOCL',
          address: 'MG Road, Bangalore, Karnataka - 560001',
          owner_id: ownersData[0].id,
          current_plan_id: plansData.find(p => p.name === 'Basic')?.id
        },
        {
          name: 'Highway Express',
          brand: 'BPCL',
          address: 'NH-8, Gurgaon, Haryana - 122001',
          owner_id: ownersData[0].id,
          current_plan_id: plansData.find(p => p.name === 'Basic')?.id
        },
        {
          name: 'Priya Petrol Pump',
          brand: 'HPCL',
          address: 'Ring Road, Delhi - 110001',
          owner_id: ownersData[1].id,
          current_plan_id: plansData.find(p => p.name === 'Premium')?.id
        }
      ])
      .select()

    if (stationsError) throw stationsError
    console.log('Stations created:', stationsData.length)

    // 5. Create employees
    const { data: employeesData, error: employeesError } = await supabase
      .from('users')
      .insert([
        {
          name: 'Ravi Kumar',
          email: 'ravi@fuelsync.com',
          phone: '+91-9876543220',
          password: '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', // emp123
          role: 'employee',
          station_id: stationsData[0].id,
          is_active: true
        },
        {
          name: 'Sunita Devi',
          email: 'sunita@fuelsync.com',
          phone: '+91-9876543221',
          password: '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', // emp123
          role: 'employee',
          station_id: stationsData[0].id,
          is_active: true
        },
        {
          name: 'Kiran Sharma',
          email: 'kiran@fuelsync.com',
          phone: '+91-9876543223',
          password: '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', // emp123
          role: 'employee',
          station_id: stationsData[2].id,
          is_active: true
        }
      ])
      .select()

    if (employeesError) throw employeesError
    console.log('Employees created:', employeesData.length)

    // 6. Create pumps
    const pumpsToCreate = []
    stationsData.forEach((station, stationIndex) => {
      for (let pumpIndex = 1; pumpIndex <= 3; pumpIndex++) {
        pumpsToCreate.push({
          station_id: station.id,
          pump_sno: `P${stationIndex + 1}${pumpIndex.toString().padStart(2, '0')}`,
          name: `Pump ${pumpIndex}`,
          is_active: true
        })
      }
    })

    const { data: pumpsData, error: pumpsError } = await supabase
      .from('pumps')
      .insert(pumpsToCreate)
      .select()

    if (pumpsError) throw pumpsError
    console.log('Pumps created:', pumpsData.length)

    // 7. Create nozzles
    const nozzlesToCreate = []
    pumpsData.forEach(pump => {
      for (let nozzleIndex = 1; nozzleIndex <= 4; nozzleIndex++) {
        nozzlesToCreate.push({
          pump_id: pump.id,
          nozzle_number: nozzleIndex,
          fuel_type: nozzleIndex <= 2 ? 'PETROL' : 'DIESEL',
          is_active: true
        })
      }
    })

    const { data: nozzlesData, error: nozzlesError } = await supabase
      .from('nozzles')
      .insert(nozzlesToCreate)
      .select()

    if (nozzlesError) throw nozzlesError
    console.log('Nozzles created:', nozzlesData.length)

    // 8. Create fuel prices
    const fuelPricesToCreate = []
    stationsData.forEach(station => {
      fuelPricesToCreate.push(
        {
          station_id: station.id,
          fuel_type: 'PETROL',
          price_per_litre: 105.50,
          valid_from: new Date().toISOString(),
          created_by: station.owner_id
        },
        {
          station_id: station.id,
          fuel_type: 'DIESEL',
          price_per_litre: 98.75,
          valid_from: new Date().toISOString(),
          created_by: station.owner_id
        }
      )
    })

    const { data: fuelPricesData, error: fuelPricesError } = await supabase
      .from('fuel_prices')
      .insert(fuelPricesToCreate)
      .select()

    if (fuelPricesError) throw fuelPricesError
    console.log('Fuel prices created:', fuelPricesData.length)

    // 9. Create sample OCR readings
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const ocrReadingsToCreate = []
    nozzlesData.slice(0, 10).forEach((nozzle, index) => {
      const pump = pumpsData.find(p => p.id === nozzle.pump_id)
      const station = stationsData.find(s => s.id === pump?.station_id)
      const employee = employeesData.find(e => e.station_id === station?.id)

      if (pump && station && employee) {
        ocrReadingsToCreate.push({
          station_id: station.id,
          nozzle_id: nozzle.id,
          source: index % 2 === 0 ? 'ocr' : 'manual',
          reading_date: yesterday.toISOString().split('T')[0],
          reading_time: `${8 + index}:00:00`,
          cumulative_vol: 1000 + (index * 50),
          created_by: employee.id,
          image_url: index % 2 === 0 ? `https://example.com/receipt-${index}.jpg` : null
        })
      }
    })

    const { data: ocrData, error: ocrError } = await supabase
      .from('ocr_readings')
      .insert(ocrReadingsToCreate)
      .select()

    if (ocrError) throw ocrError
    console.log('OCR readings created:', ocrData.length)

    // 10. Create sales data
    const salesToCreate = []
    ocrData.forEach((reading, index) => {
      const nozzle = nozzlesData.find(n => n.id === reading.nozzle_id)
      const fuelPrice = fuelPricesData.find(fp => 
        fp.station_id === reading.station_id && fp.fuel_type === nozzle?.fuel_type
      )

      if (nozzle && fuelPrice) {
        const volumeSold = 20 + (index * 5)
        salesToCreate.push({
          station_id: reading.station_id,
          nozzle_id: reading.nozzle_id,
          reading_id: reading.id,
          delta_volume_l: volumeSold,
          price_per_litre: fuelPrice.price_per_litre,
          total_amount: volumeSold * fuelPrice.price_per_litre
        })
      }
    })

    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .insert(salesToCreate)
      .select()

    if (salesError) throw salesError
    console.log('Sales created:', salesData.length)

    // 11. Create tender entries
    const tenderEntriesToCreate = []
    stationsData.forEach(station => {
      const types = ['cash', 'card', 'upi', 'credit']
      types.forEach((type, index) => {
        tenderEntriesToCreate.push({
          station_id: station.id,
          entry_date: yesterday.toISOString().split('T')[0],
          type: type,
          payer: `Customer ${index + 1}`,
          amount: 1000 + (index * 500),
          user_id: employeesData.find(e => e.station_id === station.id)?.id
        })
      })
    })

    const { data: tenderData, error: tenderError } = await supabase
      .from('tender_entries')
      .insert(tenderEntriesToCreate)
      .select()

    if (tenderError) throw tenderError
    console.log('Tender entries created:', tenderData.length)

    console.log('Data seeding completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        data: {
          plans: plansData.length,
          users: adminData.length + ownersData.length + employeesData.length,
          stations: stationsData.length,
          pumps: pumpsData.length,
          nozzles: nozzlesData.length,
          fuelPrices: fuelPricesData.length,
          ocrReadings: ocrData.length,
          sales: salesData.length,
          tenderEntries: tenderData.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Seeding error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
