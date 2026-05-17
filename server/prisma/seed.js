/**
 * seed.js — Full production seed for CG Forecast demo
 * Creates: 4 main users + 4 group leaders, 6 ministry groups,
 * 52 weeks of realistic varied attendance + feedback, 3 pre-seeded alerts.
 *
 * Demo accounts:
 *   Pastor:  samuel@church.org  / demo123
 *   Admin:   grace@church.org   / demo123
 *   Usher:   daniel@church.org  / demo123
 *   Member:  mary@church.org    / demo123
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function gaussianRandom(mean, std) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── Users ─────────────────────────────────────────────────────────────────────
const USERS = [
  // Main demo accounts (Admin and Pastor only)
  { name: 'Pastor Samuel Njoroge', email: 'samuel@church.org', password: 'demo123', role: 'pastor' },
  { name: 'Admin Grace Wanjiku',   email: 'grace@church.org',  password: 'demo123', role: 'admin'  },
  { name: 'Analyst Victor Nzwili', email: 'victor@church.org', password: 'demo123', role: 'analyst'},
];

// ── Group definitions ─────────────────────────────────────────────────────────
// [name, category, leaderEmail, baseMembership, weeklyDrift, noiseStd, targetTrend]
const GROUPS = [
  ['Youth Alive Fellowship',      'Youth',      'samuel@church.org',  128, 0.85, 8,  '+8%'  ],
  ['Morning Glory Bible Study',   'Bible Study','samuel@church.org',   92,-0.35, 5,  '-4%'  ],
  ['Sanctuary Choir',             'Music',      'samuel@church.org',   58, 1.20, 4,  '+12%' ],
  ['Women\'s Fellowship',         'Fellowship', 'grace@church.org',   198, 0.10, 10, '+1%'  ],
  ['Intercessory Prayer Group',   'Prayer',     'samuel@church.org',   62,-1.10, 4,  '-11%' ],
  ['Men\'s Brotherhood',          'Fellowship', 'samuel@church.org',  112, 0.30, 7,  '+3%'  ],
];

// ── Pre-seeded alerts (for the demo badge showing "3") ────────────────────────
// These are generated AFTER attendance/forecasts are seeded.

async function main() {
  console.log('🌱 Seeding CG Forecast database (full demo data)…\n');

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Creating users…');
  const userMap = {}; // email → User record
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, passwordHash: hash, role: u.role },
      create: { name: u.name, email: u.email, passwordHash: hash, role: u.role }
    });
    userMap[u.email] = user;
    console.log(`   ✓ ${user.role.padEnd(8)} — ${user.name} (${user.email})`);

    // Seed ChurchProfile for the main demo users
    if (u.role === 'admin' || u.role === 'pastor') {
      await prisma.churchProfile.upsert({
        where: { userId: user.id },
        update: {
          churchName: 'Nairobi Central Faith Center',
          activeMembership: 650,
          location: 'Nairobi CBD',
          yearsOfRecords: '2-5 years',
          techStack: 'Excel, WhatsApp logs'
        },
        create: {
          userId: user.id,
          churchName: 'Nairobi Central Faith Center',
          activeMembership: 650,
          location: 'Nairobi CBD',
          yearsOfRecords: '2-5 years',
          techStack: 'Excel, WhatsApp logs'
        }
      });
    }
  }

  // ── Groups ─────────────────────────────────────────────────────────────────
  console.log('\n⛪ Creating faith groups…');
  const createdGroups = [];
  for (const [name, category, leaderEmail] of GROUPS) {
    const leader = userMap[leaderEmail];
    const group = await prisma.group.upsert({
      where: { id: createdGroups.length + 1 },
      update: { name, category, leaderId: leader.id },
      create: { name, category, leaderId: leader.id }
    });
    createdGroups.push(group);
    console.log(`   ✓ [${category.padEnd(12)}] ${name} — led by ${leader.name}`);
  }

  // ── 52 weeks of Attendance + Feedback ─────────────────────────────────────
  const START_DATE = new Date('2024-01-07');
  console.log('\n📅 Seeding 52 weeks of attendance + feedback…');

  for (let gi = 0; gi < createdGroups.length; gi++) {
    const group = createdGroups[gi];
    const [,,,base, drift, noise] = GROUPS[gi];

    for (let week = 0; week < 52; week++) {
      const sessionDate = addWeeks(START_DATE, week);
      let headcount   = Math.max(10, Math.round(gaussianRandom(base + drift * week, noise)));
      if (week === 51) {
        const TARGETS = [142, 87, 65, 203, 48, 119];
        headcount = TARGETS[gi];
      }
      const rsvpCount   = Math.round(headcount * (0.7 + Math.random() * 0.3));

      await prisma.attendance.upsert({
        where: { groupId_sessionDate: { groupId: group.id, sessionDate } },
        update: { headcount, rsvpCount },
        create: { groupId: group.id, sessionDate, headcount, rsvpCount }
      });

      const avgRating    = Math.min(5, Math.max(1, parseFloat(gaussianRandom(3.85, 0.45).toFixed(2))));
      const responseCount = Math.round(headcount * (0.3 + Math.random() * 0.25));

      await prisma.feedback.upsert({
        where: { groupId_sessionDate: { groupId: group.id, sessionDate } },
        update: { avgRating, responseCount },
        create: { groupId: group.id, sessionDate, avgRating, responseCount }
      });
    }
    const [name,,,,,,trend] = GROUPS[gi];
    console.log(`   ✓ 52 weeks → ${name} (trend ${trend})`);
  }

  // ── Seed 3 pre-built Forecast + Alert records for demo ────────────────────
  console.log('\n⚡ Seeding demo forecasts + alerts…');

  const alertDefs = [
    {
      groupIndex: 4, // Intercessory Prayer Group
      predicted: 38, lower: 31, upper: 45,
      alertType: 'drop',
      message: 'Attendance may drop 18% over the next 4 weeks for Intercessory Prayer Group.',
      recommendation: 'Initiate outreach immediately. Schedule one-on-one pastoral follow-ups with lapsed members.',
    },
    {
      groupIndex: 1, // Morning Glory Bible Study
      predicted: 82, lower: 76, upper: 88,
      alertType: 'drop',
      message: 'Attendance declining 4% per week across 3 consecutive sessions.',
      recommendation: 'Review session content relevance. Consider a feedback survey and programme refresh.',
    },
    {
      groupIndex: 2, // Sanctuary Choir
      predicted: 89, lower: 84, upper: 94,
      alertType: 'growth',
      message: 'Attendance growth of 12% forecast over the next 4 weeks.',
      recommendation: 'Prepare additional seating. Consider capacity expansion and a recruitment drive.',
    },
  ];

  for (const def of alertDefs) {
    const group = createdGroups[def.groupIndex];
    const forecast = await prisma.forecast.create({
      data: {
        groupId: group.id,
        forecastDate: new Date(),
        predictedHeadcount: def.predicted,
        confidenceLower: def.lower,
        confidenceUpper: def.upper,
      }
    });

    await prisma.alert.create({
      data: {
        forecastId: forecast.id,
        groupId: group.id,
        alertType: def.alertType,
        message: def.message,
        recommendation: def.recommendation,
        acknowledged: false,
      }
    });
    console.log(`   ✓ ${def.alertType.toUpperCase()} alert → ${group.name}`);
  }

  console.log('\n✅ Seed complete! Summary:');
  console.log(`   ${USERS.length} users | ${createdGroups.length} groups | ${52 * createdGroups.length} attendance records | 3 alerts`);
  console.log('\n🚀 Demo accounts:');
  console.log('   Pastor:  samuel@church.org  / demo123');
  console.log('   Admin:   grace@church.org   / demo123');
  console.log('\n⚙️  Next step: run the ML pipeline to train SVR models:');
  console.log('   cd ml && python pipeline.py && python train.py');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
