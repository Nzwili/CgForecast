const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// POST /api/feedback — aggregate-only, no individual text stored
router.post('/', requireRole(['member', 'usher', 'admin']), async (req, res) => {
  const { groupId, sessionDate, avgRating, responseCount } = req.body;
  if (!groupId || !sessionDate || avgRating == null || responseCount == null) {
    return res.status(400).json({ error: 'groupId, sessionDate, avgRating, responseCount are required' });
  }
  if (avgRating < 1 || avgRating > 5) {
    return res.status(400).json({ error: 'avgRating must be between 1 and 5' });
  }
  const record = await prisma.feedback.create({
    data: {
      groupId: parseInt(groupId),
      sessionDate: new Date(sessionDate),
      avgRating: parseFloat(avgRating),
      responseCount: parseInt(responseCount)
    }
  });

  // Trigger ML retrain in the background asynchronously
  const axios = require('axios');
  axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/retrain`)
    .catch(err => console.error('Failed to trigger ML retrain:', err.message));

  res.status(201).json(record);
});

// GET /api/feedback/:groupId
router.get('/:groupId', requireRole(['pastor', 'admin', 'analyst']), async (req, res) => {
  const records = await prisma.feedback.findMany({
    where: { groupId: parseInt(req.params.groupId) },
    orderBy: { sessionDate: 'asc' }
  });
  res.json(records);
});

module.exports = router;
