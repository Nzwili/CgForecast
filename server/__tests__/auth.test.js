require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

let adminToken, pastorToken, analystToken;

beforeAll(async () => {
  // Get tokens from seed accounts
  const adminRes = await request(app).post('/api/auth/login')
    .send({ email: 'grace@church.org', password: 'demo123' });
  adminToken = adminRes.body.token;

  const pastorRes = await request(app).post('/api/auth/login')
    .send({ email: 'samuel@church.org', password: 'demo123' });
  pastorToken = pastorRes.body.token;

  // Simulate analyst token if not seeded or use pastor as baseline
  const analystRes = await request(app).post('/api/auth/login')
    .send({ email: 'samuel@church.org', password: 'demo123' });
  analystToken = analystRes.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication & Role Security', () => {
  
  describe('Login Flow', () => {
    it('should login with valid Admin credentials', async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ email: 'grace@church.org', password: 'demo123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('role', 'admin');
    });

    it('should reject invalid password', async () => {
      const res = await request(app).post('/api/auth/login')
        .send({ email: 'grace@church.org', password: 'wrong' });
      expect(res.status).toBe(401);
    });
  });

  describe('Permission Guarding', () => {
    it('should allow Admin to access stats', async () => {
      const res = await request(app).get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it('should allow Pastor to access forecasts', async () => {
      const res = await request(app).get('/api/forecast?group=1')
        .set('Authorization', `Bearer ${pastorToken}`);
      expect(res.status).toBe(200);
    });

    it('should block Pastor from triggering SVR retrain (Admin only)', async () => {
      const res = await request(app).post('/api/admin/retrain')
        .set('Authorization', `Bearer ${pastorToken}`);
      // Based on our auth.js requireRole(['admin'])
      expect(res.status).toBe(403);
    });
  });

  describe('Data Integrity', () => {
    it('should return groups for authenticated users', async () => {
      const res = await request(app).get('/api/groups')
        .set('Authorization', `Bearer ${pastorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
