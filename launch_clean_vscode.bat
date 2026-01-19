@echo off
echo ==========================================
echo LAUNCHING VS CODE WITH CLEAN PROFILE
echo ==========================================
echo.
echo This will start VS Code with:
echo - NO extensions
echo - NO user settings
echo - Fresh temporary profile
echo.
echo Your normal VS Code is NOT affected.
echo.
pause

:: Create temp directory for clean profile
set "CLEAN_PROFILE=%TEMP%\vscode-clean-profile"
if not exist "%CLEAN_PROFILE%" mkdir "%CLEAN_PROFILE%"

echo Starting VS Code with clean profile...
start "" "C:\Users\akasc\AppData\Local\Programs\Microsoft VS Code\Code.exe" --user-data-dir="%CLEAN_PROFILE%" --extensions-dir="%CLEAN_PROFILE%\extensions" "d:\App Development\v0\saa-s-crm-dashboard"

echo.
echo VS Code should open in a new window.
echo.
echo TEST INSTRUCTIONS:
echo 1. In the NEW window, press Ctrl+` to open terminal
echo 2. Type: echo "hello"
echo 3. If it works - the problem is in your extensions/settings
echo 4. If it hangs - the problem is in VS Code itself or Windows
echo.
pause
