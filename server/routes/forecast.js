const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/forecast?group=<id>&horizon=<weeks>
// OR /api/forecast?all=true (for audit log)
router.get('/', requireRole(['pastor', 'admin', 'analyst']), async (req, res) => {
  const { group, all, horizon = 4 } = req.query;

  if (all === 'true') {
    const history = await prisma.forecast.findMany({
      include: { group: { select: { name: true } }, alerts: true },
      orderBy: { generatedAt: 'desc' },
      take: 100
    });
    return res.json(history);
  }

  if (!group) return res.status(400).json({ error: 'group query param required' });
  const groupId = parseInt(group);

  // Fetch latest engineered features for this group
  const latest = await prisma.feature.findFirst({
    where: { groupId },
    orderBy: { featureDate: 'desc' }
  });
  if (!latest) {
    return res.status(404).json({
      error: 'No features found. Run pipeline.py first to engineer features.'
    });
  }

  let mlResponse;
  try {
    mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/predict`,
      {
        group_id: groupId,
        horizon: parseInt(horizon),
        features: [latest.rollingAvg4w, latest.trendSlope, latest.rsvpRate, latest.feedbackAvg]
      }
    );
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({
        error: 'No trained model for this group. Run train.py first.'
      });
    }
    return res.status(502).json({ error: 'ML service unavailable', detail: err.message });
  }

  const data = mlResponse.data;

  // Persist forecast record
  const forecast = await prisma.forecast.create({
    data: {
      groupId,
      forecastDate: new Date(),
      horizonWeeks: parseInt(horizon),
      predictedHeadcount: data.predicted_headcount,
      confidenceLower: data.confidence_lower,
      confidenceUpper: data.confidence_upper
    }
  });

  // Alert logic: drop > 15% → drop alert; growth > 10% → growth alert
  const dropPct = (latest.rollingAvg4w - data.predicted_headcount) / (latest.rollingAvg4w || 1);
  const growthPct = (data.predicted_headcount - latest.rollingAvg4w) / (latest.rollingAvg4w || 1);
  //Threshold: Drop > 15% triggers a Pastoral Intervention Alert
  let alert = null;
  if (dropPct > 0.15) {
    alert = await prisma.alert.create({
      data: {
        forecastId: forecast.id,
        groupId,
        alertType: 'drop',
        message: `Attendance may drop ${Math.round(dropPct * 100)}% in the next ${horizon} week(s).`,
        recommendation: 'Consider hosting a reconnection event or follow-up calls for absent members.'
      }
    });
    //Threshold: Growth > 10% triggers a Resource Preparation Alert
  } else if (growthPct > 0.10) {
    alert = await prisma.alert.create({
      data: {
        forecastId: forecast.id,
        groupId,
        alertType: 'growth',
        message: `Attendance growth of ${Math.round(growthPct * 100)}% forecast over the next ${horizon} week(s).`,
        recommendation: 'Prepare additional seating and resources for the growing group.'
      }
    });
  }

  // Return forecast + last 12 weeks of historical attendance for the chart
  const historical = await prisma.attendance.findMany({
    where: { groupId },
    orderBy: { sessionDate: 'asc' },
    take: 12
  });

  res.json({ forecast, alert, historical });
});

// GET /api/forecast/:groupId
router.get('/:groupId', requireRole(['pastor', 'admin', 'analyst']), async (req, res) => {
  const groupId = parseInt(req.params.groupId);

  const historical = await prisma.attendance.findMany({
    where: { groupId },
    orderBy: { sessionDate: 'desc' },
    take: 5
  });
  historical.reverse();

  const latestFeature = await prisma.feature.findFirst({
    where: { groupId },
    orderBy: { featureDate: 'desc' }
  });

  const chartData = [];
  
  // 5 historical
  historical.forEach(h => {
    chartData.push({
      date: new Date(h.sessionDate).toISOString().split('T')[0],
      actual: h.headcount,
      predicted: null,
      lowerBound: null,
      upperBound: null
    });
  });

  if (!latestFeature) return res.json(chartData);

  // 5 predicted
  let currRolling = latestFeature.rollingAvg4w;
  let currTrend = latestFeature.trendSlope;
  const rsvp = latestFeature.rsvpRate;
  const fback = latestFeature.feedbackAvg;

  let lastDate = historical.length > 0 ? new Date(historical[historical.length - 1].sessionDate) : new Date();

  for (let i = 1; i <= 5; i++) {
    try {
      const mlResponse = await axios.post(
        `${process.env.ML_SERVICE_URL || 'http://localhost:5001'}/predict`,
        { group_id: groupId, features: [currRolling, currTrend, rsvp, fback] }
      );
      
      const pred = mlResponse.data.predicted_headcount;
      const lo = mlResponse.data.confidence_lower;
      const hi = mlResponse.data.confidence_upper;

      lastDate = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      chartData.push({
        date: lastDate.toISOString().split('T')[0],
        actual: null,
        predicted: pred,
        lowerBound: lo,
        upperBound: hi
      });

      // Update features for next step (simple heuristic)
      currTrend = (pred - currRolling) / 4;
      currRolling = (currRolling * 3 + pred) / 4;
    } catch (e) {
      break;
    }
  }

  res.json(chartData);
});

module.exports = router;
