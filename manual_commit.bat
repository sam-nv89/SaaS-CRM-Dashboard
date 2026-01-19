@echo off
setlocal
echo ===============================================
echo  MANUAL GIT COMMIT TOOL (EXTERNAL TERMINAL)
echo ===============================================
echo.
echo This script works OUTSIDE VS Code, so it cannot hang.
echo.

cd /d "d:\App Development\v0\saa-s-crm-dashboard" || exit /b

echo [1] Checking status...
git status
echo.

set /p DO_COMMIT="Commit all changes? (y/n): "
if /i "%DO_COMMIT%" neq "y" goto end

echo.
set /p MSG="Enter commit message: "
if "%MSG%"=="" set "MSG=manual wip"

echo [2] Adding files...
git add .

echo [3] Committing...
git commit -m "%MSG%"

echo [4] Pushing...
git push

echo.
echo SUCCESS.
pause
exit /b

:end
echo Cancelled.
pause
