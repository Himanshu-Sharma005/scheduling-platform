const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/availability
async function getAll(req, res) {
  try {
    const user = await prisma.user.findFirst();
    const schedules = await prisma.availabilitySchedule.findMany({
      where: { userId: user.id },
      include: {
        rules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        dateOverrides: { orderBy: { date: 'asc' } },
      },
    });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability schedules' });
  }
}

// GET /api/availability/:id
async function getById(req, res) {
  try {
    const schedule = await prisma.availabilitySchedule.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        rules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        dateOverrides: { orderBy: { date: 'asc' } },
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
}

// POST /api/availability
async function create(req, res) {
  try {
    const user = await prisma.user.findFirst();
    const { name, timezone, isDefault, rules } = req.body;

    // If setting as default, un-default others
    if (isDefault) {
      await prisma.availabilitySchedule.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const schedule = await prisma.availabilitySchedule.create({
      data: {
        userId: user.id,
        name: name || 'Working Hours',
        timezone: timezone || 'Asia/Kolkata',
        isDefault: isDefault || false,
        rules: rules ? {
          create: rules.map(r => ({
            dayOfWeek: r.dayOfWeek,
            startTime: r.startTime,
            endTime: r.endTime,
          })),
        } : undefined,
      },
      include: {
        rules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        dateOverrides: true,
      },
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
}

// PUT /api/availability/:id
async function update(req, res) {
  try {
    const { name, timezone, isDefault, rules } = req.body;
    const scheduleId = parseInt(req.params.id);

    // If setting as default, un-default others
    if (isDefault) {
      const schedule = await prisma.availabilitySchedule.findUnique({ where: { id: scheduleId } });
      if (schedule) {
        await prisma.availabilitySchedule.updateMany({
          where: { userId: schedule.userId, NOT: { id: scheduleId } },
          data: { isDefault: false },
        });
      }
    }

    // Update schedule info
    const updated = await prisma.availabilitySchedule.update({
      where: { id: scheduleId },
      data: {
        ...(name !== undefined && { name }),
        ...(timezone !== undefined && { timezone }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    // Replace rules if provided
    if (rules) {
      await prisma.availabilityRule.deleteMany({ where: { scheduleId } });
      await prisma.availabilityRule.createMany({
        data: rules.map(r => ({
          scheduleId,
          dayOfWeek: r.dayOfWeek,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      });
    }

    // Fetch updated schedule with rules
    const result = await prisma.availabilitySchedule.findUnique({
      where: { id: scheduleId },
      include: {
        rules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
        dateOverrides: { orderBy: { date: 'asc' } },
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
}

// DELETE /api/availability/:id
async function remove(req, res) {
  try {
    await prisma.availabilitySchedule.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Schedule deleted' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
}

// POST /api/availability/:id/overrides
async function addOverride(req, res) {
  try {
    const scheduleId = parseInt(req.params.id);
    const { date, isBlocked, startTime, endTime } = req.body;

    const override = await prisma.dateOverride.create({
      data: {
        scheduleId,
        date: new Date(date),
        isBlocked: isBlocked || false,
        startTime: startTime || null,
        endTime: endTime || null,
      },
    });

    res.status(201).json(override);
  } catch (error) {
    console.error('Error adding override:', error);
    res.status(500).json({ error: 'Failed to add date override' });
  }
}

// DELETE /api/availability/overrides/:id
async function removeOverride(req, res) {
  try {
    await prisma.dateOverride.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Override deleted' });
  } catch (error) {
    console.error('Error deleting override:', error);
    res.status(500).json({ error: 'Failed to delete override' });
  }
}

module.exports = { getAll, getById, create, update, remove, addOverride, removeOverride };
