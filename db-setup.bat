@echo off
echo ===================================
echo  APEX GYM - Database Setup
echo ===================================
echo.
echo This will push the Prisma schema and seed the database.
echo Make sure PostgreSQL is running and .env is configured!
echo.
pause

cd /d %~dp0backend

echo [1/2] Pushing Prisma schema to database...
call npx prisma db push
if %errorlevel% neq 0 (echo ERROR: DB push failed. Check your DATABASE_URL in .env & pause & exit /b 1)

echo.
echo [2/2] Seeding database with sample plans...
call node src/utils/seed.js
if %errorlevel% neq 0 (echo ERROR: Seeding failed & pause & exit /b 1)

echo.
echo ===================================
echo  Database ready!
echo  Admin: admin@wtfgyms.com / admin123
echo  10 Gyms + 12 Plans seeded!
echo ===================================
pause
