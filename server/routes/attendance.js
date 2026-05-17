const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// POST /api/attendance
router.post('/', requireRole(['usher', 'admin']), async (req, res) => {
  const { groupId, sessionDate, headcount, rsvpCount, overwrite } = req.body;
  if (!groupId || !sessionDate || headcount == null) {
    return res.status(400).json({ error: 'groupId, sessionDate, and headcount are required' });
  }
  try {
    let record;
    if (overwrite) {
      record = await prisma.attendance.upsert({
        where: { groupId_sessionDate: { groupId: parseInt(groupId), sessionDate: new Date(sessionDate) } },
        update: { headcount: parseInt(headcount), rsvpCount: rsvpCount ? parseInt(rsvpCount) : 0 },
        create: { groupId: parseInt(groupId), sessionDate: new Date(sessionDate), headcount: parseInt(headcount), rsvpCount: rsvpCount ? parseInt(rsvpCount) : 0 }
      });
    } else {
      record = await prisma.attendance.create({
        data: {
          groupId: parseInt(groupId),
          sessionDate: new Date(sessionDate),
          headcount: parseInt(headcount),
          rsvpCount: rsvpCount ? parseInt(rsvpCount) : 0
        }
      });
    }

    // Trigger ML retrain in the background asynchronously
    const axios = require('axios');
    axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/retrain`)
      .catch(err => console.error('Failed to trigger ML retrain:', err.message));

    res.status(201).json(record);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Duplicate record for this date' });
    throw e;
  }
});

// GET /api/attendance/:groupId — history for a group
router.get('/:groupId', requireRole(['usher', 'pastor', 'admin', 'analyst']), async (req, res) => {
  const records = await prisma.attendance.findMany({
    where: { groupId: parseInt(req.params.groupId) },
    orderBy: { sessionDate: 'asc' }
  });
  res.json(records);
});

module.exports = router;
