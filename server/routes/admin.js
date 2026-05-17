/**
 * server/routes/admin.js
 * Admin-only routes:
 *   POST /api/admin/import   — bulk import historical attendance + feedback
 *   POST /api/admin/retrain  — trigger ML pipeline retrain
 *   GET  /api/admin/stats    — live dashboard stats
 */
const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/admin/stats
 * Returns live counts for dashboard KPI cards.
 * Accessible to all authenticated users (pastor, admin, usher).
 */
router.get('/stats', async (req, res) => {
  const [groupCount, alertCount, feedback] = await Promise.all([
    prisma.group.count(),
    prisma.alert.count({ where: { acknowledged: false } }),
    prisma.feedback.aggregate({ _avg: { avgRating: true } })
  ]);
  
  const avgSentiment = feedback._avg.avgRating || 0;
  
  // Calculate total members dynamically
  const groups = await prisma.group.findMany();
  let totalMembers = 0;
  await Promise.all(groups.map(async (g) => {
    const lastAtt = await prisma.attendance.findFirst({
      where: { groupId: g.id },
      orderBy: { sessionDate: 'desc' }
    });
    if (lastAtt) {
      totalMembers += lastAtt.headcount;
    }
  }));

  res.json({ 
    memberCount: totalMembers, 
    groupCount, 
    activeAlerts: alertCount,
    avgSentiment: avgSentiment.toFixed(1)
  });
});

/**
 * GET /api/admin/recent?limit=4
 * Returns the most recent attendance records across all groups (for dashboard activity feed).
 */
router.get('/recent', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 4, 20);
  const records = await prisma.attendance.findMany({
    orderBy: { recordedAt: 'desc' },
    take: limit,
    include: { group: { select: { name: true } } },
  });
  res.json(records);
});

/**
 * POST /api/admin/import
 * Body: { groupId, rows: [{ sessionDate, headcount, rsvpCount, avgRating, responseCount }] }
 * Bulk-upserts attendance + feedback rows then triggers ML retrain.
 */
router.post('/import', requireRole(['admin']), async (req, res) => {
  const { groupId, rows } = req.body;
  if (!groupId || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'groupId and rows[] are required' });
  }

  // Validate group exists
  const group = await prisma.group.findUnique({ where: { id: parseInt(groupId) } });
  if (!group) return res.status(404).json({ error: `Group ${groupId} not found` });

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (const row of rows) {
    const sessionDate = new Date(row.sessionDate);
    if (isNaN(sessionDate.getTime())) { errors.push(`Invalid date: ${row.sessionDate}`); continue; }

    try {
      // Upsert attendance
      await prisma.attendance.upsert({
        where: { groupId_sessionDate: { groupId: parseInt(groupId), sessionDate } },
        create: {
          groupId: parseInt(groupId),
          sessionDate,
          headcount: parseInt(row.headcount) || 0,
          rsvpCount: parseInt(row.rsvpCount) || 0,
        },
        update: {
          headcount: parseInt(row.headcount) || 0,
          rsvpCount: parseInt(row.rsvpCount) || 0,
        },
      });

      // Upsert feedback if provided
      if (row.avgRating != null) {
        await prisma.feedback.upsert({
          where: { groupId_sessionDate: { groupId: parseInt(groupId), sessionDate } },
          create: {
            groupId: parseInt(groupId),
            sessionDate,
            avgRating: parseFloat(row.avgRating),
            responseCount: parseInt(row.responseCount) || 1,
          },
          update: {
            avgRating: parseFloat(row.avgRating),
            responseCount: parseInt(row.responseCount) || 1,
          },
        });
      }
      imported++;
    } catch (e) {
      skipped++;
      errors.push(`Row ${row.sessionDate}: ${e.message}`);
    }
  }

  // Kick off background retrain
  axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/retrain`)
    .catch(err => console.error('Retrain trigger failed:', err.message));

  res.json({ imported, skipped, errors: errors.slice(0, 10), message: 'Import complete. ML retrain triggered.' });
});

/**
 * POST /api/admin/retrain
 * Manually trigger the ML pipeline retrain.
 */
router.post('/retrain', requireRole(['admin']), async (req, res) => {
  try {
    await axios.post(`${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/retrain`);
    res.json({ status: 'Retrain triggered successfully', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(502).json({ error: 'Could not reach ML service', detail: err.message });
  }
});

module.exports = router;
