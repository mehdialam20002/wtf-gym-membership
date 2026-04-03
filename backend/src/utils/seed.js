require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const AMENITIES_STANDARD = ['Parking', 'Showers', 'Lockers', 'Changing Rooms', 'CCTV', 'Sanitizers', 'Shoe Racks'];
const AMENITIES_PREMIUM  = [...AMENITIES_STANDARD, 'Free WiFi', 'Sauna', 'Steam Room', 'Cafeteria', 'AC'];
const AMENITIES_BASIC    = ['Parking', 'Lockers', 'CCTV', 'Sanitizers', 'Changing Rooms'];

const gyms = [
  {
    name: 'WTF Sector 18, Noida',
    slug: 'wtf-sector-18-noida',
    area: 'Sector 18', city: 'Noida',
    address: 'Plot A-22, Sector 18, Noida, Uttar Pradesh 201301',
    phone: '+91 98100 11001', hours: '05:30 AM - 11:00 PM',
    rating: 4.9, totalSeats: 40, seatsLeft: 8, amenities: AMENITIES_PREMIUM,
  },
  {
    name: 'WTF Connaught Place, Delhi',
    slug: 'wtf-connaught-place-delhi',
    area: 'Connaught Place', city: 'New Delhi',
    address: 'N-12, Connaught Place, New Delhi 110001',
    phone: '+91 98100 22002', hours: '05:30 AM - 11:00 PM',
    rating: 4.8, totalSeats: 35, seatsLeft: 5, amenities: AMENITIES_PREMIUM,
  },
  {
    name: 'WTF Cyber City, Gurugram',
    slug: 'wtf-cyber-city-gurugram',
    area: 'Cyber City', city: 'Gurugram',
    address: 'Tower B, DLF Cyber City, Phase II, Gurugram 122002',
    phone: '+91 98100 33003', hours: '06:00 AM - 11:00 PM',
    rating: 4.9, totalSeats: 50, seatsLeft: 12, amenities: AMENITIES_PREMIUM,
  },
  {
    name: 'WTF Dwarka Sector 10, Delhi',
    slug: 'wtf-dwarka-sector-10-delhi',
    area: 'Dwarka Sector 10', city: 'New Delhi',
    address: 'Plot 5, Sector 10, Dwarka, New Delhi 110075',
    phone: '+91 98100 44004', hours: '06:00 AM - 10:30 PM',
    rating: 4.7, totalSeats: 30, seatsLeft: 10, amenities: AMENITIES_STANDARD,
  },
  {
    name: 'WTF Vasant Kunj, Delhi',
    slug: 'wtf-vasant-kunj-delhi',
    area: 'Vasant Kunj', city: 'New Delhi',
    address: 'C-3 DDA Market, Vasant Kunj, New Delhi 110070',
    phone: '+91 98100 55005', hours: '06:00 AM - 10:30 PM',
    rating: 4.8, totalSeats: 28, seatsLeft: 7, amenities: AMENITIES_STANDARD,
  },
  {
    name: 'WTF Indirapuram, Ghaziabad',
    slug: 'wtf-indirapuram-ghaziabad',
    area: 'Indirapuram', city: 'Ghaziabad',
    address: 'Shop 12, Shipra Sun City Mall, Indirapuram, Ghaziabad 201014',
    phone: '+91 98100 66006', hours: '06:00 AM - 10:00 PM',
    rating: 4.7, totalSeats: 32, seatsLeft: 14, amenities: AMENITIES_STANDARD,
  },
  {
    name: 'WTF Faridabad Sector 15',
    slug: 'wtf-faridabad-sector-15',
    area: 'Sector 15', city: 'Faridabad',
    address: 'SCO 45, Sector 15, Faridabad, Haryana 121007',
    phone: '+91 98100 77007', hours: '06:00 AM - 10:00 PM',
    rating: 4.6, totalSeats: 25, seatsLeft: 9, amenities: AMENITIES_BASIC,
  },
  {
    name: 'WTF Rohini Sector 9, Delhi',
    slug: 'wtf-rohini-sector-9-delhi',
    area: 'Rohini Sector 9', city: 'New Delhi',
    address: 'Block B, Pocket 7, Sector 9, Rohini, New Delhi 110085',
    phone: '+91 98100 88008', hours: '05:30 AM - 10:30 PM',
    rating: 4.7, totalSeats: 28, seatsLeft: 6, amenities: AMENITIES_STANDARD,
  },
  {
    name: 'WTF Lajpat Nagar, Delhi',
    slug: 'wtf-lajpat-nagar-delhi',
    area: 'Lajpat Nagar', city: 'New Delhi',
    address: 'Central Market, Lajpat Nagar II, New Delhi 110024',
    phone: '+91 98100 99009', hours: '06:00 AM - 10:30 PM',
    rating: 4.8, totalSeats: 30, seatsLeft: 11, amenities: AMENITIES_STANDARD,
  },
  {
    name: 'WTF Greater Noida West',
    slug: 'wtf-greater-noida-west',
    area: 'Greater Noida West', city: 'Greater Noida',
    address: 'Gaur City Mall, Greater Noida West, UP 201306',
    phone: '+91 98100 10010', hours: '06:00 AM - 10:00 PM',
    rating: 4.6, totalSeats: 35, seatsLeft: 18, amenities: AMENITIES_BASIC,
  },
];

