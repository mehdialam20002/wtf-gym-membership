@echo off
echo ===================================
echo  APEX GYM - Setup Script
echo ===================================
echo.

echo [1/4] Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (echo ERROR: Backend npm install failed & pause & exit /b 1)

echo.
echo [2/4] Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (echo ERROR: Prisma generate failed & pause & exit /b 1)

echo.
echo [3/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (echo ERROR: Frontend npm install failed & pause & exit /b 1)

echo.
echo ===================================
echo  Setup Complete!
echo ===================================
echo.
echo NEXT STEPS:
echo  1. Make sure PostgreSQL is running
echo  2. Edit backend\.env with your DB credentials
echo  3. Run: cd backend ^& npx prisma db push ^& node src/utils/seed.js
echo  4. Run setup-dev.bat to start both servers
echo.
pause
