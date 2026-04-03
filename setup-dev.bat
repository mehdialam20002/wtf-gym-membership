@echo off
echo ===================================
echo  APEX GYM - Starting Dev Servers
echo ===================================
echo.
echo Starting backend on http://localhost:5000
start "APEX GYM Backend" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak >nul

echo Starting frontend on http://localhost:5173
start "APEX GYM Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers starting in separate windows.
echo  Backend:  http://localhost:5000/health
echo  Frontend: http://localhost:5173
echo  Admin:    http://localhost:5173/admin/login
echo.
echo Press any key to exit this window...
pause >nul
