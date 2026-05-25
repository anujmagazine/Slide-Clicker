@echo off
title Slide Clicker
color 0A
cls

:: Make sure we run from the folder where this bat file lives,
:: even if the user runs it as Administrator (which defaults to System32)
cd /d "%~dp0"

echo.
echo   ==========================================
echo     SLIDE CLICKER  ^|  AI-Powered Remote
echo   ==========================================
echo.

:: ── Find Node.js ──────────────────────────────────────────
:: Try PATH first
node --version >nul 2>&1
if %errorlevel% equ 0 goto :ready

:: Try common Windows install locations
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    goto :ready
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    goto :ready
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    goto :ready
)

:: Node.js genuinely not installed
color 0C
cls
echo.
echo   ==========================================
echo     Oops! Node.js is not installed.
echo   ==========================================
echo.
echo   To use Slide Clicker you need to install
echo   Node.js first. It's free and takes 2 mins.
echo.
echo   1. Go to:  https://nodejs.org
echo   2. Click the big green "Download" button
echo   3. Install it (keep all default settings)
echo   4. Come back and double-click this file again
echo.
echo   ==========================================
echo.
pause
start https://nodejs.org
exit

:ready
echo   Node.js found.
echo.

:: ── First time setup ──────────────────────────────────────
if not exist "node_modules" (
    echo   First time setup - installing packages...
    echo   This takes about 30 seconds and only happens once.
    echo.
    call npm install --silent
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo   Something went wrong during setup.
        echo   Please check your internet connection and try again.
        echo.
        pause
        exit
    )
    echo   Setup complete!
    echo.
)

echo   Starting Slide Clicker...
echo.
echo   Your browser will open automatically in a moment.
echo.
echo   Keep this window open while presenting.
echo   Press Ctrl+C here to stop the app.
echo.
echo   ==========================================
echo.

node server.js

echo.
echo   Slide Clicker has stopped.
pause
