@echo off
echo ===================================================
echo  Congregate - Post-Restart Startup Script
echo ===================================================
echo.

:: Ensure Docker Desktop is running (it should auto-start after reboot)
echo [1/5] Waiting for Docker to be ready...
timeout /t 10 /nobreak > nul

:: Start Postgres
echo [2/5] Starting PostgreSQL container...
docker compose up -d
timeout /t 5 /nobreak > nul

:: Run Prisma migrations + seed
echo [3/5] Running Prisma migrations...
cd server
call npx prisma migrate dev --name init
echo [4/5] Seeding database with 3 groups + 52 weeks of data...
call npx prisma db seed

:: Run ML pipeline + train
echo [5/5] Running feature pipeline and training SVR models...
cd ..\ml
call .\venv\Scripts\python pipeline.py
call .\venv\Scripts\python train.py

echo.
echo ===================================================
echo  Setup complete! Now start each service:
echo.
echo  Terminal 1 (Server):  cd server ^&^& node index.js
echo  Terminal 2 (Client):  cd client ^&^& npm run dev
echo  Terminal 3 (ML):      cd ml ^&^& .\venv\Scripts\uvicorn service:app --port 5001 --reload
echo.
echo  Then open: http://localhost:5173
echo  Login:     admin@church.com / Admin1234!
echo ===================================================
pause