const plans = [
  // ───── 30 DAYS (Monthly) ─────
  {
    name: 'WTF Starter', durationDays: 30, price: 1999,
    benefits: ['Full gym floor access', 'Locker room & showers', 'Basic equipment access', '1 Group class/week', 'Certified trainer on floor'],
  },
  {
    name: 'WTF Plus', durationDays: 30, price: 2499,
    benefits: ['All Starter benefits', 'Unlimited group classes', '1 PT session/month', 'Nutrition guidance', 'Sauna access', 'BCA body test'],
  },
  {
    name: 'WTF Ultra', durationDays: 30, price: 3499,
    benefits: ['All Plus benefits', '4 PT sessions/month', 'Priority class booking', '2 Guest passes/month', '20% supplement discount', 'Custom diet plan'],
  },

  // ───── 90 DAYS (Quarterly) ─────
  {
    name: 'WTF Starter', durationDays: 90, price: 4499, discountedPrice: 3999,
    deferred1Price: 4499, deferred1Label: '+15 days extension',
    deferred2Price: 3999, deferred2Label: '₹500 off',
    benefits: ['All Monthly Starter benefits', 'Save ₹500 vs monthly', '15-day extension option', 'Free fitness assessment'],
  },
  {
    name: 'WTF Plus', durationDays: 90, price: 5999, discountedPrice: 5499,
    deferred1Price: 5999, deferred1Label: '+15 days extension',
    deferred2Price: 5499, deferred2Label: '₹500 off',
    benefits: ['All Monthly Plus benefits', 'Save ₹1,500 vs monthly', 'Quarterly body analysis', '3 PT sessions total'],
  },
  {
    name: 'WTF Ultra', durationDays: 90, price: 7999, discountedPrice: 7499,
    deferred1Price: 7999, deferred1Label: '+20 days extension',
    deferred2Price: 7499, deferred2Label: '₹500 off',
    benefits: ['All Monthly Ultra benefits', 'Save ₹2,500 vs monthly', '20-day extension option', 'Quarterly body scan', '12 PT sessions total'],
  },

  // ───── 180 DAYS (Half-Yearly) ─────
  {
    name: 'WTF Starter', durationDays: 180, price: 6999, discountedPrice: 6499,
    deferred1Price: 6999, deferred1Label: '+Shaker & ₹250 Amazon Voucher',
    deferred2Price: 6999, deferred2Label: '+Freebies & 30 days extension',
    deferred3Price: 6499, deferred3Label: '₹500 off, no freebies',
    benefits: ['All Quarterly Starter benefits', 'FREE Shaker bottle', '₹250 Amazon voucher', '30-day extension option', 'Bi-monthly BCA test'],
  },
  {
    name: 'WTF Plus', durationDays: 180, price: 8999, discountedPrice: 8499,
    deferred1Price: 8999, deferred1Label: '+Shaker & ₹250 Amazon Voucher',
    deferred2Price: 8999, deferred2Label: '+Freebies & 30 days extension',
    deferred3Price: 8499, deferred3Label: '₹500 off, no freebies',
    benefits: ['All Quarterly Plus benefits', 'FREE Shaker bottle', '₹250 Amazon voucher', '8 PT sessions total', 'Nutrition consultation'],
  },
  {
    name: 'WTF Ultra', durationDays: 180, price: 12999, discountedPrice: 12499,
    deferred1Price: 12999, deferred1Label: '+Shaker & ₹250 Amazon Voucher',
    deferred2Price: 12999, deferred2Label: '+Freebies & 30 days extension',
    deferred3Price: 12499, deferred3Label: '₹500 off, no freebies',
    benefits: ['All Quarterly Ultra benefits', 'FREE Shaker bottle', '₹250 Amazon voucher', '24 PT sessions total', 'VIP lounge access', 'Transformation program'],
  },

  // ───── 365 DAYS (Annual) ─────
  {
    name: 'WTF Starter', durationDays: 365, price: 9999, discountedPrice: 9499,
    deferred1Price: 9999, deferred1Label: '+Gym Bag, Shaker & ₹500 Amazon',
    deferred2Price: 9999, deferred2Label: '+Freebies & 45 days extension',
    deferred3Price: 9499, deferred3Label: '₹500 off, no freebies',
    benefits: ['All Starter benefits', 'FREE Gym Bag + Shaker bottle', '₹500 Amazon voucher', '45-day extension option', 'Annual health checkup'],
  },
  {
    name: 'WTF Plus', durationDays: 365, price: 13999, discountedPrice: 13499,
    deferred1Price: 13999, deferred1Label: '+Gym Bag, Shaker & ₹500 Amazon',
    deferred2Price: 13999, deferred2Label: '+Freebies & 45 days extension',
    deferred3Price: 13499, deferred3Label: '₹500 off, no freebies',
    benefits: ['All Plus benefits year-round', 'FREE Gym Bag + Shaker bottle', '₹500 Amazon voucher', '12 PT sessions', 'Meal plan + diet tracking app', 'Priority booking always'],
  },
  {
    name: 'WTF Ultra', durationDays: 365, price: 19999, discountedPrice: 19499,
    deferred1Price: 19999, deferred1Label: '+Gym Bag, Shaker & ₹500 Amazon',
    deferred2Price: 19999, deferred2Label: '+Freebies & 45 days extension',
    deferred3Price: 19499, deferred3Label: '₹500 off, no freebies',
    benefits: ['All Ultra benefits year-round', 'FREE Gym Bag + Shaker bottle', '₹500 Amazon voucher', '48 PT sessions', 'Unlimited guest passes', 'Body transformation program', 'Dedicated personal coach'],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Admin
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.admin.upsert({
    where: { email: 'admin@wtfgyms.com' },
    update: {},
    create: { email: 'admin@wtfgyms.com', password: hashedPassword },
  });
  await prisma.admin.upsert({
    where: { email: 'admin@gym.com' },
    update: {},
    create: { email: 'admin@gym.com', password: hashedPassword },
  });
  console.log('✅ Admins created: admin@wtfgyms.com / admin123');

  // Clear existing data
  await prisma.gymPlan.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.plan.deleteMany();

  // Create gyms
  const createdGyms = [];
  for (const gym of gyms) {
    const g = await prisma.gym.create({ data: gym });
    createdGyms.push(g);
  }
  console.log(`✅ Created ${createdGyms.length} gyms`);

  // Create plans
  const createdPlans = [];
  for (const plan of plans) {
    const p = await prisma.plan.create({ data: plan });
    createdPlans.push(p);
  }
  console.log(`✅ Created ${createdPlans.length} plans`);

  // Assign all plans to all gyms
  for (const gym of createdGyms) {
    for (const plan of createdPlans) {
      await prisma.gymPlan.create({ data: { gymId: gym.id, planId: plan.id } });
    }
  }
  console.log(`✅ Assigned all plans to all ${createdGyms.length} gyms`);

  console.log('\n🎉 Seeding complete!');
  console.log('   Admin: admin@wtfgyms.com / admin123');
  console.log('   Gyms:', createdGyms.length);
  console.log('   Plans:', createdPlans.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
