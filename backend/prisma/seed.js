const { PrismaClient } = require('@prisma/client');
const { addDays, addHours, setHours, setMinutes, startOfDay } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.bookingAnswer.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customQuestion.deleteMany();
  await prisma.dateOverride.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.availabilitySchedule.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.user.deleteMany();

  // Create user
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      username: 'johndoe',
      timezone: 'Asia/Kolkata',
    },
  });
  console.log('✅ Created user:', user.name);

  // Create event types
  const eventTypes = await Promise.all([
    prisma.eventType.create({
      data: {
        userId: user.id,
        title: '30 Min Meeting',
        slug: '30-min-meeting',
        description: 'A quick 30-minute meeting to discuss anything.',
        durationMinutes: 30,
        locationType: 'google_meet',
        color: '#2563eb',
        position: 1,
      },
    }),
    prisma.eventType.create({
      data: {
        userId: user.id,
        title: '60 Min Consultation',
        slug: '60-min-consultation',
        description: 'A full hour consultation for in-depth discussions.',
        durationMinutes: 60,
        locationType: 'zoom',
        color: '#7c3aed',
        bufferBefore: 5,
        bufferAfter: 10,
        position: 2,
      },
    }),
    prisma.eventType.create({
      data: {
        userId: user.id,
        title: '15 Min Quick Chat',
        slug: '15-min-quick-chat',
        description: 'A brief 15-minute introductory call.',
        durationMinutes: 15,
        locationType: 'phone',
        color: '#059669',
        position: 3,
      },
    }),
  ]);
  console.log('✅ Created', eventTypes.length, 'event types');

  // Create availability schedule with Mon-Fri 9:00-17:00
  const schedule = await prisma.availabilitySchedule.create({
    data: {
      userId: user.id,
      name: 'Working Hours',
      timezone: 'Asia/Kolkata',
      isDefault: true,
      rules: {
        create: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' }, // Friday
        ],
      },
    },
  });
  console.log('✅ Created availability schedule');

  // Create sample bookings
  const now = new Date();
  const timezone = 'Asia/Kolkata';

  // Helper: create a time in IST, store as UTC
  function makeTime(daysFromNow, hour, minute = 0) {
    const date = addDays(startOfDay(now), daysFromNow);
    const local = setMinutes(setHours(date, hour), minute);
    return fromZonedTime(local, timezone);
  }

  const bookings = await Promise.all([
    // Upcoming booking 1
    prisma.booking.create({
      data: {
        eventTypeId: eventTypes[0].id,
        bookerName: 'Alice Smith',
        bookerEmail: 'alice@example.com',
        bookerNotes: 'Want to discuss the new project timeline.',
        startTime: makeTime(1, 10, 0),
        endTime: makeTime(1, 10, 30),
        timezone: 'Asia/Kolkata',
        status: 'confirmed',
      },
    }),
    // Upcoming booking 2
    prisma.booking.create({
      data: {
        eventTypeId: eventTypes[1].id,
        bookerName: 'Bob Wilson',
        bookerEmail: 'bob@example.com',
        bookerNotes: 'Technical architecture review.',
        startTime: makeTime(2, 14, 0),
        endTime: makeTime(2, 15, 0),
        timezone: 'America/New_York',
        status: 'confirmed',
      },
    }),
    // Upcoming booking 3
    prisma.booking.create({
      data: {
        eventTypeId: eventTypes[2].id,
        bookerName: 'Carol Johnson',
        bookerEmail: 'carol@example.com',
        startTime: makeTime(3, 11, 0),
        endTime: makeTime(3, 11, 15),
        timezone: 'Europe/London',
        status: 'confirmed',
      },
    }),
    // Past booking
    prisma.booking.create({
      data: {
        eventTypeId: eventTypes[0].id,
        bookerName: 'Dave Brown',
        bookerEmail: 'dave@example.com',
        bookerNotes: 'Follow-up on Q3 goals.',
        startTime: makeTime(-3, 10, 0),
        endTime: makeTime(-3, 10, 30),
        timezone: 'Asia/Kolkata',
        status: 'confirmed',
      },
    }),
    // Cancelled booking
    prisma.booking.create({
      data: {
        eventTypeId: eventTypes[0].id,
        bookerName: 'Eve Davis',
        bookerEmail: 'eve@example.com',
        startTime: makeTime(4, 15, 0),
        endTime: makeTime(4, 15, 30),
        timezone: 'Asia/Kolkata',
        status: 'cancelled',
        cancelReason: 'Schedule conflict - need to reschedule',
      },
    }),
  ]);
  console.log('✅ Created', bookings.length, 'sample bookings');

  // Create a custom question for the consultation event
  await prisma.customQuestion.create({
    data: {
      eventTypeId: eventTypes[1].id,
      label: 'What topic would you like to discuss?',
      type: 'textarea',
      isRequired: true,
      position: 1,
    },
  });
  console.log('✅ Created custom question');

  console.log('\n🎯 Seeding complete!');
  console.log('   Public booking URL: http://localhost:3000/johndoe/30-min-meeting');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
