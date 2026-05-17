# Faith Organization Growth Forecasting System

> Utilizing SVR in Forecasting Faith organization Growth Trends from Longitudinal Feedback Data

## Stack
- **Client**: React + Vite + Tailwind CSS v3 + Recharts
- **Server**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL 16 (via Docker)
- **ML**: Python 3.11 + FastAPI + scikit-learn SVR

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 18+
- Python 3.11+

### 1. Start PostgreSQL
```bash
docker compose up -d
```

### 2. Server setup
```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. ML microservice setup
```bash
cd ml
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python pipeline.py             # engineer features
python train.py                # train SVR per group
uvicorn service:app --port 5001 --reload
```

### 4. Client setup
```bash
cd client
npm install
npm run dev
```

### 5. Start server
```bash
cd server
node index.js
```

## URLs
| Service | URL |
|---------|-----|
| React client | http://localhost:5173 |
| Express API | http://localhost:3001 |
| ML microservice | http://localhost:5001 |
| FastAPI docs | http://localhost:5001/docs |

## Default Seed Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@church.com | Admin1234! |
| Pastor | pastor@church.com | Pastor123! |
| Usher | usher@church.com | Usher1234! |
| Member | member@church.com | Member123! |

## Run Tests
```bash
cd server && npm test
cd ml && python -m pytest tests/
```

## Ethics Audit
See `docs/ethics_audit.md` for SQL queries to confirm data minimisation.
