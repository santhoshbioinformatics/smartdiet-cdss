require('dotenv/config')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SmartDiet CDSS database...\n')

  // ─── Users ──────────────────────────────────────────────
  const users = [
    { email: 'nurse@smartdiet.com', name: 'J. Martinez, RN', role: 'RN', password: 'nurse123' },
    { email: 'doctor@smartdiet.com', name: 'Dr. A. Patel, MD', role: 'MD', password: 'doctor123' },
    { email: 'dietitian@smartdiet.com', name: 'S. Chen, RD', role: 'RD', password: 'dietitian123' },
    { email: 'admin@smartdiet.com', name: 'Admin User', role: 'Admin', password: 'admin123' }
  ]

  const userMap = {}
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: await bcrypt.hash(u.password, 10) }
    })
    userMap[u.role] = user.id
    console.log(`  ✓ User: ${u.name} (${u.email})`)
  }

  // ─── Patients ───────────────────────────────────────────
  const patients = [
    {
      mrn: '04-827-3951', name: 'Margaret H.', age: 68, sex: 'Female',
      weight: '72 kg', height: '163 cm', bmi: '27.1',
      unit: '4-North Med/Surg', attending: 'Dr. Okonkwo',
      admitted: '03/25/2026',
      conditions: ['Lactose Intolerance'],
      restrictions: ['lactose']
    },
    {
      mrn: '07-112-4823', name: 'Thomas B.', age: 34, sex: 'Male',
      weight: '81 kg', height: '178 cm', bmi: '25.6',
      unit: '2-South GI', attending: 'Dr. Sharma',
      admitted: '03/24/2026',
      conditions: ['Celiac Disease'],
      restrictions: ['gluten']
    },
    {
      mrn: '11-334-7762', name: 'Eleanor V.', age: 57, sex: 'Female',
      weight: '88 kg', height: '160 cm', bmi: '34.4',
      unit: '3-East Endocrine', attending: 'Dr. Rivera',
      admitted: '03/26/2026',
      conditions: ['Type 2 Diabetes Mellitus', 'Hypertension (Stage 2)'],
      restrictions: []
    },
    {
      mrn: '09-445-2210', name: 'Robert K.', age: 72, sex: 'Male',
      weight: '68 kg', height: '175 cm', bmi: '22.2',
      unit: '5-West Nephrology', attending: 'Dr. Nguyen',
      admitted: '03/23/2026',
      conditions: ['Chronic Kidney Disease (Stage 3b)', 'Hypertension (Stage 1)'],
      restrictions: []
    },
    {
      mrn: '03-991-5541', name: 'Priya S.', age: 45, sex: 'Female',
      weight: '64 kg', height: '158 cm', bmi: '25.6',
      unit: '4-North Med/Surg', attending: 'Dr. Okonkwo',
      admitted: '03/26/2026',
      conditions: ['Type 2 Diabetes Mellitus', 'Chronic Kidney Disease (Stage 3b)', 'Hypertension (Stage 2)'],
      restrictions: ['gluten', 'nut']
    }
  ]

  const patientMap = {}
  for (const p of patients) {
    const patient = await prisma.patient.upsert({
      where: { mrn: p.mrn },
      update: {},
      create: p
    })
    patientMap[p.mrn] = patient.id
    console.log(`  ✓ Patient: ${p.name} (MRN: ${p.mrn})`)
  }

  // ─── Allergies ──────────────────────────────────────────
  console.log('\n  Seeding allergies...')

  const allergies = [
    // Margaret H. — lactose intolerant
    {
      patientId: patientMap['04-827-3951'],
      substance: 'Lactose',
      reaction: 'GI Distress',
      severity: 'MODERATE',
      source: 'PATIENT_REPORTED',
      category: 'FOOD',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedById: userMap['RN'],
      notes: 'Patient reports lifelong lactose intolerance. Avoids all dairy products.'
    },
    {
      patientId: patientMap['04-827-3951'],
      substance: 'Penicillin',
      reaction: 'Rash',
      severity: 'MILD',
      source: 'PATIENT_REPORTED',
      category: 'MEDICATION',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedById: userMap['MD'],
      notes: 'Developed rash during childhood course. No anaphylaxis history.'
    },

    // Thomas B. — celiac
    {
      patientId: patientMap['07-112-4823'],
      substance: 'Gluten',
      reaction: 'GI Distress',
      severity: 'SEVERE',
      source: 'PROVIDER_ENTERED',
      category: 'FOOD',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedById: userMap['MD'],
      notes: 'Biopsy-confirmed celiac disease. Strict GFD required. Even trace gluten causes villous atrophy.'
    },
    {
      patientId: patientMap['07-112-4823'],
      substance: 'Wheat',
      reaction: 'GI Distress',
      severity: 'SEVERE',
      source: 'PROVIDER_ENTERED',
      category: 'FOOD',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedById: userMap['MD']
    },

    // Priya S. — gluten + nut
    {
      patientId: patientMap['03-991-5541'],
      substance: 'Peanuts',
      reaction: 'Anaphylaxis',
      severity: 'SEVERE',
      source: 'PATIENT_REPORTED',
      category: 'FOOD',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedById: userMap['RN'],
      notes: 'Carries EpiPen. Last reaction: 2024. ED visit required.'
    },
    {
      patientId: patientMap['03-991-5541'],
      substance: 'Tree Nuts',
      reaction: 'Anaphylaxis',
      severity: 'SEVERE',
      source: 'PROVIDER_ENTERED',
      category: 'FOOD',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedById: userMap['MD']
    },
    {
      patientId: patientMap['03-991-5541'],
      substance: 'Gluten',
      reaction: 'GI Distress',
      severity: 'MODERATE',
      source: 'PATIENT_REPORTED',
      category: 'FOOD',
      clinicalStatus: 'active',
      verificationStatus: 'presumed',
      recordedById: userMap['RD'],
      notes: 'Self-reported gluten sensitivity. No celiac biopsy performed.'
    },

    // Robert K. — Iodine contrast allergy
    {
      patientId: patientMap['09-445-2210'],
      substance: 'Shellfish',
      reaction: 'Hives / Urticaria',
      severity: 'MODERATE',
      source: 'PATIENT_REPORTED',
      category: 'FOOD',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedById: userMap['RN'],
      notes: 'Developed hives after eating shrimp. Also reports contrast dye sensitivity.'
    }
  ]

  for (const a of allergies) {
    await prisma.allergy.create({ data: a })
  }
  console.log(`  ✓ ${allergies.length} allergies seeded`)

  // ─── Summary ────────────────────────────────────────────
  console.log('\n✅ Seed complete!')
  console.log(`   ${users.length} users`)
  console.log(`   ${patients.length} patients`)
  console.log(`   ${allergies.length} allergies`)
  console.log('\n   Demo login credentials:')
  console.log('   ───────────────────────')
  for (const u of users) {
    console.log(`   ${u.role.padEnd(6)} → ${u.email} / ${u.password}`)
  }
}

main()
  .catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())