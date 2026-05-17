/**
 * server/routes/church.js
 * Church profile management — stores demographic data for sampled churches.
 *   GET  /api/church/profile  — fetch current admin's church profile
 *   POST /api/church/profile  — create or update church profile
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/church/profile
router.get('/profile', async (req, res) => {
  try {
    const profile = await prisma.churchProfile.findUnique({
      where: { userId: req.user.id }
    });
    res.json(profile || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/church/profile — upsert
router.post('/profile', async (req, res) => {
  const { churchName, activeMembership, location, yearsOfRecords, techStack } = req.body;
  if (!churchName) return res.status(400).json({ error: 'churchName is required' });

  try {
    const techStackStr = Array.isArray(techStack) ? techStack.join(',') : (techStack || null);
    const profile = await prisma.churchProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        churchName,
        activeMembership: activeMembership ? parseInt(activeMembership) : null,
        location: location || null,
        yearsOfRecords: yearsOfRecords || null,
        techStack: techStackStr,
      },
      update: {
        churchName,
        activeMembership: activeMembership ? parseInt(activeMembership) : null,
        location: location || null,
        yearsOfRecords: yearsOfRecords || null,
        techStack: techStackStr,
      },
    });
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
