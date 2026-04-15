const { PrismaClient } = require('@prisma/client');
const { sendCancellationNotice, sendRescheduleNotice } = require('../utils/email');
const prisma = new PrismaClient();

// GET /api/bookings
async function getAll(req, res) {
  try {
    const { status, timeframe } = req.query;
    const now = new Date();

    let where = {};
    
    if (status) {
      where.status = status;
    }

    if (timeframe === 'upcoming') {
      where.startTime = { gte: now };
      where.status = 'confirmed';
    } else if (timeframe === 'past') {
      where.startTime = { lt: now };
      where.status = 'confirmed';
    } else if (timeframe === 'cancelled') {
      where.status = 'cancelled';
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        eventType: {
          include: {
            user: { select: { name: true, username: true, email: true } },
          },
        },
        answers: {
          include: { question: true },
        },
      },
      orderBy: { startTime: timeframe === 'past' ? 'desc' : 'asc' },
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// GET /api/bookings/:uid
async function getByUid(req, res) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { uid: req.params.uid },
      include: {
        eventType: {
          include: {
            user: { select: { name: true, username: true, email: true, timezone: true } },
          },
        },
        answers: {
          include: { question: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

// PATCH /api/bookings/:uid/cancel
async function cancel(req, res) {
  try {
    const { cancelReason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { uid: req.params.uid },
      include: {
        eventType: {
          include: { user: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    const updated = await prisma.booking.update({
      where: { uid: req.params.uid },
      data: {
        status: 'cancelled',
        cancelReason: cancelReason || null,
      },
      include: {
        eventType: {
          include: { user: { select: { name: true, username: true, email: true } } },
        },
      },
    });

    // Send cancellation email
    await sendCancellationNotice(updated, updated.eventType, updated.eventType.user);

    res.json(updated);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
}

// PATCH /api/bookings/:uid/reschedule
async function reschedule(req, res) {
  try {
    const { startTime, endTime, timezone } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { uid: req.params.uid },
      include: {
        eventType: {
          include: { user: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot reschedule a cancelled booking' });
    }

    const oldTime = `${booking.startTime} - ${booking.endTime}`;

    const updated = await prisma.booking.update({
      where: { uid: req.params.uid },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        timezone: timezone || booking.timezone,
        status: 'confirmed',
      },
      include: {
        eventType: {
          include: { user: { select: { name: true, username: true, email: true } } },
        },
      },
    });

    // Send reschedule email
    await sendRescheduleNotice(updated, updated.eventType, updated.eventType.user, oldTime);

    res.json(updated);
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ error: 'Failed to reschedule booking' });
  }
}

module.exports = { getAll, getByUid, cancel, reschedule };
