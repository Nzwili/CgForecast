const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/groups — list all groups
router.get('/', async (req, res) => {
  const groups = await prisma.group.findMany({
    include: { leader: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' }
  });
  
  const enriched = await Promise.all(groups.map(async (g) => {
    // Get last two attendances
    const atts = await prisma.attendance.findMany({
      where: { groupId: g.id },
      orderBy: { sessionDate: 'desc' },
      take: 2
    });
    
    let memberCount = 0;
    let trend = '+0%';
    let status = 'active';

    if (atts.length > 0) {
      memberCount = atts[0].headcount;
      if (atts.length > 1) {
        const prev = atts[1].headcount;
        if (prev > 0) {
          const diff = memberCount - prev;
          const pct = Math.round((diff / prev) * 100);
          trend = (pct >= 0 ? '+' : '') + pct + '%';
        }
      }
    }
    
    // Check alerts for status
    const alerts = await prisma.alert.findMany({
      where: { groupId: g.id, acknowledged: false },
      orderBy: { createdAt: 'desc' }
    });
    
    if (alerts.length > 0) {
      const activeAlert = alerts[0];
      if (activeAlert.alertType === 'drop') {
        status = activeAlert.severity === 'critical' || activeAlert.message.includes('critical') || activeAlert.message.includes('drop') ? 'alert' : 'warning';
      }
    } else {
       // if trend is heavily negative, mark as warning
       if (trend.startsWith('-') && parseInt(trend.slice(1, -1)) > 5) {
         status = 'warning';
       }
    }

    return {
      ...g,
      memberCount,
      trend,
      status
    };
  }));

  res.json(enriched);
});

// POST /api/groups — create group (admin only)
router.post('/', requireRole(['admin']), async (req, res) => {
  const { name, category, leader, leaderId } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required' });
  }

  let finalLeaderId = leaderId;
  if (!finalLeaderId && leader) {
    let user = await prisma.user.findFirst({ where: { name: leader } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: leader,
          email: leader.toLowerCase().replace(/\s+/g, '.') + '@church.org',
          passwordHash: 'dummy',
          role: 'usher'
        }
      });
    }
    finalLeaderId = user.id;
  }

  if (!finalLeaderId) {
    return res.status(400).json({ error: 'leaderId or leader name is required' });
  }

  const group = await prisma.group.create({ data: { name, category, leaderId: finalLeaderId } });
  res.status(201).json(group);
});

// GET /api/groups/:id
router.get('/:id', async (req, res) => {
  const group = await prisma.group.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { leader: { select: { id: true, name: true } } }
  });
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json(group);
});

module.exports = router;
