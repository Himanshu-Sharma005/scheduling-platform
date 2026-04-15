const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/users/me
async function getMe(req, res) {
  try {
    const user = await prisma.user.findFirst({
      include: {
        eventTypes: { orderBy: { position: 'asc' } },
        availabilitySchedules: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'No user found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

// PUT /api/users/me
async function updateMe(req, res) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(404).json({ error: 'No user found' });
    }

    const { name, email, username, timezone, avatarUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(username && { username }),
        ...(timezone && { timezone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

module.exports = { getMe, updateMe };
