const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/alerts — list all unacknowledged alerts (pastor/admin/analyst)
router.get('/', requireRole(['pastor', 'admin', 'analyst']), async (req, res) => {
  const { groupId, all } = req.query;
  const where = {};
  if (groupId) where.groupId = parseInt(groupId);
  if (req.query.status === 'active') where.acknowledged = false;

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      forecast: { select: { predictedHeadcount: true, confidenceLower: true, confidenceUpper: true } }
    }
  });
  res.json(alerts);
});

// PATCH /api/alerts/:id/acknowledge — dismiss an alert
router.patch('/:id/acknowledge', requireRole(['pastor', 'admin', 'analyst']), async (req, res) => {
  const alert = await prisma.alert.update({
    where: { id: parseInt(req.params.id) },
    data: { acknowledged: true }
  });
  res.json(alert);
});

module.exports = router;
