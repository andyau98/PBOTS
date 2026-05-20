@echo off
cd /d "%~dp0"
title PBOTS Machine Control

echo.
echo ╔══════════════════════════════════╗
echo ║       PBOTS Machine Control     ║
echo ╚══════════════════════════════════╝
echo.

:: Kill existing processes
echo [1/3] Stopping old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Clean locks
echo [2/3] Cleaning lock files...
if exist ".wwebjs_auth\session-pbots-client\SingletonLock" del /f ".wwebjs_auth\session-pbots-client\SingletonLock" >nul 2>&1
if exist ".wwebjs_auth\session-pbots-client\Default\SingletonLock" del /f ".wwebjs_auth\session-pbots-client\Default\SingletonLock" >nul 2>&1

:: Start
echo [3/3] Starting PBOTS...
echo.
node src\index.js

echo.
echo ════════════════════════════════════
echo PBOTS stopped. Closing window...
echo ════════════════════════════════════
timeout /t 3 /nobreak >nul
exit
