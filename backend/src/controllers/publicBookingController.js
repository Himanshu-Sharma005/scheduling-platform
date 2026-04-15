const { PrismaClient } = require('@prisma/client');
const { generateSlots } = require('../utils/slots');
const { sendBookingConfirmation } = require('../utils/email');
const { addMinutes } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');
const prisma = new PrismaClient();

// GET /api/public/:username – Get user profile with active event types
async function getUserProfile(req, res) {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        timezone: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const eventTypes = await prisma.eventType.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        durationMinutes: true,
        locationType: true,
        color: true,
      },
    });

    res.json({ user, eventTypes });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}

// GET /api/public/:username/:slug – Get event type info
async function getEventInfo(req, res) {
  try {
    const { username, slug } = req.params;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id, slug, isActive: true },
      include: {
        customQuestions: { orderBy: { position: 'asc' } },
        user: { select: { name: true, username: true, timezone: true, avatarUrl: true } },
      },
    });

    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    res.json(eventType);
  } catch (error) {
    console.error('Error fetching event info:', error);
    res.status(500).json({ error: 'Failed to fetch event info' });
  }
}

// GET /api/public/:username/:slug/slots?date=YYYY-MM-DD&timezone=...
async function getSlots(req, res) {
  try {
    const { username, slug } = req.params;
    const { date, timezone } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id, slug, isActive: true },
    });
    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    // Get the default availability schedule
    let schedule = await prisma.availabilitySchedule.findFirst({
      where: { userId: user.id, isDefault: true },
      include: {
        rules: true,
        dateOverrides: true,
      },
    });

    // Fallback to any schedule
    if (!schedule) {
      schedule = await prisma.availabilitySchedule.findFirst({
        where: { userId: user.id },
        include: {
          rules: true,
          dateOverrides: true,
        },
      });
    }

    if (!schedule) {
      return res.json({ slots: [] });
    }

    // Get existing confirmed bookings for this event type on the given date
    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd = new Date(`${date}T23:59:59`);
    
    // Convert date range to UTC for querying
    const utcStart = fromZonedTime(dateStart, schedule.timezone);
    const utcEnd = fromZonedTime(dateEnd, schedule.timezone);

    const existingBookings = await prisma.booking.findMany({
      where: {
        eventTypeId: eventType.id,
        status: 'confirmed',
        startTime: { gte: utcStart },
        endTime: { lte: utcEnd },
      },
    });

    const slots = generateSlots(
      date,
      schedule.rules,
      schedule.dateOverrides,
      existingBookings,
      eventType.durationMinutes,
      eventType.bufferBefore,
      eventType.bufferAfter,
      schedule.timezone
    );

    res.json({ date, slots, timezone: schedule.timezone });
  } catch (error) {
    console.error('Error generating slots:', error);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
}

// POST /api/public/:username/:slug/book
async function createBooking(req, res) {
  try {
    const { username, slug } = req.params;
    const { bookerName, bookerEmail, bookerNotes, startTime, timezone, answers } = req.body;

    if (!bookerName || !bookerEmail || !startTime) {
      return res.status(400).json({ error: 'Name, email, and start time are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id, slug, isActive: true },
    });
    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found or inactive' });
    }

    // Calculate end time
    const start = new Date(startTime);
    const end = addMinutes(start, eventType.durationMinutes);

    // Check for double bookings
    const conflicting = await prisma.booking.findFirst({
      where: {
        eventTypeId: eventType.id,
        status: 'confirmed',
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } },
        ],
      },
    });

    if (conflicting) {
      return res.status(409).json({ error: 'This time slot is no longer available' });
    }

    // Create booking with answers
    const booking = await prisma.booking.create({
      data: {
        eventTypeId: eventType.id,
        bookerName,
        bookerEmail,
        bookerNotes: bookerNotes || null,
        startTime: start,
        endTime: end,
        timezone: timezone || 'Asia/Kolkata',
        answers: answers ? {
          create: answers.map(a => ({
            questionId: a.questionId,
            answer: a.answer,
          })),
        } : undefined,
      },
      include: {
        eventType: {
          include: { user: { select: { name: true, email: true, username: true } } },
        },
        answers: { include: { question: true } },
      },
    });

    // Send confirmation email
    await sendBookingConfirmation(booking, booking.eventType, booking.eventType.user);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
}

module.exports = { getUserProfile, getEventInfo, getSlots, createBooking };
