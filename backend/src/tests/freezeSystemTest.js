require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api/memberships`;

let passed = 0;
let failed = 0;

// ─── Helpers ───
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtISO(d) {
  return new Date(d).toISOString().split('T')[0];
}

function log(label) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${label}`);
  console.log('═'.repeat(60));
}

function check(pass, msg) {
  if (pass) {
    passed++;
    console.log(`  ✅ PASS — ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ FAIL — ${msg}`);
  }
}

async function api(method, path, token, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// ─── Main ───
async function main() {
  console.log('\n🧪 FREEZE SYSTEM — COMPREHENSIVE API TEST SUITE\n');
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Time: ${new Date().toLocaleString()}`);

  // ─── SETUP ───
  log('SETUP: Creating test data');

  // Cleanup previous test data
  await prisma.membershipFreeze.deleteMany({ where: { membership: { user: { email: 'freezetest@test.com' } } } });
  await prisma.membership.deleteMany({ where: { user: { email: 'freezetest@test.com' } } });
  await prisma.user.deleteMany({ where: { email: 'freezetest@test.com' } });
  await prisma.gymPlan.deleteMany({ where: { plan: { name: 'Freeze Test Plan' } } });
  await prisma.plan.deleteMany({ where: { name: 'Freeze Test Plan' } });

  // Create test user
  const hashedPassword = await bcrypt.hash('test123', 12);
  const user = await prisma.user.create({
    data: { name: 'Freeze Tester', email: 'freezetest@test.com', phone: '9876500000', password: hashedPassword },
  });

  // Generate JWT token for this user (must have role: 'user' and id)
  const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Get gym
  const gym = await prisma.gym.findFirst();
  if (!gym) { console.log('❌ No gym found! Run seed first.'); return; }

  // Create a dedicated test plan with known freeze policy
  await prisma.gymPlan.deleteMany({ where: { plan: { name: 'Freeze Test Plan' } } });
  await prisma.plan.deleteMany({ where: { name: 'Freeze Test Plan' } });
  const plan = await prisma.plan.create({
    data: {
      name: 'Freeze Test Plan', durationDays: 90, price: 2999, benefits: ['Gym'],
      maxFreezeCount: 3, maxFreezeDays: 30,
      gymPlans: { create: { gymId: gym.id } },
    },
  });

  // Create membership
  const now = new Date();
  const startDate = addDays(now, -5);
  const endDate = addDays(now, 85);

  const membership = await prisma.membership.create({
    data: {
      userId: user.id, planId: plan.id, gymId: gym.id,
      startDate, endDate, originalEndDate: endDate, status: 'ACTIVE',
    },
  });

  console.log(`  User: ${user.email}`);
  console.log(`  Plan: ${plan.name} (maxFreeze: ${plan.maxFreezeCount}, maxDays: ${plan.maxFreezeDays})`);
  console.log(`  Membership: ${fmt(startDate)} to ${fmt(endDate)}`);
  console.log(`  Token: ${token.substring(0, 20)}...`);

  // ══════════════════════════════════════════════
  // TC1: Immediate freeze (today)
  // ══════════════════════════════════════════════
  log('TC1: Immediate Freeze');
  const tc1 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(now),
    freezeDays: 5,
    reason: 'Travelling',
  });
  console.log(`  Status: ${tc1.status}`);
  console.log(`  Message: ${tc1.data.message}`);
  check(tc1.status === 201, `Created: ${tc1.status === 201}`);
  check(tc1.data.freeze?.status === 'ACTIVE', `Freeze status = ${tc1.data.freeze?.status}`);

  let m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.status === 'FROZEN', `Membership status = ${m.status}`);
  check(m.totalFreezeCountUsed === 1, `Count used = ${m.totalFreezeCountUsed} (should be 1)`);
  check(m.totalFreezeDaysUsed === 5, `Days used = ${m.totalFreezeDaysUsed} (should be 5 — deducted at creation)`);

  const freeze1Id = tc1.data.freeze?.id;

  // ══════════════════════════════════════════════
  // TC2: Cannot freeze already FROZEN membership
  // ══════════════════════════════════════════════
  log('TC2: Cannot freeze FROZEN membership');
  const tc2 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 10)),
    freezeDays: 3,
  });
  check(tc2.status === 400, `Rejected: status ${tc2.status}`);
  check(tc2.data.error?.includes('frozen'), `Error: "${tc2.data.error}"`);

  // ══════════════════════════════════════════════
  // TC3: Unfreeze with wasted days warning
  // ══════════════════════════════════════════════
  log('TC3: Manual Unfreeze (partial — days wasted)');
  const tc3 = await api('POST', `/${membership.id}/unfreeze`, token);
  console.log(`  Status: ${tc3.status}`);
  console.log(`  Actual days: ${tc3.data.actualFreezeDays}`);
  console.log(`  New end date: ${tc3.data.newEndDate}`);
  check(tc3.status === 200, `Unfrozen: ${tc3.status === 200}`);
  check(tc3.data.actualFreezeDays >= 0, `Actual freeze days = ${tc3.data.actualFreezeDays}`);

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.status === 'ACTIVE', `Membership back to ACTIVE: ${m.status}`);
  // Days used should stay the same (5) — NOT reduced to actualDays
  check(m.totalFreezeDaysUsed === 5, `Days used still = ${m.totalFreezeDaysUsed} (NOT reduced after unfreeze)`);
  check(m.totalFreezeCountUsed === 1, `Count still = ${m.totalFreezeCountUsed} (NOT reduced after unfreeze)`);

  // ══════════════════════════════════════════════
  // TC4: Schedule future freeze
  // ══════════════════════════════════════════════
  log('TC4: Schedule Future Freeze (10 days)');
  const futureDate = addDays(now, 15);
  const tc4 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(futureDate),
    freezeDays: 10,
  });
  console.log(`  Status: ${tc4.status}`);
  check(tc4.status === 201, `Created: ${tc4.status === 201}`);
  check(tc4.data.freeze?.status === 'SCHEDULED', `Freeze status = ${tc4.data.freeze?.status}`);

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.totalFreezeCountUsed === 2, `Count = ${m.totalFreezeCountUsed} (incremented at schedule time)`);
  check(m.totalFreezeDaysUsed === 15, `Days used = ${m.totalFreezeDaysUsed} (5 + 10 = 15, deducted at schedule)`);
  check(m.status === 'ACTIVE', `Membership still ACTIVE: ${m.status} (not frozen for scheduled)`);

  const freeze2Id = tc4.data.freeze?.id;

  // ══════════════════════════════════════════════
  // TC5: Cancel scheduled freeze — count/days NOT returned
  // ══════════════════════════════════════════════
  log('TC5: Cancel Scheduled Freeze — Count & Days NOT Returned');
  const tc5 = await api('POST', `/cancel/${freeze2Id}`, token);
  console.log(`  Status: ${tc5.status}`);
  check(tc5.status === 200, `Cancelled: ${tc5.status === 200}`);

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.totalFreezeCountUsed === 2, `Count still = ${m.totalFreezeCountUsed} (NOT returned to 1)`);
  check(m.totalFreezeDaysUsed === 15, `Days still = ${m.totalFreezeDaysUsed} (NOT returned to 5)`);

  // ══════════════════════════════════════════════
  // TC6: Cannot cancel ACTIVE/COMPLETED freeze
  // ══════════════════════════════════════════════
  log('TC6: Cannot cancel non-SCHEDULED freeze');
  const tc6 = await api('POST', `/cancel/${freeze1Id}`, token);
  check(tc6.status === 400, `Rejected: status ${tc6.status}`);
  check(tc6.data.error?.toLowerCase().includes('scheduled') || tc6.data.error?.toLowerCase().includes('cancel'), `Error: "${tc6.data.error}"`);

  // ══════════════════════════════════════════════
  // TC7: Freeze days limit enforcement
  // ══════════════════════════════════════════════
  log('TC7: Freeze Days Limit — Cannot exceed remaining');
  const remainingDays = plan.maxFreezeDays - m.totalFreezeDaysUsed;
  console.log(`  Remaining days: ${remainingDays}`);

  const tc7 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 20)),
    freezeDays: remainingDays + 5, // exceed limit
  });
  check(tc7.status === 400, `Rejected: status ${tc7.status}`);
  check(tc7.data.error?.includes('remaining') || tc7.data.error?.includes('days'), `Error: "${tc7.data.error}"`);

  // ══════════════════════════════════════════════
  // TC8: Valid freeze with exact remaining days
  // ══════════════════════════════════════════════
  log('TC8: Freeze with exact remaining days');
  const tc8 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 25)),
    freezeDays: remainingDays,
  });
  console.log(`  Status: ${tc8.status}`);
  check(tc8.status === 201, `Created with exactly ${remainingDays} days: ${tc8.status === 201}`);

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.totalFreezeCountUsed === 3, `Count = ${m.totalFreezeCountUsed} (all 3 used)`);
  check(m.totalFreezeDaysUsed === plan.maxFreezeDays, `Days = ${m.totalFreezeDaysUsed} (max ${plan.maxFreezeDays} reached)`);

  // ══════════════════════════════════════════════
  // TC9: Freeze count limit reached
  // ══════════════════════════════════════════════
  log('TC9: Freeze Count Limit Reached');
  const tc9 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 50)),
    freezeDays: 1,
  });
  check(tc9.status === 400, `Rejected: status ${tc9.status}`);
  check(tc9.data.error?.includes('limit') || tc9.data.error?.includes('Freeze'), `Error: "${tc9.data.error}"`);

  // ══════════════════════════════════════════════
  // TC10: Past date freeze rejected
  // ══════════════════════════════════════════════
  log('TC10: Past Date Freeze Rejected');

  // Reset counters for this test
  await prisma.membership.update({
    where: { id: membership.id },
    data: { totalFreezeCountUsed: 0, totalFreezeDaysUsed: 0 },
  });

  const tc10 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, -3)),
    freezeDays: 5,
  });
  check(tc10.status === 400, `Rejected: status ${tc10.status}`);
  check(tc10.data.error?.includes('past'), `Error: "${tc10.data.error}"`);

  // ══════════════════════════════════════════════
  // TC11: Overlapping freeze detection
  // ══════════════════════════════════════════════
  log('TC11: Overlapping Freeze Detection');

  // Schedule a freeze first
  const tc11a = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 10)),
    freezeDays: 10,
  });
  check(tc11a.status === 201, `First freeze scheduled: ${tc11a.status === 201}`);

  // Try overlapping freeze
  const tc11b = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 15)), // overlaps with day 10-20
    freezeDays: 5,
  });
  check(tc11b.status === 400, `Overlap rejected: status ${tc11b.status}`);
  check(tc11b.data.error?.includes('overlap'), `Error: "${tc11b.data.error}"`);

  // ══════════════════════════════════════════════
  // TC12: Boundary freeze (end day = start day) — should be ALLOWED
  // ══════════════════════════════════════════════
  log('TC12: Boundary Freeze (end day = start day) — Allowed');
  const tc12 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 20)), // starts exactly when previous ends
    freezeDays: 5,
  });
  check(tc12.status === 201, `Boundary freeze allowed: ${tc12.status === 201}`);

  // ══════════════════════════════════════════════
  // TC13: Unfreeze non-frozen membership
  // ══════════════════════════════════════════════
  log('TC13: Unfreeze Non-Frozen Membership');
  const tc13 = await api('POST', `/${membership.id}/unfreeze`, token);
  check(tc13.status === 400, `Rejected: status ${tc13.status}`);
  check(tc13.data.error?.includes('not frozen') || tc13.data.error?.includes('FROZEN') || tc13.data.error?.toLowerCase().includes('frozen'), `Error: "${tc13.data.error}"`);

  // ══════════════════════════════════════════════
  // TC14: Expired membership cannot freeze
  // ══════════════════════════════════════════════
  log('TC14: Expired Membership Cannot Freeze');

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'EXPIRED', totalFreezeCountUsed: 0, totalFreezeDaysUsed: 0 },
  });

  const tc14 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 5)),
    freezeDays: 3,
  });
  check(tc14.status === 400, `Rejected: status ${tc14.status}`);
  check(tc14.data.error?.includes('expired'), `Error: "${tc14.data.error}"`);

  // ══════════════════════════════════════════════
  // TC15: Freeze status API
  // ══════════════════════════════════════════════
  log('TC15: Freeze Status API');

  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'ACTIVE', totalFreezeCountUsed: 1, totalFreezeDaysUsed: 10 },
  });

  const tc15 = await api('GET', `/${membership.id}/freeze-status`, token);
  check(tc15.status === 200, `Status API works: ${tc15.status === 200}`);
  check(tc15.data.used?.freezeCount === 1, `Used count = ${tc15.data.used?.freezeCount}`);
  check(tc15.data.used?.freezeDays === 10, `Used days = ${tc15.data.used?.freezeDays}`);
  check(tc15.data.remaining?.freezeCount === plan.maxFreezeCount - 1, `Remaining count = ${tc15.data.remaining?.freezeCount}`);
  check(tc15.data.remaining?.freezeDays === plan.maxFreezeDays - 10, `Remaining days = ${tc15.data.remaining?.freezeDays}`);

  // ══════════════════════════════════════════════
  // TC16: Freeze history API
  // ══════════════════════════════════════════════
  log('TC16: Freeze History API');
  const tc16 = await api('GET', `/${membership.id}/freeze-history`, token);
  check(tc16.status === 200, `History API works: ${tc16.status === 200}`);
  check(Array.isArray(tc16.data), `Returns array: ${Array.isArray(tc16.data)}`);
  check(tc16.data.length > 0, `Has ${tc16.data.length} freeze records`);

  // ══════════════════════════════════════════════
  // TC17: Cron — Activate Scheduled Freeze
  // ══════════════════════════════════════════════
  log('TC17: Cron — Activate Scheduled Freeze');

  // Clean all freezes and reset
  await prisma.membershipFreeze.deleteMany({ where: { membershipId: membership.id } });
  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'ACTIVE', totalFreezeCountUsed: 1, totalFreezeDaysUsed: 5 },
  });

  // Create a SCHEDULED freeze that should have started (past start date)
  const cronFreeze = await prisma.membershipFreeze.create({
    data: {
      membershipId: membership.id,
      freezeStartDate: addDays(now, -1), // should have started yesterday
      freezeEndDate: addDays(now, 4),
      requestedDays: 5,
      status: 'SCHEDULED',
    },
  });

  const { activateScheduledFreezes } = require('../utils/freezeCron');
  await activateScheduledFreezes();

  const cronFreezeAfter = await prisma.membershipFreeze.findUnique({ where: { id: cronFreeze.id } });
  m = await prisma.membership.findUnique({ where: { id: membership.id } });

  check(cronFreezeAfter.status === 'ACTIVE', `Cron activated freeze: ${cronFreezeAfter.status}`);
  check(m.status === 'FROZEN', `Membership now FROZEN: ${m.status}`);
  check(m.totalFreezeCountUsed === 1, `Count NOT incremented by cron: ${m.totalFreezeCountUsed} (still 1)`);

  // ══════════════════════════════════════════════
  // TC18: Cron — Auto Unfreeze
  // ══════════════════════════════════════════════
  log('TC18: Cron — Auto Unfreeze Expired Freeze');

  // Set freeze as already expired
  await prisma.membershipFreeze.update({
    where: { id: cronFreeze.id },
    data: {
      freezeStartDate: addDays(now, -6),
      freezeEndDate: addDays(now, -1), // ended yesterday
      status: 'ACTIVE',
    },
  });

  const endDateBefore = m.endDate;
  const { autoUnfreeze } = require('../utils/freezeCron');
  await autoUnfreeze();

  const autoFreezeAfter = await prisma.membershipFreeze.findUnique({ where: { id: cronFreeze.id } });
  m = await prisma.membership.findUnique({ where: { id: membership.id } });

  check(autoFreezeAfter.status === 'AUTO_COMPLETED', `Auto-unfroze: ${autoFreezeAfter.status}`);
  check(m.status === 'ACTIVE', `Membership ACTIVE again: ${m.status}`);
  check(m.endDate > endDateBefore, `End date extended: ${fmt(endDateBefore)} → ${fmt(m.endDate)}`);
  check(m.totalFreezeDaysUsed === 5, `Days used NOT incremented again by cron: ${m.totalFreezeDaysUsed}`);

  // ══════════════════════════════════════════════
  // TC19: Full Flow — Schedule → Cancel → Schedule Again (count consumed)
  // ══════════════════════════════════════════════
  log('TC19: Full Flow — Schedule → Cancel → Schedule (count consumed forever)');

  // Reset
  await prisma.membershipFreeze.deleteMany({ where: { membershipId: membership.id } });
  await prisma.membership.update({
    where: { id: membership.id },
    data: { status: 'ACTIVE', totalFreezeCountUsed: 0, totalFreezeDaysUsed: 0 },
  });

  // Schedule freeze 1
  const f1 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 5)),
    freezeDays: 5,
  });
  check(f1.status === 201, `Freeze 1 scheduled`);

  // Cancel freeze 1
  const c1 = await api('POST', `/cancel/${f1.data.freeze?.id}`, token);
  check(c1.status === 200, `Freeze 1 cancelled`);

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.totalFreezeCountUsed === 1, `After cancel: count = ${m.totalFreezeCountUsed} (consumed, NOT returned)`);
  check(m.totalFreezeDaysUsed === 5, `After cancel: days = ${m.totalFreezeDaysUsed} (consumed, NOT returned)`);

  // Schedule freeze 2
  const f2 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 10)),
    freezeDays: 5,
  });
  check(f2.status === 201, `Freeze 2 scheduled (uses 2nd slot)`);

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.totalFreezeCountUsed === 2, `Count = ${m.totalFreezeCountUsed} (1 cancelled + 1 new = 2 consumed)`);
  check(m.totalFreezeDaysUsed === 10, `Days = ${m.totalFreezeDaysUsed} (5 cancelled + 5 new = 10 consumed)`);

  // ══════════════════════════════════════════════
  // TC20: All 3 freezes used → no more allowed
  // ══════════════════════════════════════════════
  log('TC20: All freeze slots consumed (even cancelled) → blocked');

  // Schedule 3rd freeze
  const f3 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 30)),
    freezeDays: 5,
  });
  check(f3.status === 201, `Freeze 3 scheduled`);

  m = await prisma.membership.findUnique({ where: { id: membership.id } });
  check(m.totalFreezeCountUsed === 3, `All ${plan.maxFreezeCount} slots used: ${m.totalFreezeCountUsed}`);

  // Try 4th freeze — should fail
  const f4 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 45)),
    freezeDays: 1,
  });
  check(f4.status === 400, `4th freeze rejected: ${f4.status}`);
  check(f4.data.error?.includes('limit'), `Error: "${f4.data.error}"`);

  // Cancel 3rd and try again — should STILL fail
  await api('POST', `/cancel/${f3.data.freeze?.id}`, token);
  const f5 = await api('POST', `/${membership.id}/freeze`, token, {
    startDate: fmtISO(addDays(now, 45)),
    freezeDays: 1,
  });
  check(f5.status === 400, `After cancel, still blocked: ${f5.status} (count never returned)`);

  // ══════════════════════════════════════════════
  // TC21: Without auth token — rejected
  // ══════════════════════════════════════════════
  log('TC21: No Auth Token — Rejected');
  const tc21 = await api('POST', `/${membership.id}/freeze`, null, {
    startDate: fmtISO(addDays(now, 5)),
    freezeDays: 3,
  });
  check(tc21.status === 401 || tc21.status === 403, `No token rejected: ${tc21.status}`);

  // ══════════════════════════════════════════════
  // CLEANUP
  // ══════════════════════════════════════════════
  log('CLEANUP');
  await prisma.membershipFreeze.deleteMany({ where: { membershipId: membership.id } });
  await prisma.membership.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.gymPlan.deleteMany({ where: { planId: plan.id } });
  await prisma.plan.delete({ where: { id: plan.id } });
  console.log('  Test data cleaned up.');

  // ══════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  🏁 RESULTS: ${passed} passed, ${failed} failed (total: ${passed + failed})`);
  console.log('═'.repeat(60));

  if (failed > 0) {
    console.log('\n  ⚠️  Some tests failed! Check above for ❌ FAIL markers.\n');
    process.exit(1);
  } else {
    console.log('\n  🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  }
}

main()
  .catch(err => { console.error('❌ Test suite crashed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
