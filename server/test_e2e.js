const axios = require('axios');
const fs = require('fs');

async function run() {
  const api = axios.create({ baseURL: 'http://127.0.0.1:3001' });
  let token = '';

  // 1. Register Admin
  console.log('1. Registering Admin...');
  try {
    const res = await api.post('/api/auth/register', {
      name: 'QA Admin',
      email: 'qa@church.org',
      password: 'password123',
      role: 'admin',
      church: 'Test Church'
    });
    console.log('Registered Admin:', res.data);
  } catch (e) {
    console.log('Admin probably exists, logging in instead...');
  }

  const loginRes = await api.post('/api/auth/login', {
    email: 'qa@church.org',
    password: 'password123'
  });
  token = loginRes.data.token;
  console.log('Got token:', token.substring(0, 20) + '...');
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // 2. Create Group
  console.log('2. Creating Group...');
  const groupRes = await api.post('/api/groups', {
    name: 'Youth Group (18-30)',
    category: 'youth'
  });
  const groupId = groupRes.data.id;
  console.log('Created Group ID:', groupId);

  // 3. Upload CSV (simulating frontend parsing)
  console.log('3. Uploading CSV...');
  const csvText = fs.readFileSync('test_attendance_youth_group.csv', 'utf8');
  const lines = csvText.trim().split('\n').slice(1);
  const rows = lines.map(line => {
    const parts = line.split(',');
    return {
      sessionDate: parts[0],
      headcount: parseInt(parts[1]),
      // We map participation_rate to rsvpCount just to pass some data, though not required
      rsvpCount: 0 
    };
  });

  const importRes = await api.post('/api/admin/import', {
    groupId,
    rows
  });
  console.log('Import result:', importRes.data);

  // 4. Trigger ML Pipeline
  console.log('4. Triggering ML Pipeline...');
  const mlRes = await api.post('/api/ml/train-all');
  console.log('ML Pipeline result:', mlRes.data);

  // 5. Get Metrics
  console.log('5. Getting Metrics...');
  const metricsRes = await api.get('/api/ml/accuracy');
  const groupMetrics = metricsRes.data.groups.find(g => g.groupId === groupId);
  console.log('Group Metrics:', groupMetrics);
}

run().catch(console.error);
