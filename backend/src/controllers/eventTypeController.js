const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/event-types
async function getAll(req, res) {
  try {
    const user = await prisma.user.findFirst();
    const eventTypes = await prisma.eventType.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { bookings: true } },
        user: { select: { username: true, name: true } },
      },
    });
    res.json(eventTypes);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
}

// GET /api/event-types/:id
async function getById(req, res) {
  try {
    const eventType = await prisma.eventType.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customQuestions: { orderBy: { position: 'asc' } },
        user: { select: { username: true, name: true } },
      },
    });

    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    res.json(eventType);
  } catch (error) {
    console.error('Error fetching event type:', error);
    res.status(500).json({ error: 'Failed to fetch event type' });
  }
}

// POST /api/event-types
async function create(req, res) {
  try {
    const user = await prisma.user.findFirst();
    const { title, slug, description, durationMinutes, locationType, color, bufferBefore, bufferAfter } = req.body;

    // Auto-generate slug from title if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check for duplicate slug
    const existing = await prisma.eventType.findFirst({
      where: { userId: user.id, slug: finalSlug },
    });

    if (existing) {
      return res.status(400).json({ error: 'An event type with this URL already exists' });
    }

    // Get max position
    const maxPos = await prisma.eventType.aggregate({
      where: { userId: user.id },
      _max: { position: true },
    });

    const eventType = await prisma.eventType.create({
      data: {
        userId: user.id,
        title,
        slug: finalSlug,
        description: description || null,
        durationMinutes: durationMinutes || 30,
        locationType: locationType || 'google_meet',
        color: color || '#2563eb',
        bufferBefore: bufferBefore || 0,
        bufferAfter: bufferAfter || 0,
        position: (maxPos._max.position || 0) + 1,
      },
      include: {
        user: { select: { username: true, name: true } },
      },
    });

    res.status(201).json(eventType);
  } catch (error) {
    console.error('Error creating event type:', error);
    res.status(500).json({ error: 'Failed to create event type' });
  }
}

// PUT /api/event-types/:id
async function update(req, res) {
  try {
    const { title, slug, description, durationMinutes, locationType, color, bufferBefore, bufferAfter, isActive, position, customQuestions } = req.body;

    const updateData = {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(description !== undefined && { description }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(locationType !== undefined && { locationType }),
      ...(color !== undefined && { color }),
      ...(bufferBefore !== undefined && { bufferBefore }),
      ...(bufferAfter !== undefined && { bufferAfter }),
      ...(isActive !== undefined && { isActive }),
      ...(position !== undefined && { position }),
    };

    if (customQuestions) {
      updateData.customQuestions = {
        deleteMany: {
          id: {
            notIn: customQuestions.filter(q => q.id).map(q => q.id)
          }
        },
        create: customQuestions.filter(q => !q.id).map(q => ({
          label: q.label,
          type: q.type,
          isRequired: q.isRequired,
          options: q.options || null,
          position: q.position || 0
        })),
        update: customQuestions.filter(q => q.id).map(q => ({
          where: { id: q.id },
          data: {
            label: q.label,
            type: q.type,
            isRequired: q.isRequired,
            options: q.options || null,
            position: q.position || 0
          }
        }))
      };
    }

    const eventType = await prisma.eventType.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: {
        customQuestions: { orderBy: { position: 'asc' } },
        user: { select: { username: true, name: true } },
      },
    });

    res.json(eventType);
  } catch (error) {
    console.error('Error updating event type:', error);
    res.status(500).json({ error: 'Failed to update event type' });
  }
}

// DELETE /api/event-types/:id
async function remove(req, res) {
  try {
    await prisma.eventType.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Event type deleted' });
  } catch (error) {
    console.error('Error deleting event type:', error);
    res.status(500).json({ error: 'Failed to delete event type' });
  }
}

// PATCH /api/event-types/:id/toggle
async function toggle(req, res) {
  try {
    const eventType = await prisma.eventType.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!eventType) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    const updated = await prisma.eventType.update({
      where: { id: eventType.id },
      data: { isActive: !eventType.isActive },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error toggling event type:', error);
    res.status(500).json({ error: 'Failed to toggle event type' });
  }
}

module.exports = { getAll, getById, create, update, remove, toggle };
