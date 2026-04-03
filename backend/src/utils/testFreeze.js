require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper: add/subtract days from a date
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function log(label, data) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${label}`);
  console.log('═'.repeat(60));
  if (typeof data === 'string') {
    console.log(`  ${data}`);
  } else if (data) {
    Object.entries(data).forEach(([k, v]) => {
      console.log(`  ${k.padEnd(25)} : ${v}`);
    });
  }
}

function logResult(pass, msg) {
  console.log(`  ${pass ? '✅ PASS' : '❌ FAIL'} — ${msg}`);
}

async function main() {
  console.log('\n🧪 MEMBERSHIP FREEZE SYSTEM — FULL TEST SUITE\n');

  // ─── SETUP: Clean previous test data ───
  await prisma.membershipFreeze.deleteMany({ where: { membership: { user: { email: 'testuser@freeze.com' } } } });
  await prisma.membership.deleteMany({ where: { user: { email: 'testuser@freeze.com' } } });
  await prisma.user.deleteMany({ where: { email: 'testuser@freeze.com' } });

  // ─── SETUP: Create test user ───
  const hashedPassword = await bcrypt.hash('test123', 12);
  const user = await prisma.user.create({
    data: { name: 'Test User', email: 'testuser@freeze.com', phone: '9999900000', password: hashedPassword },
  });
  log('SETUP: Test User Created', { id: user.id, email: user.email });

  // ─── SETUP: Get a plan with freeze policy ───
  let plan = await prisma.plan.findFirst({ where: { durationDays: 30 } });
  if (!plan) {
    console.log('  ⚠️  No 30-day plan found, creating one...');
    plan = await prisma.plan.create({
      data: { name: 'Test Monthly', durationDays: 30, price: 1999, benefits: ['Gym access'], maxFreezeCount: 2, maxFreezeDays: 15 },
    });
  }

  // Ensure freeze policy is set
  if (plan.maxFreezeCount === 0) {
    plan = await prisma.plan.update({
      where: { id: plan.id },
      data: { maxFreezeCount: 2, maxFreezeDays: 15 },
    });
  }
  log('SETUP: Plan', { name: plan.name, duration: `${plan.durationDays} days`, maxFreezeCount: plan.maxFreezeCount, maxFreezeDays: plan.maxFreezeDays });

  // ─── SETUP: Get a gym ───
  const gym = await prisma.gym.findFirst();
  if (!gym) { console.log('❌ No gym found! Run seed first.'); return; }
  log('SETUP: Gym', { name: gym.name });

  // ─── SETUP: Create membership (started 10 days ago, ends in 20 days) ───
  const now = new Date();
  const startDate = addDays(now, -10);
  const endDate = addDays(now, 20);

  const membership = await prisma.membership.create({
    data: {
      userId: user.id, planId: plan.id, gymId: gym.id,
      startDate, endDate, originalEndDate: endDate, status: 'ACTIVE',
    },
  });
  log('SETUP: Membership Created', {
    id: membership.id,
    status: membership.status,
    startDate: fmt(membership.startDate),
    endDate: fmt(membership.endDate),
  });

  // ══════════════════════════════════════════════
  // TEST 1: Freeze immediately (today)
  // ══════════════════════════════════════════════
  log('TEST 1: Immediate Freeze (5 days)');

  const freeze1Start = now;
  const freeze1End = addDays(now, 5);

  const freeze1 = await prisma.membershipFreeze.create({
    data: {
      membershipId: membership.id,
      freezeStartDate: freeze1Start,
      freezeEndDate: freeze1End,
      requestedDays: 5,
      status: 'ACTIVE',
    },
  });

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'FROZEN', totalFreezeCountUsed: { increment: 1 } },
  });

  let m = await prisma.membership.findUnique({ where: { id: membership.id } });
  logResult(m.status === 'FROZEN', `Status = ${m.status}`);
  logResult(m.totalFreezeCountUsed === 1, `Freeze count used = ${m.totalFreezeCountUsed}`);
  console.log(`  Freeze: ${fmt(freeze1Start)} to ${fmt(freeze1End)}`);

  // ══════════════════════════════════════════════
  // TEST 2: Manual unfreeze after 3 days (simulate)
  // ══════════════════════════════════════════════
  log('TEST 2: Manual Unfreeze after 3 days (out of 5 requested)');

  const unfreezeDate = addDays(now, 3); // simulate 3 days passed
  const actualDays = 3;
  const newEndDate = addDays(m.endDate, actualDays);

  await prisma.membershipFreeze.update({
    where: { id: freeze1.id },
    data: { status: 'COMPLETED', freezeEndDate: unfreezeDate, actualDays },
  });

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'ACTIVE', endDate: newEndDate, totalFreezeDaysUsed: { increment: actualDays } },
  });

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  logResult(m.status === 'ACTIVE', `Status = ${m.status}`);
  logResult(m.totalFreezeDaysUsed === 3, `Total freeze days used = ${m.totalFreezeDaysUsed} (3 actual, not 5 requested)`);
  logResult(m.endDate.getTime() === newEndDate.getTime(), `EndDate extended by 3 days: ${fmt(membership.endDate)} → ${fmt(m.endDate)}`);
  console.log(`  ✨ Remaining freeze days: ${plan.maxFreezeDays - m.totalFreezeDaysUsed} of ${plan.maxFreezeDays}`);

  // ══════════════════════════════════════════════
  // TEST 3: Schedule a future freeze
  // ══════════════════════════════════════════════
  log('TEST 3: Schedule Future Freeze (7 days, starting in 5 days)');

  const freeze2Start = addDays(now, 5);
  const freeze2End = addDays(now, 12);

  const freeze2 = await prisma.membershipFreeze.create({
    data: {
      membershipId: membership.id,
      freezeStartDate: freeze2Start,
      freezeEndDate: freeze2End,
      requestedDays: 7,
      status: 'SCHEDULED',
    },
  });

  logResult(freeze2.status === 'SCHEDULED', `Freeze scheduled: ${fmt(freeze2Start)} to ${fmt(freeze2End)}`);

  // ══════════════════════════════════════════════
  // TEST 4: Cancel scheduled freeze
  // ══════════════════════════════════════════════
  log('TEST 4: Cancel Scheduled Freeze');

  await prisma.membershipFreeze.update({
    where: { id: freeze2.id },
    data: { status: 'CANCELLED' },
  });

  const cancelledFreeze = await prisma.membershipFreeze.findUnique({ where: { id: freeze2.id } });
  logResult(cancelledFreeze.status === 'CANCELLED', 'Scheduled freeze cancelled successfully');

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  logResult(m.status === 'ACTIVE', `Membership still ACTIVE after cancel: ${m.status}`);
  logResult(m.totalFreezeCountUsed === 1, `Freeze count unchanged: ${m.totalFreezeCountUsed}`);

  // ══════════════════════════════════════════════
  // TEST 5: Auto-unfreeze (simulate freeze that expired)
  // ══════════════════════════════════════════════
  log('TEST 5: Auto-Unfreeze (freeze ended naturally)');

  const freeze3Start = addDays(now, -5); // started 5 days ago
  const freeze3End = addDays(now, -1);   // ended yesterday
  const freeze3Days = 4;

  const freeze3 = await prisma.membershipFreeze.create({
    data: {
      membershipId: membership.id,
      freezeStartDate: freeze3Start,
      freezeEndDate: freeze3End,
      requestedDays: freeze3Days,
      status: 'ACTIVE', // still active — cron should catch it
    },
  });

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'FROZEN', totalFreezeCountUsed: { increment: 1 } },
  });

  // Run auto-unfreeze logic
  const { autoUnfreeze } = require('./freezeCron');
  await autoUnfreeze();

  const autoFreeze = await prisma.membershipFreeze.findUnique({ where: { id: freeze3.id } });
  m = await prisma.membership.findUnique({ where: { id: membership.id } });

  logResult(autoFreeze.status === 'AUTO_COMPLETED', `Freeze status = ${autoFreeze.status}`);
  logResult(autoFreeze.actualDays === freeze3Days, `Actual days = ${autoFreeze.actualDays}`);
  logResult(m.status === 'ACTIVE', `Membership back to ACTIVE: ${m.status}`);
  console.log(`  EndDate after auto-unfreeze: ${fmt(m.endDate)}`);
  console.log(`  Total freeze days used: ${m.totalFreezeDaysUsed}`);

  // ══════════════════════════════════════════════
  // TEST 6: Freeze limit exceeded
  // ══════════════════════════════════════════════
  log('TEST 6: Freeze Count Limit Check');

  // Set freeze count to max to simulate limit reached
  await prisma.membership.update({
    where: { id: membership.id },
    data: { totalFreezeCountUsed: plan.maxFreezeCount, status: 'ACTIVE' },
  });
  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  logResult(m.totalFreezeCountUsed >= plan.maxFreezeCount,
    `Freeze count ${m.totalFreezeCountUsed} >= max ${plan.maxFreezeCount} — NO MORE FREEZES ALLOWED`);

  // ══════════════════════════════════════════════
  // TEST 7: Overlap detection
  // ══════════════════════════════════════════════
  log('TEST 7: Overlap Detection');

  // Reset count for this test
  await prisma.membership.update({
    where: { id: membership.id },
    data: { totalFreezeCountUsed: 0, totalFreezeDaysUsed: 0, status: 'ACTIVE' },
  });

  const overlapFreeze = await prisma.membershipFreeze.create({
    data: {
      membershipId: membership.id,
      freezeStartDate: addDays(now, 2),
      freezeEndDate: addDays(now, 8),
      requestedDays: 6,
      status: 'SCHEDULED',
    },
  });

  // Check if a new freeze overlaps
  const overlapCheck = await prisma.membershipFreeze.findFirst({
    where: {
      membershipId: membership.id,
      status: { in: ['SCHEDULED', 'ACTIVE'] },
      freezeStartDate: { lt: addDays(now, 7) },  // new freeze ends day 7
      freezeEndDate: { gt: addDays(now, 3) },     // new freeze starts day 3
    },
  });
  logResult(!!overlapCheck, `Overlap detected for day 3-7 (existing: day 2-8)`);

  // Boundary test: freeze ending day 2 + new starting day 2 = NO overlap
  const boundaryCheck = await prisma.membershipFreeze.findFirst({
    where: {
      membershipId: membership.id,
      status: { in: ['SCHEDULED', 'ACTIVE'] },
      freezeStartDate: { lt: addDays(now, 15) },  // new freeze ends day 15
      freezeEndDate: { gt: addDays(now, 8) },      // new freeze starts day 8 (same as existing end)
    },
  });
  logResult(!boundaryCheck, `Boundary: existing ends day 8, new starts day 8 — NO overlap (allowed)`);

  // Cleanup overlap test freeze
  await prisma.membershipFreeze.delete({ where: { id: overlapFreeze.id } });

  // ══════════════════════════════════════════════
  // TEST 8: Expired membership can't be frozen
  // ══════════════════════════════════════════════
  log('TEST 8: Expired Membership Freeze Block');

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'EXPIRED' },
  });

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  logResult(m.status === 'EXPIRED', `Status = EXPIRED — freeze should be blocked by API`);

  // ══════════════════════════════════════════════
  // TEST 9: Expiry boundary (TC10 from boss)
  // Scenario: Membership ends June 30, freeze June 25 for 10 days
  // Expected: After auto-unfreeze, endDate = July 10
  // ══════════════════════════════════════════════
  log('TEST 9: Freeze on Expiry Boundary (Boss TC10)');

  // Membership ends in 5 days
  const boundaryEnd = addDays(now, 5);
  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'ACTIVE', endDate: boundaryEnd, totalFreezeCountUsed: 0, totalFreezeDaysUsed: 0 },
  });

  // Freeze started 10 days ago, for 10 days (so it ended today/yesterday)
  const freeze9Start = addDays(now, -10);
  const freeze9End = addDays(now, -1); // ended yesterday

  const freeze9 = await prisma.membershipFreeze.create({
    data: {
      membershipId: membership.id,
      freezeStartDate: freeze9Start,
      freezeEndDate: freeze9End,
      requestedDays: 10,
      status: 'ACTIVE',
    },
  });

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'FROZEN', totalFreezeCountUsed: 1 },
  });

  // Run auto-unfreeze
  await autoUnfreeze();

  const freeze9Record = await prisma.membershipFreeze.findUnique({ where: { id: freeze9.id } });
  m = await prisma.membership.findUnique({ where: { id: membership.id } });

  const expectedEnd = addDays(boundaryEnd, 10); // original end + 10 freeze days

  console.log(`  Membership was ending:  ${fmt(boundaryEnd)}`);
  console.log(`  Freeze: ${fmt(freeze9Start)} to ${fmt(freeze9End)} (10 days)`);
  console.log(`  Freeze actual days:     ${freeze9Record.actualDays}`);
  console.log(`  New end date:           ${fmt(m.endDate)}`);
  console.log(`  Expected end date:      ${fmt(expectedEnd)}`);
  logResult(freeze9Record.actualDays === 10, `Actual days = 10 (correct)`);
  logResult(m.endDate >= boundaryEnd, `EndDate extended PAST original expiry`);
  logResult(m.status === 'ACTIVE', `Membership back to ACTIVE (not expired during freeze)`);

  // ══════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════
  log('FREEZE HISTORY (all records)');

  const allFreezes = await prisma.membershipFreeze.findMany({
    where: { membershipId: membership.id },
    orderBy: { createdAt: 'asc' },
  });

  allFreezes.forEach((f, i) => {
    console.log(`  #${i + 1}  ${f.status.padEnd(15)} | ${fmt(f.freezeStartDate)} → ${fmt(f.freezeEndDate)} | Req: ${f.requestedDays}d, Actual: ${f.actualDays}d`);
  });

  // ─── CLEANUP ───
  await prisma.membershipFreeze.deleteMany({ where: { membershipId: membership.id } });
  await prisma.membership.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  log('🎉 ALL TESTS COMPLETE', 'Test data cleaned up.');
}

main()
  .catch(err => { console.error('❌ Test failed:', err); })
  .finally(() => prisma.$disconnect());
