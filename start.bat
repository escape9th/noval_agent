@echo off
chcp 65001 >nul
title NovelAgent
echo ========================================
echo    NovelAgent - Novel Writing Assistant
echo ========================================
echo.
echo Starting server...
start "NovelAgent Server" cmd /c "cd /d F:\noval_agent\server && npm run dev"
timeout /t 3 /nobreak >nul
echo Starting client...
start "NovelAgent Client" cmd /c "cd /d F:\noval_agent\client && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Done! Opening browser...
start http://localhost:5173
echo.
echo Closing this window will NOT stop the services.
echo To stop, close the "NovelAgent Server" and "NovelAgent Client" windows.
echo.
pause
