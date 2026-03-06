@echo off
REM start-dev.cmd - opens two cmd windows and runs backend and frontend dev servers

SET ROOT_DIR=%~dp0

echo Starting backend in new cmd window...
start "Backend" cmd /k "cd /d "%ROOT_DIR%backend" && echo Installing backend deps... && npm install && echo Starting backend... && npm run dev"

echo Starting frontend in new cmd window...
start "Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && echo Installing frontend deps... && npm install && echo Starting frontend... && npm run dev"

echo Launched both processes.
exit /b 0
