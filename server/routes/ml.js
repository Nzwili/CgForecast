const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// POST /api/ml/train-all — run pipeline + training synchronously via child process
router.post('/train-all', requireRole(['admin', 'pastor', 'analyst']), async (req, res) => {
  try {
    const groupCount = await prisma.group.count();
    const { exec } = require('child_process');
    const path = require('path');
    const mlDir = path.resolve(__dirname, '../../../ml');
    await new Promise((resolve, reject) => {
      exec('python pipeline.py && python train.py', { cwd: mlDir }, (error, stdout, stderr) => {
        if (error) { console.error(`exec error: ${error}`); reject(error); }
        else { resolve(stdout); }
      });
    });
    res.json({ success: true, groups_trained: groupCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ml/accuracy — per-group SVR model metrics from stored .pkl bundles
router.get('/accuracy', requireRole(['admin', 'pastor', 'analyst']), async (req, res) => {
  try {
    const mlRes = await axios.get(
      `${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/accuracy`
    );
    // Enrich groupId → groupName using the DB
    const dbGroups = await prisma.group.findMany({ select: { id: true, name: true } });
    const nameMap = {};
    dbGroups.forEach(g => { nameMap[g.id] = g.name; });
    const enriched = (mlRes.data.groups || []).map(g => ({
      ...g,
      groupName: nameMap[g.groupId] || `Group ${g.groupId}`,
    }));
    res.json({ groups: enriched, overallMae: mlRes.data.overallMae });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.json({ groups: [], overallMae: null, error: 'ML service offline' });
    }
    res.status(502).json({ error: 'Could not fetch accuracy metrics', detail: err.message });
  }
});

module.exports = router;
