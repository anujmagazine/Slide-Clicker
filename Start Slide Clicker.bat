@echo off
title Slide Clicker
color 0A
cls

echo.
echo   ==========================================
echo     SLIDE CLICKER  ^|  AI-Powered Remote
echo   ==========================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
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
)

:: First time? Install packages automatically
if not exist "node_modules" (
    echo   First time setup — installing packages...
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

:: Start the app
node server.js

echo.
echo   Slide Clicker has stopped.
pause
