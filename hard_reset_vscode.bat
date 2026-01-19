@echo off
echo WARNING: This script will forcibly close VS Code to clear its cache.
echo Save all work before proceeding!
echo.
pause
echo.
echo Killing VS Code processes...
taskkill /F /IM Code.exe >nul 2>&1
echo.
echo Clearing VS Code Cache...
cd /d "%APPDATA%\Code"
if exist "Cache" rmdir /s /q "Cache"
if exist "CachedData" rmdir /s /q "CachedData"
if exist "GPUCache" rmdir /s /q "GPUCache"
if exist "Code Cache" rmdir /s /q "Code Cache"
if exist "DawnCache" rmdir /s /q "DawnCache"
echo.
echo Cache cleared.
echo.
echo Restarting VS Code...
start "" "C:\Users\akasc\AppData\Local\Programs\Microsoft VS Code\Code.exe" "d:\App Development\v0\saa-s-crm-dashboard"
echo.
echo Done. You can close this window.
pause
